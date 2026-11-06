import { pool } from '../db.js';
import { AppError } from '../errors.js';

export async function getPlatformFeePercent(): Promise<number> {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE((config->>'platform_fee_percent')::numeric, 5) as fee FROM content.app_config WHERE id = 1 LIMIT 1;`
    );
    if (rows.length > 0 && rows[0].fee !== null) {
      const num = Number(rows[0].fee);
      return Number.isNaN(num) ? 5 : num;
    }
  } catch (err) {
    // Non-blocking fallback
  }
  return 5;
}

export interface BankAccountInput {
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_holder: string;
  branch?: string;
}

export class PayoutService {
  async getPayoutOverview() {
    let { rows } = await pool.query(
      `SELECT id, available_balance, pending_balance, total_paid_out,
              auto_payout_enabled, auto_payout_schedule,
              bank_accounts, recent_purchases, payout_history, updated_at
       FROM identity.payout_profiles
       ORDER BY created_at DESC
       LIMIT 1;`
    );

    if (rows.length === 0) {
      const defaultBankAccounts = JSON.stringify([
        {
          id: 'bank_1',
          bank_name: 'Bank Central Asia (BCA)',
          bank_code: 'bca',
          account_number: '8830192841',
          account_holder: 'PT INDEX AELI INDONESIA',
          branch: 'KCU Thamrin Jakarta',
          is_primary: true,
          verified: true
        }
      ]);

      const insertRes = await pool.query(
        `INSERT INTO identity.payout_profiles (
           available_balance, pending_balance, total_paid_out,
           auto_payout_enabled, auto_payout_schedule,
           bank_accounts, recent_purchases, payout_history
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`,
        [48500000.00, 12200000.00, 135000000.00, true, 'daily', defaultBankAccounts, '[]', '[]']
      );
      rows = insertRes.rows;
    }

    const payout = rows[0];
    const feePercent = await getPlatformFeePercent();

    let allPurchases: any[] = [];
    try {
      allPurchases = await this.getTransactions();
    } catch (e) {
      allPurchases = payout.recent_purchases || [];
    }

    const pendingBalance = allPurchases.length > 0
      ? allPurchases
          .filter((t: any) => t.status === 'pending' || t.status === 'pending_clearance')
          .reduce((sum: number, t: any) => sum + (Number(t.net_payout) || 0), 0)
      : parseFloat(payout.pending_balance || '0');

    return {
      id: payout.id,
      available_balance: parseFloat(payout.available_balance || '0'),
      pending_balance: pendingBalance,
      total_paid_out: parseFloat(payout.total_paid_out || '0'),
      platform_fee_percent: feePercent,
      auto_payout_enabled: payout.auto_payout_enabled,
      auto_payout_schedule: payout.auto_payout_schedule || 'daily',
      bank_accounts: payout.bank_accounts || [],
      recent_purchases: allPurchases.length > 0 ? allPurchases : (payout.recent_purchases || []),
      payout_history: payout.payout_history || [],
      updated_at: payout.updated_at
    };
  }

  async addBankAccount(data: BankAccountInput) {
    if (!data.bank_name || !data.account_number || !data.account_holder) {
      throw new AppError('Bank name, account number, and account holder name are required', 400);
    }

    const overview = await this.getPayoutOverview();
    const currentBanks: any[] = overview.bank_accounts || [];

    const newBank = {
      id: `bank_${Date.now()}`,
      bank_name: data.bank_name,
      bank_code: data.bank_code || data.bank_name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      account_number: data.account_number.replace(/\s+/g, ''),
      account_holder: data.account_holder.toUpperCase(),
      branch: data.branch || 'Main Branch',
      is_primary: currentBanks.length === 0,
      verified: true
    };

    const updatedBanks = [...currentBanks, newBank];

    await pool.query(
      `UPDATE identity.payout_profiles
       SET bank_accounts = $1, updated_at = NOW()
       WHERE id = $2;`,
      [JSON.stringify(updatedBanks), overview.id]
    );

    return newBank;
  }

  async deleteBankAccount(bankId: string) {
    const overview = await this.getPayoutOverview();
    const currentBanks: any[] = overview.bank_accounts || [];

    const filtered = currentBanks.filter((b) => b.id !== bankId);

    // If removed bank was primary, assign primary to the first available bank
    if (filtered.length > 0 && !filtered.some((b) => b.is_primary)) {
      filtered[0].is_primary = true;
    }

    await pool.query(
      `UPDATE identity.payout_profiles
       SET bank_accounts = $1, updated_at = NOW()
       WHERE id = $2;`,
      [JSON.stringify(filtered), overview.id]
    );

    return { success: true, removedId: bankId };
  }

  async setPrimaryBankAccount(bankId: string) {
    const overview = await this.getPayoutOverview();
    const currentBanks: any[] = overview.bank_accounts || [];

    const updated = currentBanks.map((b) => ({
      ...b,
      is_primary: b.id === bankId
    }));

    await pool.query(
      `UPDATE identity.payout_profiles
       SET bank_accounts = $1, updated_at = NOW()
       WHERE id = $2;`,
      [JSON.stringify(updated), overview.id]
    );

    return updated;
  }

  async updateSettings(data: { auto_payout_enabled: boolean; auto_payout_schedule: string }) {
    const overview = await this.getPayoutOverview();

    await pool.query(
      `UPDATE identity.payout_profiles
       SET auto_payout_enabled = $1, auto_payout_schedule = $2, updated_at = NOW()
       WHERE id = $3;`,
      [data.auto_payout_enabled, data.auto_payout_schedule, overview.id]
    );

    return { success: true, settings: data };
  }

  async withdrawFunds(amount?: number) {
    const overview = await this.getPayoutOverview();
    const primaryBank = (overview.bank_accounts || []).find((b: any) => b.is_primary);

    if (!primaryBank) {
      throw new AppError('Please add and configure a primary bank account before requesting a payout', 400);
    }

    const withdrawAmount = amount !== undefined && amount > 0 ? amount : overview.available_balance;

    if (withdrawAmount <= 0) {
      throw new AppError('No available balance to withdraw at this time', 400);
    }

    if (withdrawAmount > overview.available_balance) {
      throw new AppError('Withdrawal amount exceeds available balance', 400);
    }

    const newAvailable = overview.available_balance - withdrawAmount;
    const newTotalPaidOut = overview.total_paid_out + withdrawAmount;

    const newPayoutRecord = {
      id: `PO-${Date.now()}`,
      bank_name: primaryBank.bank_name,
      account_number: primaryBank.account_number,
      account_holder: primaryBank.account_holder,
      amount: withdrawAmount,
      transfer_fee: 0,
      reference_code: `WD-${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'completed',
      type: 'manual',
      processed_at: new Date().toISOString()
    };

    const updatedHistory = [newPayoutRecord, ...(overview.payout_history || [])];

    await pool.query(
      `UPDATE identity.payout_profiles
       SET available_balance = $1, total_paid_out = $2, payout_history = $3, updated_at = NOW()
       WHERE id = $4;`,
      [newAvailable, newTotalPaidOut, JSON.stringify(updatedHistory), overview.id]
    );

    return {
      success: true,
      payout: newPayoutRecord,
      new_balance: newAvailable
    };
  }

  async getTransactions() {
    try {
      const { rows } = await pool.query(
        `SELECT id, order_id, booking_code, customer_name, customer_email, customer_phone,
                program_name, experience_name, location_name, pax, gross_amount, platform_fee, net_payout,
                payment_method, issuer, payment_token, payment_url, status, created_at, updated_at
         FROM identity.transactions
         ORDER BY created_at DESC;`
      );

      if (rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          order_id: r.order_id,
          booking_code: r.booking_code,
          program_name: r.program_name,
          experience_name: r.experience_name || 'Scenic Tour Experience',
          location_name: r.location_name || 'Indonesia',
          customer_name: r.customer_name,
          customer_email: r.customer_email,
          customer_phone: r.customer_phone || '-',
          pax: parseInt(r.pax || '1', 10),
          gross_amount: parseFloat(r.gross_amount || '0'),
          platform_fee: parseFloat(r.platform_fee || '0'),
          net_payout: parseFloat(r.net_payout || '0'),
          payment_method: r.payment_method || 'Online Transfer',
          issuer: r.issuer || null,
          payment_token: r.payment_token || null,
          payment_url: r.payment_url || null,
          date: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          status: r.status === 'cleared' || r.status === 'paid' ? 'cleared' : (r.status === 'pending' ? 'pending_clearance' : r.status)
        }));
      }
    } catch (e) {
      console.error('Error fetching transactions from identity.transactions:', e);
    }

    try {
      const { rows } = await pool.query(
        `SELECT id, booking_code, customer_name, customer_email, customer_phone,
                program_name, experience_name, location_name, pax, gross_amount, payment_method,
                billing_status, joined, created_at
         FROM identity.web_registrations
         ORDER BY created_at DESC;`
      );

      if (rows.length > 0) {
        const feePercent = await getPlatformFeePercent();
        return rows.map((r: any) => {
          const gross = parseFloat(r.gross_amount || '0');
          const fee = Math.round(gross * (feePercent / 100));
          const net = gross - fee;
          return {
            id: r.id,
            booking_code: r.booking_code,
            program_name: r.program_name,
            experience_name: r.experience_name || 'Scenic Tour Experience',
            location_name: r.location_name || 'Indonesia',
            customer_name: r.customer_name,
            customer_email: r.customer_email,
            customer_phone: r.customer_phone || '-',
            pax: parseInt(r.pax || '1', 10),
            gross_amount: gross,
            platform_fee: fee,
            net_payout: net,
            payment_method: r.payment_method || 'Online Transfer',
            date: r.joined ? new Date(r.joined).toISOString() : new Date().toISOString(),
            status: r.billing_status === 'Paid' ? 'cleared' : (r.billing_status === 'Pending' ? 'pending_clearance' : r.billing_status.toLowerCase())
          };
        });
      }
    } catch (e) {
      console.error('Error fetching transactions from web_registrations:', e);
    }

    const overview = await this.getPayoutOverview();
    return overview.recent_purchases || [];
  }

  async recordProgramPurchase(data: {
    booking_code: string;
    program_name: string;
    experience_name?: string;
    provider_name?: string;
    location_name?: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    pax: number;
    gross_amount: number;
    payment_method: string;
  }) {
    const overview = await this.getPayoutOverview();
    const feePercent = await getPlatformFeePercent();

    const platformFee = Math.round(data.gross_amount * (feePercent / 100)); // dynamic platform fee
    const netPayout = data.gross_amount - platformFee;

    const newPurchase = {
      id: `TRX-${Date.now()}`,
      booking_code: data.booking_code || `BK-${Date.now()}`,
      program_name: data.program_name,
      experience_name: data.experience_name || 'Scenic Tour Experience',
      provider_name: data.provider_name || 'PT Bali Samudra Experiential',
      location_name: data.location_name || 'Indonesia',
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone || '-',
      pax: data.pax || 1,
      gross_amount: data.gross_amount,
      platform_fee: platformFee,
      net_payout: netPayout,
      payment_method: data.payment_method || 'Online Transfer',
      date: new Date().toISOString(),
      status: 'cleared'
    };

    const updatedPurchases = [newPurchase, ...(overview.recent_purchases || [])];
    const newAvailable = overview.available_balance + netPayout;

    // Check if auto payout is enabled and primary bank exists
    let updatedHistory = overview.payout_history || [];
    let finalAvailable = newAvailable;
    let finalTotalPaidOut = overview.total_paid_out;
    let autoPayoutDisbursed = null;

    const primaryBank = (overview.bank_accounts || []).find((b: any) => b.is_primary);

    if (overview.auto_payout_enabled && primaryBank && overview.auto_payout_schedule === 'daily') {
      // Auto payout immediately to the primary bank account
      autoPayoutDisbursed = {
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
      finalAvailable = overview.available_balance; // Disbursed immediately
      finalTotalPaidOut += netPayout;
    }

    await pool.query(
      `UPDATE identity.payout_profiles
       SET available_balance = $1, total_paid_out = $2,
           recent_purchases = $3, payout_history = $4, updated_at = NOW()
       WHERE id = $5;`,
      [finalAvailable, finalTotalPaidOut, JSON.stringify(updatedPurchases), JSON.stringify(updatedHistory), overview.id]
    );

    return {
      success: true,
      purchase: newPurchase,
      auto_payout_disbursed: autoPayoutDisbursed
    };
  }
}

export const payoutService = new PayoutService();
