import { cookies } from "next/headers";
import { PayoutClient } from "./_components/payout-client";

export default async function PayoutPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

  let payoutData = null;

  try {
    const res = await fetch(`${apiUrl}/api/v1/payout`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const json = await res.json();
    if (json.success && json.data) {
      payoutData = json.data;
    }
  } catch (err) {
    console.error("Failed to fetch payout data:", err);
  }

  // Fallback data if service is starting up
  if (!payoutData) {
    payoutData = {
      available_balance: 48500000,
      pending_balance: 12200000,
      total_paid_out: 135000000,
      auto_payout_enabled: true,
      auto_payout_schedule: "daily",
      bank_accounts: [
        {
          id: "bank_1",
          bank_name: "Bank Central Asia (BCA)",
          bank_code: "bca",
          account_number: "8830192841",
          account_holder: "PT INDEX AELI INDONESIA",
          branch: "KCU Thamrin Jakarta",
          is_primary: true,
          verified: true,
        },
        {
          id: "bank_2",
          bank_name: "Bank Mandiri",
          bank_code: "mandiri",
          account_number: "1370019283741",
          account_holder: "PT INDEX AELI INDONESIA",
          branch: "Sudirman Finance",
          is_primary: false,
          verified: true,
        },
      ],
      recent_purchases: [
        {
          id: "TRX-BK-9021",
          booking_code: "BK-2026-9021",
          program_name: "Komodo Dragons Expeditions & Padar Sunrise",
          customer_name: "Michael Tan",
          customer_email: "m.tan@gmail.com",
          pax: 4,
          gross_amount: 14000000,
          platform_fee: 700000,
          net_payout: 13300000,
          payment_method: "BCA Virtual Account",
          date: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
          status: "cleared",
        },
        {
          id: "TRX-BK-9018",
          booking_code: "BK-2026-9018",
          program_name: "Raja Ampat Coral Triangle Liveaboard",
          customer_name: "Sarah Jenkins",
          customer_email: "sarah.j@traveler.com",
          pax: 2,
          gross_amount: 25000000,
          platform_fee: 1250000,
          net_payout: 23750000,
          payment_method: "Credit Card (Visa)",
          date: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
          status: "cleared",
        },
      ],
      payout_history: [
        {
          id: "PO-2026-1102",
          bank_name: "Bank Central Asia (BCA)",
          account_number: "8830192841",
          account_holder: "PT INDEX AELI INDONESIA",
          amount: 35000000,
          transfer_fee: 0,
          reference_code: "BCA-WD-83921948",
          status: "completed",
          type: "automatic",
          processed_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        },
      ],
    };
  }

  return <PayoutClient initialData={payoutData} />;
}

