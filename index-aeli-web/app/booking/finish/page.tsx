'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPaymentStatus } from '@/lib/api';
import { useCurrency } from '@/lib/CurrencyContext';
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Printer, RefreshCw, Compass } from 'lucide-react';

function FinishPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('order_id') ||
    searchParams.get('id') ||
    '';

  const bookingCodeParam = searchParams.get('bookingCode') || '';
  const initialStatusCode = searchParams.get('status_code') || '';
  const initialTransactionStatus = searchParams.get('transaction_status') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);

  const fetchStatus = async () => {
    if (!orderId && !bookingCodeParam) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getPaymentStatus(orderId || bookingCodeParam);
      if (data) {
        setPaymentData(data);
      }
    } catch (err) {
      console.error('Failed to retrieve payment status:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [orderId, bookingCodeParam]);

  // Status determination
  const rawStatus = (
    paymentData?.status ||
    paymentData?.gateway?.transactionStatus ||
    paymentData?.gateway?.paymentStatus ||
    initialTransactionStatus ||
    (initialStatusCode === '200' ? 'cleared' : 'pending')
  ).toLowerCase();

  const isSuccess =
    rawStatus === 'cleared' ||
    rawStatus === 'paid' ||
    rawStatus === 'success' ||
    rawStatus === 'settlement' ||
    rawStatus === 'capture' ||
    initialStatusCode === '200';

  const isFailed =
    rawStatus === 'failed' ||
    rawStatus === 'expire' ||
    rawStatus === 'expired' ||
    rawStatus === 'cancel' ||
    rawStatus === 'cancelled' ||
    rawStatus === 'deny';

  const isPending = !isSuccess && !isFailed;

  // Auto-polling when pending (up to 5 times every 4 seconds)
  useEffect(() => {
    if (isPending && pollCount < 5 && orderId) {
      const timer = setTimeout(() => {
        setPollCount((prev) => prev + 1);
        fetchStatus();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isPending, pollCount, orderId]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchStatus();
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-medium text-zinc-900">Verifying transaction state</h2>
        <p className="text-xs text-zinc-500 mt-1">Connecting to Hoople Payment Gateway...</p>
      </div>
    );
  }

  const finalOrderId = paymentData?.orderId || orderId || 'HP-ORD-ONLINE';
  const finalBookingCode = paymentData?.bookingCode || bookingCodeParam || 'AELI-RESERVATION';
  const grossAmount = paymentData?.grossAmount || 0;
  const customerName = paymentData?.customerName || 'Valued Traveler';
  const programName = paymentData?.programName || 'Indonesian Signature Tour Program';
  const experienceName = paymentData?.experienceName || 'Scenic Tour Experience';
  const paymentMethod = paymentData?.paymentMethod || 'Hoople Payment (HooPay)';
  const issuer = paymentData?.issuer || paymentData?.gateway?.issuer;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Status Header Banner */}
        <div className="p-8 text-center border-b border-zinc-100">
          <div className="inline-flex items-center justify-center mb-4">
            {isSuccess && (
              <div className="size-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="size-8" />
              </div>
            )}
            {isPending && (
              <div className="size-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="size-8" />
              </div>
            )}
            {isFailed && (
              <div className="size-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="size-8" />
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-medium text-zinc-900 tracking-tight">
            {isSuccess && 'Payment Confirmed'}
            {isPending && 'Payment In Progress'}
            {isFailed && 'Payment Unsuccessful'}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-md mx-auto">
            {isSuccess &&
              `Thank you, ${customerName}. Your reservation has been cleared and confirmed. A confirmation receipt has been dispatched to your email.`}
            {isPending &&
              'We are waiting for transaction settlement from your payment channel. If you just finished payment, please allow a few moments for verification.'}
            {isFailed &&
              'The payment could not be completed or the transaction authorization expired. You may attempt checkout again.'}
          </p>
        </div>

        {/* Receipt Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <span className="text-[11px] font-medium text-zinc-400 block">Booking Reference</span>
              <span className="font-mono text-sm font-semibold text-zinc-900">{finalBookingCode}</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-zinc-400 block">Gateway Order ID</span>
              <span className="font-mono text-sm font-medium text-zinc-700">{finalOrderId}</span>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-5 space-y-3 text-left">
            <div className="flex justify-between items-start text-sm">
              <span className="text-zinc-500">Expedition Program</span>
              <span className="font-medium text-zinc-900 text-right max-w-[280px]">{programName}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Experience Detail</span>
              <span className="text-zinc-700 text-right">{experienceName}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Payment Channel</span>
              <span className="text-zinc-900 font-medium capitalize">
                {paymentMethod.replace(/_/g, ' ')}
                {issuer ? ` (${issuer.toUpperCase()})` : ''}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Transaction Status</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-700'
                    : isPending
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {isSuccess ? 'Paid / Settled' : isPending ? 'Awaiting Settlement' : 'Failed'}
              </span>
            </div>

            {grossAmount > 0 && (
              <div className="flex justify-between items-center text-base pt-3 border-t border-zinc-100 font-medium">
                <span className="text-zinc-900">Total Authorized</span>
                <span className="text-zinc-900 font-serif font-semibold tabular-nums">
                  {formatPrice(grossAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-zinc-50/70 p-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/tours"
            className="w-full sm:w-auto h-10 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Compass className="size-3.5" />
            <span>Browse More Tours</span>
          </Link>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {isPending && (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto h-10 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
              </button>
            )}

            {isSuccess && (
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto h-10 px-4 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-dark flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="size-3.5" />
                <span>Print Receipt</span>
              </button>
            )}

            {isFailed && (
              <Link
                href="/booking"
                className="w-full sm:w-auto h-10 px-4 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-dark flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft className="size-3.5" />
                <span>Try Booking Again</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingFinishPage() {
  return (
    <div className="min-h-screen bg-zinc-50/50 py-12">
      <Suspense
        fallback={
          <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-base font-medium text-zinc-900">Loading payment summary...</h2>
          </div>
        }
      >
        <FinishPaymentContent />
      </Suspense>
    </div>
  );
}

