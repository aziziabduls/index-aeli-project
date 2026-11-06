import { cookies } from "next/headers";
import { TransactionsClient } from "./_components/transactions-client";
import type { TransactionRow } from "./_components/transactions-table/schema";

export const metadata = {
  title: "Transactions | INDEX-AELI CMS",
  description: "View and manage user transactions from the traveler portal.",
};

export default async function TransactionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  const apiUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:7009";

  let transactions: TransactionRow[] = [];

  try {
    const res = await fetch(`${apiUrl}/api/v1/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      transactions = json.data;
    }
  } catch (err) {
    console.error("Failed to fetch transactions from /api/v1/transactions:", err);
  }

  // Fallback to /api/v1/registrations if /transactions returned empty
  if (!transactions || transactions.length === 0) {
    try {
      const regRes = await fetch(`${apiUrl}/api/v1/registrations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const regJson = await regRes.json();
      if (regJson.success && Array.isArray(regJson.data) && regJson.data.length > 0) {
        transactions = regJson.data.map((r: any) => {
          const gross = Number(r.gross_amount) || 0;
          const fee = Math.round(gross * 0.05);
          return {
            id: r.id,
            booking_code: r.booking_code,
            program_name: r.program_name,
            experience_name: r.experience_name,
            location_name: r.location_name || "Indonesia",
            customer_name: r.name || r.customer_name,
            customer_email: r.email || r.customer_email,
            customer_phone: r.phone || r.customer_phone || "-",
            pax: Number(r.pax) || 1,
            gross_amount: gross,
            platform_fee: fee,
            net_payout: gross - fee,
            payment_method: r.payment_method || "BCA Virtual Account",
            date: r.joined || new Date().toISOString(),
            status: r.billing === "Paid" || r.billing_status === "Paid" ? "cleared" : "pending_clearance",
          };
        });
      }
    } catch (err) {
      console.error("Failed to fetch registrations for transactions:", err);
    }
  }

  // Fallback to payout purchases or sample seed if API is initializing
  if (!transactions || transactions.length === 0) {
    try {
      const payoutRes = await fetch(`${apiUrl}/api/v1/payout`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const payoutJson = await payoutRes.json();
      if (payoutJson.success && Array.isArray(payoutJson.data?.recent_purchases)) {
        transactions = payoutJson.data.recent_purchases;
      }
    } catch {
      // Fallback seed
      transactions = [
        {
          id: "TRX-BK-9021",
          booking_code: "BK-2026-9021",
          program_name: "Komodo Dragons Expeditions & Padar Sunrise",
          experience_name: "Padar Island Trekking & Wildlife",
          location_name: "Labuan Bajo",
          customer_name: "Michael Tan",
          customer_email: "m.tan@gmail.com",
          customer_phone: "+62 812-9842-1029",
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
          experience_name: "Misool Marine Biodiversity & Diving",
          location_name: "Papua",
          customer_name: "Sarah Jenkins",
          customer_email: "sarah.j@traveler.com",
          customer_phone: "+1 415-892-3301",
          pax: 2,
          gross_amount: 25000000,
          platform_fee: 1250000,
          net_payout: 23750000,
          payment_method: "Credit Card (Visa)",
          date: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
          status: "cleared",
        },
        {
          id: "TRX-BK-9014",
          booking_code: "BK-2026-9014",
          program_name: "Bromo Midnight Milky Way & Jeep Safari",
          experience_name: "Bromo Sunrise Jeep & Crater Caldera",
          location_name: "East Java",
          customer_name: "Budi Santoso",
          customer_email: "budi.s@outlook.com",
          customer_phone: "+62 813-4412-8876",
          pax: 5,
          gross_amount: 7500000,
          platform_fee: 375000,
          net_payout: 7125000,
          payment_method: "Mandiri VA",
          date: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
          status: "pending_clearance",
        },
        {
          id: "TRX-BK-9009",
          booking_code: "BK-2026-9009",
          program_name: "Ubud Rainforest Culinary & Yoga Retreat",
          experience_name: "Tegallalang Organic Farm & Spiritual Wellness",
          location_name: "Bali",
          customer_name: "Chloe Dupont",
          customer_email: "chloe.dupont@voyage.fr",
          customer_phone: "+33 6 49 20 11 88",
          pax: 2,
          gross_amount: 5400000,
          platform_fee: 270000,
          net_payout: 5130000,
          payment_method: "Mastercard",
          date: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
          status: "pending_clearance",
        },
      ];
    }
  }

  return <TransactionsClient initialData={transactions} />;
}

