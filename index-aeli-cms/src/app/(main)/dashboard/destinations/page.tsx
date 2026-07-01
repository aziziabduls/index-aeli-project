import { cookies } from "next/headers";

import { DestinationsClient } from "./_components/destinations-client";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  let destinations = [];
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";
    const response = await fetch(`${apiUrl}/api/v1/admin/destinations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const res = await response.json();
    if (res.success && Array.isArray(res.data)) {
      destinations = res.data;
    }
  } catch (e) {
    console.error("Failed to fetch destinations from API:", e);
  }

  return <DestinationsClient initialDestinations={destinations} />;
}
