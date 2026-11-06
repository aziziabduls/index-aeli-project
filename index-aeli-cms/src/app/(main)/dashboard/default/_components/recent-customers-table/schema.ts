import z from "zod";

export const recentCustomersSchema = z.object({
  id: z.string(),
  booking_code: z.string().optional(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  program_name: z.string(),
  experience_name: z.string(),
  pax: z.number().optional(),
  gross_amount: z.number().optional(),
  billing: z.string(),
  joined: z.string(),
});

export type RecentCustomerRow = z.infer<typeof recentCustomersSchema>;
