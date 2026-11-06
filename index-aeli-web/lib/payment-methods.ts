export interface PaymentMethodItem {
  id: string;
  name: string;
  category: 'qris' | 'ewallet' | 'va' | 'card' | 'paylater' | 'convenience';
  categoryLabel: string;
  recommended?: boolean;
  midtransId: string;
  description: string;
}

export const HOOPLE_PAYMENT_METHODS: PaymentMethodItem[] = [
  // QRIS & E-Wallet
  {
    id: 'qris',
    name: 'QRIS',
    category: 'qris',
    categoryLabel: 'QRIS & E-Wallet',
    recommended: true,
    midtransId: 'other_qris',
    description: 'Universal QR code: BCA Mobile, GoPay, OVO, ShopeePay, Dana, LinkAja',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    category: 'ewallet',
    categoryLabel: 'QRIS & E-Wallet',
    recommended: true,
    midtransId: 'gopay',
    description: 'Instant payment via GoPay mobile application or QR code scan',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    category: 'ewallet',
    categoryLabel: 'QRIS & E-Wallet',
    recommended: false,
    midtransId: 'shopeepay',
    description: 'Direct checkout with ShopeePay e-wallet balance',
  },

  // Virtual Account
  {
    id: 'bca_va',
    name: 'BCA Virtual Account',
    category: 'va',
    categoryLabel: 'Virtual Account',
    recommended: false,
    midtransId: 'bca_va',
    description: 'BCA mobile, KlikBCA, or BCA ATM with automatic verification',
  },
  {
    id: 'other_va',
    name: 'Mandiri & Other Banks VA',
    category: 'va',
    categoryLabel: 'Virtual Account',
    recommended: false,
    midtransId: 'other_va',
    description: 'Mandiri Livin bill payment, ATM Bersama, Prima, and Alto',
  },
  {
    id: 'bni_va',
    name: 'BNI Virtual Account',
    category: 'va',
    categoryLabel: 'Virtual Account',
    recommended: false,
    midtransId: 'bni_va',
    description: 'BNI Mobile Banking, Internet Banking, or BNI ATM',
  },
  {
    id: 'bri_va',
    name: 'BRI Virtual Account (BRIVA)',
    category: 'va',
    categoryLabel: 'Virtual Account',
    recommended: false,
    midtransId: 'bri_va',
    description: 'BRImo mobile banking or BRI ATM network',
  },
  {
    id: 'cimb_va',
    name: 'CIMB Niaga VA',
    category: 'va',
    categoryLabel: 'Virtual Account',
    recommended: false,
    midtransId: 'cimb_va',
    description: 'OCTO Mobile, OCTO Clicks, or CIMB ATM',
  },
  {
    id: 'permata_va',
    name: 'Permata VA',
    category: 'va',
    categoryLabel: 'Virtual Account',
    recommended: false,
    midtransId: 'permata_va',
    description: 'PermataMobile X or Permata ATM transfer',
  },

  // Credit / Debit Card
  {
    id: 'credit_card',
    name: 'Credit / Debit Card',
    category: 'card',
    categoryLabel: 'Cards',
    recommended: false,
    midtransId: 'credit_card',
    description: 'Visa, Mastercard, and JCB with secure 3D Secure bank OTP',
  },

  // PayLater
  {
    id: 'kredivo',
    name: 'Kredivo PayLater',
    category: 'paylater',
    categoryLabel: 'PayLater & Retail',
    recommended: false,
    midtransId: 'kredivo',
    description: 'Pay in 30 days or installments up to 12 months',
  },
  {
    id: 'akulaku',
    name: 'Akulaku PayLater',
    category: 'paylater',
    categoryLabel: 'PayLater & Retail',
    recommended: false,
    midtransId: 'akulaku',
    description: 'Installment without credit card via Akulaku account',
  },
  {
    id: 'uob_ezpay',
    name: 'UOB EZPay',
    category: 'paylater',
    categoryLabel: 'PayLater & Retail',
    recommended: false,
    midtransId: 'uob_ezpay',
    description: 'Direct debit and paylater via UOB TMRW',
  },

  // Convenience Store
  {
    id: 'indomaret',
    name: 'Indomaret',
    category: 'convenience',
    categoryLabel: 'PayLater & Retail',
    recommended: false,
    midtransId: 'indomaret',
    description: 'Pay in cash at any Indomaret or Ceriamart cashier across Indonesia',
  },
];

export const PAYMENT_CATEGORIES = [
  { id: 'all', label: 'All Channels' },
  { id: 'qris_ewallet', label: 'QRIS & E-Wallet' },
  { id: 'va', label: 'Virtual Account' },
  { id: 'card', label: 'Cards' },
  { id: 'paylater_retail', label: 'PayLater & Retail' },
] as const;

