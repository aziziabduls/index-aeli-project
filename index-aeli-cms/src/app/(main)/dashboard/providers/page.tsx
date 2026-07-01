import { cookies } from "next/headers";

import { ProvidersClient } from "./_components/providers-client";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  let providers = [];
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";
    const response = await fetch(`${apiUrl}/api/v1/admin/providers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const res = await response.json();
    if (res.success && Array.isArray(res.data)) {
      providers = res.data;
    }
  } catch (e) {
    console.error("Failed to fetch providers from API:", e);
  }

  return <ProvidersClient initialProviders={providers} />;
}
