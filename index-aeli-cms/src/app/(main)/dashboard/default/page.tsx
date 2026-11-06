import { cookies } from "next/headers";
import { MetricCards } from "./_components/metric-cards";
import { PerformanceOverview } from "./_components/performance-overview";
import { SubscriberOverview } from "./_components/subscriber-overview";
import type { RecentCustomerRow } from "./_components/recent-customers-table/schema";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  const apiUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:7009";

  let registrations: RecentCustomerRow[] = [];

  try {
    const res = await fetch(`${apiUrl}/api/v1/registrations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      registrations = json.data;
    } else {
      // Fallback to /api/v1/transactions
      const trxRes = await fetch(`${apiUrl}/api/v1/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const trxJson = await trxRes.json();
      if (trxJson.success && Array.isArray(trxJson.data) && trxJson.data.length > 0) {
        registrations = trxJson.data.map((t: any) => ({
          id: t.id,
          name: t.customer_name || t.name,
          email: t.customer_email || t.email,
          program_name: t.program_name,
          experience_name: t.experience_name,
          billing: t.status === "cleared" || t.billing === "Paid" ? "Paid" : "Pending",
          joined: t.date || t.joined || new Date().toISOString(),
        }));
      }
    }
  } catch (err) {
    console.error("Failed to fetch web registrations for dashboard:", err);
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <MetricCards />
      <PerformanceOverview />
      <SubscriberOverview initialData={registrations} />
    </div>
  );
}
