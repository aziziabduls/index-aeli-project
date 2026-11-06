import { pool } from '../db.js';
import { payoutService } from './payout.service.js';

export interface PaymentItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface CreatePaymentInput {
  orderId?: string;
  bookingCode?: string;
  items?: PaymentItem[];
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethodId?: string;
  programName?: string;
  experienceName?: string;
  locationName?: string;
  pax?: number;
}

export interface CreatePaymentResult {
  orderId: string;
  bookingCode: string;
  token: string;
  redirectUrl: string;
  amount: number;
}

export interface RefundParams {
  orderId: string;
  amount: number;
  reason?: string;
  refundKey?: string;
}

export interface WebhookResult {
  orderId: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PENDING' | string;
  bookingStatus: string;
  paymentStatus: string;
}

export class HooplePaymentService {
  private getPaymentConfig() {
    const url = process.env.HOOPLE_PAYMENT_URL || 'https://dev-api-payment.hoople.co.id';
    const apiKey = process.env.HOOPLE_PAYMENT_API_KEY || 'HoPay-IDX-X4756jrAUrkSCTX4ZExElYeU7fXVisf0';
    const clientId = process.env.HOOPLE_PAYMENT_CLIENT_ID || '550e8400-e29b-41d4-a716-446655440000';
    const callbackUrl = process.env.HOOPLE_PAYMENT_CALLBACK_URL || 'http://localhost:7009/api/v1/payments/webhook';
    const finishUrl = process.env.HOOPLE_PAYMENT_FINISH_URL || 'http://localhost:3001/booking/finish';

    return { url, apiKey, clientId, callbackUrl, finishUrl };
  }

  private normalizePaymentMethod(id?: string): string {
    if (!id) return 'other_qris';
    const norm = id.replace(/^pm-/, '').replace(/-/g, '_').toLowerCase();
    if (norm === 'qris' || norm === 'other_qris' || norm.includes('qris')) return 'other_qris';
    if (norm === 'card' || norm === 'credit_card' || norm.includes('credit')) return 'credit_card';
    if (norm === 'bca' || norm === 'bca_va') return 'bca_va';
    if (norm === 'bni' || norm === 'bni_va') return 'bni_va';
    if (norm === 'bri' || norm === 'bri_va') return 'bri_va';
    if (norm === 'cimb' || norm === 'cimb_va') return 'cimb_va';
    if (norm === 'permata' || norm === 'permata_va') return 'permata_va';
    if (norm === 'mandiri' || norm === 'mandiri_va' || norm === 'other_va') return 'other_va';
    if (norm === 'gopay') return 'gopay';
    if (norm === 'shopeepay' || norm.includes('shopee')) return 'shopeepay';
    if (norm === 'indomaret') return 'indomaret';
    if (norm === 'kredivo') return 'kredivo';
    if (norm === 'akulaku') return 'akulaku';
    if (norm === 'uob_ezpay') return 'uob_ezpay';
    return norm;
  }

  /**
   * 1. Create Payment on Hoople Payment Gateway
   */
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const config = this.getPaymentConfig();
    const normalizedMethod = this.normalizePaymentMethod(input.paymentMethodId);

    const bookingCode = input.bookingCode || `AELI-${Math.floor(1000 + Math.random() * 9000)}-INDO`;
    const programName = input.programName || 'Indonesian Signature Tour Program';
    const experienceName = input.experienceName || 'Scenic Tour Experience';
    const locationName = input.locationName || 'Indonesia';
    const pax = input.pax || 1;
    const amount = Number(input.amount) || 0;

    const items: PaymentItem[] =
      Array.isArray(input.items) && input.items.length > 0
        ? input.items.map((i, idx) => ({
          id: i.id || `item-${idx + 1}`,
          name: (i.name || programName).slice(0, 50),
          quantity: Number(i.quantity) || 1,
          price: Number(i.price) || amount
        }))
        : [
          {
            id: `item-${Date.now()}`,
            name: programName.slice(0, 50),
            quantity: pax,
            price: Math.round(amount / Math.max(1, pax))
          }
        ];

    const payload = {
      items,
      amount,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone || '081234567890',
      paymentMethod: normalizedMethod,
      callbackUrl: config.callbackUrl,
      finishUrl: config.finishUrl
    };

    console.log('[Hoople Payment] Requesting create payment to:', `${config.url}/payment`);

    const response = await fetch(`${config.url}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'x-client-id': config.clientId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Hoople Payment] Upstream Error:', errText);
      throw {
        status: response.status >= 400 && response.status < 500 ? response.status : 502,
        code: 'PAYMENT_GATEWAY_ERROR',
        message: `Hoople Payment gateway returned ${response.status}: ${errText}`
      };
    }

    const json = (await response.json()) as any;
    if (json.status_code !== 'SUCCESSFUL' || !json.content) {
      throw {
        status: 502,
        code: 'PAYMENT_GATEWAY_ERROR',
        message: json.message || 'Payment API returned unsuccessful status_code'
      };
    }

    const { orderId, token, redirectUrl, paymentUrl } = json.content;
    const finalRedirectUrl = redirectUrl || paymentUrl || '';
    const platformFee = Math.round(amount * 0.05);
    const netPayout = amount - platformFee;

    // Persist to identity.transactions
    await pool.query(
      `INSERT INTO identity.transactions (
         order_id, booking_code, customer_name, customer_email, customer_phone,
         program_name, experience_name, location_name, pax, gross_amount,
         platform_fee, net_payout, payment_method, payment_token, payment_url,
         status, raw_response, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', $16, NOW(), NOW())
       ON CONFLICT (order_id) DO UPDATE SET
         booking_code = EXCLUDED.booking_code,
         payment_token = EXCLUDED.payment_token,
         payment_url = EXCLUDED.payment_url,
         updated_at = NOW();`,
      [
        orderId,
        bookingCode,
        input.customerName,
        input.customerEmail,
        input.customerPhone || '-',
        programName,
        experienceName,
        locationName,
        pax,
        amount,
        platformFee,
        netPayout,
        normalizedMethod,
        token,
        finalRedirectUrl,
        JSON.stringify(json.content)
      ]
    );

    // Also persist into identity.web_registrations
    await pool.query(
      `INSERT INTO identity.web_registrations (
         order_id, booking_code, customer_name, customer_email, customer_phone,
         program_name, experience_name, location_name, pax, gross_amount,
         payment_method, payment_token, payment_url, billing_status, joined, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending', NOW(), NOW(), NOW())
       ON CONFLICT (booking_code) DO UPDATE SET
         order_id = EXCLUDED.order_id,
         payment_token = EXCLUDED.payment_token,
         payment_url = EXCLUDED.payment_url,
         updated_at = NOW();`,
      [
        orderId,
        bookingCode,
        input.customerName,
        input.customerEmail,
        input.customerPhone || '-',
        programName,
        experienceName,
        locationName,
        pax,
        amount,
        normalizedMethod,
        token,
        finalRedirectUrl
      ]
    );

    return {
      orderId,
      bookingCode,
      token,
      redirectUrl: finalRedirectUrl,
      amount
    };
  }

  /**
   * 2. Check Payment Status by Order ID
   */
  async checkPaymentStatus(orderId: string): Promise<any> {
    const config = this.getPaymentConfig();

    // Fetch local record first
    const { rows } = await pool.query(
      `SELECT * FROM identity.transactions WHERE order_id = $1 OR booking_code = $1 LIMIT 1;`,
      [orderId]
    );

    let localRecord = rows[0] || null;
    const targetOrderId = localRecord ? localRecord.order_id : orderId;

    // Query upstream gateway
    try {
      const response = await fetch(`${config.url}/payment/status`, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'x-client-id': config.clientId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId: targetOrderId })
      });

      if (response.ok) {
        const json = (await response.json()) as any;
        const gatewayData = json.data || json.content || json;

        // Multi-candidate status resolution from upstream gateway response
        const rawStatus = (
          gatewayData.currentStatus ||
          gatewayData.current_status ||
          gatewayData.paymentStatus ||
          gatewayData.payment_status ||
          gatewayData.transactionStatus ||
          gatewayData.transaction_status ||
          gatewayData.status ||
          ''
        ).toUpperCase();

        if (rawStatus) {
          await this.processPaymentWebhook({
            orderId: targetOrderId,
            status: rawStatus,
            currentStatus: rawStatus,
            paymentMethod: gatewayData.paymentType || (localRecord ? localRecord.payment_method : undefined),
            issuer: gatewayData.issuer || null,
            gateway: gatewayData
          });

          // Fetch freshly updated transaction record from database
          const { rows: updatedRows } = await pool.query(
            `SELECT * FROM identity.transactions WHERE order_id = $1 OR booking_code = $1 LIMIT 1;`,
            [targetOrderId]
          );
          if (updatedRows.length > 0) {
            localRecord = updatedRows[0];
          }
        }

        return {
          orderId: localRecord ? localRecord.order_id : targetOrderId,
          bookingCode: localRecord ? localRecord.booking_code : null,
          status: localRecord ? localRecord.status : 'pending',
          grossAmount: localRecord ? parseFloat(localRecord.gross_amount) : 0,
          customerName: localRecord ? localRecord.customer_name : null,
          customerEmail: localRecord ? localRecord.customer_email : null,
          programName: localRecord ? localRecord.program_name : null,
          experienceName: localRecord ? localRecord.experience_name : null,
          paymentMethod: localRecord ? localRecord.payment_method : null,
          issuer: localRecord ? localRecord.issuer : null,
          gateway: gatewayData
        };
      }
    } catch (err) {
      console.warn('[Hoople Payment] Status check upstream fallback:', err);
    }

    if (!localRecord) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: `Transaction not found for orderId: ${orderId}`
      };
    }

    return {
      orderId: localRecord.order_id,
      bookingCode: localRecord.booking_code,
      status: localRecord.status,
      grossAmount: parseFloat(localRecord.gross_amount),
      customerName: localRecord.customer_name,
      customerEmail: localRecord.customer_email,
      programName: localRecord.program_name,
      experienceName: localRecord.experience_name,
      paymentMethod: localRecord.payment_method,
      issuer: localRecord.issuer,
      createdAt: localRecord.created_at
    };
  }

  /**
   * Sync all pending transactions against Hoople Payment upstream
   */
  async syncAllPendingTransactions(): Promise<{ synced: number; cleared: number; list: any[] }> {
    const { rows: pendingList } = await pool.query(
      `SELECT order_id, booking_code, status FROM identity.transactions
       WHERE status = 'pending'
       ORDER BY created_at DESC
       LIMIT 50;`
    );

    let clearedCount = 0;
    const results: any[] = [];

    for (const trx of pendingList) {
      try {
        const res = await this.checkPaymentStatus(trx.order_id);
        if (res && res.status === 'cleared') {
          clearedCount++;
        }
        results.push({ orderId: trx.order_id, status: res.status });
      } catch (err) {
        console.warn(`[Sync] Failed to sync order ${trx.order_id}:`, err);
      }
    }

    return {
      synced: pendingList.length,
      cleared: clearedCount,
      list: results
    };
  }

  /**
   * 3. Process Inbound Webhook (Forensic Resolution Ladder)
   */
  async processPaymentWebhook(body: any): Promise<WebhookResult> {
    console.log('[Hoople Payment Webhook] Received payload:', JSON.stringify(body, null, 2));

    // Multi-property extraction for order identifier
    const orderId =
      body.orderId ||
      body.order_id ||
      body.bookingId ||
      body.booking_id ||
      body.bookingCode ||
      body.booking_code ||
      body.id ||
      body.data?.orderId ||
      body.data?.order_id ||
      body.content?.orderId ||
      body.content?.order_id ||
      body.gateway?.orderId ||
      body.gateway?.order_id ||
      body.content?.midtrans?.order_id ||
      body.midtrans?.order_id;

    // Multi-candidate status resolution (supports currentStatus from Hoople upstream)
    const rawCandidates: string[] = [
      body.status,
      body.currentStatus,
      body.current_status,
      body.paymentStatus,
      body.payment_status,
      body.bookingStatus,
      body.booking_status,
      body.transaction_status,
      body.transactionStatus,
      body.newStatus,
      body.data?.currentStatus,
      body.data?.current_status,
      body.data?.paymentStatus,
      body.data?.payment_status,
      body.data?.transactionStatus,
      body.data?.transaction_status,
      body.data?.status,
      body.gateway?.currentStatus,
      body.gateway?.current_status,
      body.gateway?.payment_status,
      body.gateway?.paymentStatus,
      body.gateway?.transaction_status,
      body.gateway?.transactionStatus,
      body.gateway?.status,
      body.content?.currentStatus,
      body.content?.paymentStatus,
      body.content?.midtransStatus,
      body.content?.midtrans?.transaction_status,
      body.content?.status,
      body.midtrans?.transaction_status
    ]
      .filter(Boolean)
      .map((s) => String(s).trim().toUpperCase());

    const SUCCESS_SET = new Set([
      'SUCCESS', 'SUCCESSFUL', 'SETTLEMENT', 'CAPTURE', 'PAID', 'CONFIRMED',
      'COMPLETED', 'COMPLETE', 'ACCEPT', 'ACCEPTED', 'APPROVED', '00', '200'
    ]);
    const FAILED_SET = new Set([
      'FAILED', 'FAILURE', 'FAIL', 'DENY', 'DENIED', 'CANCEL', 'CANCELLED',
      'CANCELED', 'EXPIRE', 'EXPIRED', 'REJECT', 'REJECTED'
    ]);
    const REFUNDED_SET = new Set(['REFUND', 'REFUNDED']);
    const PENDING_SET = new Set(['PENDING', 'UNPAID', 'WAITING', 'CHALLENGE', 'AUTHORIZE', 'AUTHORIZED']);

    let status = rawCandidates[0] || 'PENDING';
    if (rawCandidates.some((c) => SUCCESS_SET.has(c))) {
      status = 'SUCCESS';
    } else if (rawCandidates.some((c) => REFUNDED_SET.has(c))) {
      status = 'REFUNDED';
    } else if (rawCandidates.some((c) => FAILED_SET.has(c))) {
      status = 'FAILED';
    } else if (rawCandidates.some((c) => PENDING_SET.has(c))) {
      status = 'PENDING';
    }

    if (!orderId) {
      throw {
        status: 422,
        code: 'VALIDATION_ERROR',
        message: 'Missing required orderId in webhook payload'
      };
    }

    // Find in identity.transactions
    const { rows: trxRows } = await pool.query(
      `SELECT * FROM identity.transactions WHERE order_id = $1 OR booking_code = $1 LIMIT 1;`,
      [orderId]
    );

    if (trxRows.length === 0) {
      console.warn(`[Webhook] No matching transaction found for orderId: ${orderId}`);
      // Still return 200 to acknowledge webhook so provider doesn't bombard retries
      return {
        orderId,
        status,
        bookingStatus: 'not_found',
        paymentStatus: status.toLowerCase()
      };
    }

    const trx = trxRows[0];

    const paymentMethod =
      body.paymentMethod ||
      body.payment_method ||
      body.content?.paymentMethod ||
      body.gateway?.payment_type ||
      body.gateway?.paymentMethod ||
      body.midtrans?.payment_type ||
      trx.payment_method;

    const issuer =
      body.issuer ||
      body.issuer_name ||
      body.gateway?.issuer ||
      body.gateway?.issuer_name ||
      body.content?.issuer ||
      body.midtrans?.issuer ||
      trx.issuer ||
      null;

    let dbTrxStatus = trx.status;
    let dbBillingStatus = 'Pending';

    if (status === 'SUCCESS') {
      dbTrxStatus = 'cleared';
      dbBillingStatus = 'Paid';
    } else if (status === 'FAILED') {
      dbTrxStatus = 'failed';
      dbBillingStatus = 'Failed';
    } else if (status === 'REFUNDED') {
      dbTrxStatus = 'refunded';
      dbBillingStatus = 'Refunded';
    } else if (status === 'PENDING') {
      dbTrxStatus = 'pending';
      dbBillingStatus = 'Pending';
    }

    // Update identity.transactions
    await pool.query(
      `UPDATE identity.transactions
       SET status = $1, payment_method = $2, issuer = $3, raw_webhook = $4, updated_at = NOW()
       WHERE id = $5;`,
      [dbTrxStatus, paymentMethod, issuer, JSON.stringify(body), trx.id]
    );

    // Update identity.web_registrations
    await pool.query(
      `UPDATE identity.web_registrations
       SET billing_status = $1, payment_method = $2, issuer = $3, updated_at = NOW()
       WHERE booking_code = $4 OR order_id = $5;`,
      [dbBillingStatus, paymentMethod, issuer, trx.booking_code, trx.order_id]
    );

    // If Payment is SUCCESSFUL, record into payout profile & create operator notification
    if (status === 'SUCCESS' && trx.status !== 'cleared') {
      const grossAmount = parseFloat(trx.gross_amount || '0');
      const platformFee = Math.round(grossAmount * 0.05);
      const netPayout = grossAmount - platformFee;

      try {
        await pool.query(
          `INSERT INTO identity.notifications (title, message, type, link, is_read, created_at)
           VALUES ($1, $2, 'success', '/dashboard/transactions', false, NOW());`,
          [
            `Payment Cleared: ${trx.order_id}`,
            `Payment of Rp ${grossAmount.toLocaleString('id-ID')} for ${trx.program_name} (${trx.booking_code}) is confirmed via ${paymentMethod || trx.payment_method}.`
          ]
        );
      } catch (err) {
        console.warn('Failed to insert payment clearance notification:', err);
      }

      try {
        const overview = await payoutService.getPayoutOverview();

        const newPurchase = {
          id: `TRX-${trx.order_id}`,
          booking_code: trx.booking_code,
          program_name: trx.program_name,
          experience_name: trx.experience_name,
          customer_name: trx.customer_name,
          customer_email: trx.customer_email,
          customer_phone: trx.customer_phone || '-',
          pax: parseInt(trx.pax || '1', 10),
          gross_amount: grossAmount,
          platform_fee: platformFee,
          net_payout: netPayout,
          payment_method: paymentMethod || trx.payment_method,
          issuer: issuer || trx.issuer,
          date: new Date().toISOString(),
          status: 'cleared'
        };

        const existingPurchases = Array.isArray(overview.recent_purchases) ? overview.recent_purchases : [];
        const isAlreadyRecorded = existingPurchases.some(
          (p: any) => p.booking_code === trx.booking_code || p.id === `TRX-${trx.order_id}`
        );

        if (!isAlreadyRecorded) {
          const updatedPurchases = [newPurchase, ...existingPurchases];
          const newAvailable = (overview.available_balance || 0) + netPayout;

          let updatedHistory = Array.isArray(overview.payout_history) ? overview.payout_history : [];
          let finalAvailable = newAvailable;
          let finalTotalPaidOut = overview.total_paid_out || 0;

          const primaryBank = (overview.bank_accounts || []).find((b: any) => b.is_primary);
          if (overview.auto_payout_enabled && primaryBank && overview.auto_payout_schedule === 'daily') {
            const autoPayoutDisbursed = {
              id: `PO-${Date.now()}`,
              bank_name: primaryBank.bank_name,
              account_number: primaryBank.account_number,
              account_holder: primaryBank.account_holder,
              amount: netPayout,
              transfer_fee: 0,
              reference_code: `AUTO-${Math.floor(10000000 + Math.random() * 90000000)}`,
              status: 'completed',
              type: 'automatic',
              processed_at: new Date().toISOString()
            };
            updatedHistory = [autoPayoutDisbursed, ...updatedHistory];
            finalAvailable = overview.available_balance;
            finalTotalPaidOut += netPayout;
          }

          await pool.query(
            `UPDATE identity.payout_profiles
             SET available_balance = $1, total_paid_out = $2,
                 recent_purchases = $3, payout_history = $4, updated_at = NOW()
             WHERE id = $5;`,
            [
              finalAvailable,
              finalTotalPaidOut,
              JSON.stringify(updatedPurchases),
              JSON.stringify(updatedHistory),
              overview.id
            ]
          );

          console.log(`[Webhook Success] Recorded cleared payment to payout profile for ${trx.order_id}`);
        }
      } catch (err) {
        console.error('[Webhook] Error updating payout profile:', err);
      }
    }

    return {
      orderId,
      status,
      bookingStatus: dbBillingStatus.toLowerCase(),
      paymentStatus: dbTrxStatus
    };
  }

  /**
   * 4. Refund Payment
   */
  async refundPayment(params: RefundParams): Promise<any> {
    const config = this.getPaymentConfig();

    const response = await fetch(`${config.url}/payment/refund`, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'x-client-id': config.clientId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw {
        status: response.status >= 400 && response.status < 500 ? response.status : 502,
        code: 'PAYMENT_GATEWAY_ERROR',
        message: `Refund API responded with status ${response.status}: ${errText}`
      };
    }

    const json = (await response.json()) as any;
    return json.content || json;
  }
}

export const hooplePaymentService = new HooplePaymentService();

