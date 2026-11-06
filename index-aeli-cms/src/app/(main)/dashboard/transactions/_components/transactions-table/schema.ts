import z from "zod";

export const transactionSchema = z.object({
  id: z.string(),
  order_id: z.string().optional(),
  booking_code: z.string(),
  program_name: z.string(),
  experience_name: z.string(),
  location_name: z.string().optional().default("Indonesia"),
  customer_name: z.string(),
  customer_email: z.string(),
  customer_phone: z.string().optional().default("-"),
  pax: z.number().default(1),
  gross_amount: z.number(),
  platform_fee: z.number(),
  net_payout: z.number(),
  payment_method: z.string(),
  issuer: z.string().nullable().optional(),
  payment_token: z.string().nullable().optional(),
  payment_url: z.string().nullable().optional(),
  date: z.string(),
  status: z.string(),
});

export type TransactionRow = z.infer<typeof transactionSchema>;

