import { cookies } from "next/headers";

import type { Destination, ProgramRow, Provider } from "./_components/programs-client";
import { ProgramsClient } from "./_components/programs-client";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  let apiPrograms: ProgramRow[] = [];
  let providers: Provider[] = [];
  let destinations: Destination[] = [];

  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

    // 1. Fetch programs
    const progRes = await fetch(`${apiUrl}/api/v1/admin/programs`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const progJson = await progRes.json();
    if (progJson.success && Array.isArray(progJson.data)) {
      apiPrograms = progJson.data;
    }

    // 2. Fetch providers
    const provRes = await fetch(`${apiUrl}/api/v1/admin/providers`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const provJson = await provRes.json();
    if (provJson.success && Array.isArray(provJson.data)) {
      providers = provJson.data;
    }

    // 3. Fetch destinations
    const destRes = await fetch(`${apiUrl}/api/v1/destinations`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const destJson = await destRes.json();
    if (destJson.success && Array.isArray(destJson.data)) {
      destinations = destJson.data;
    }
  } catch (e) {
    console.error("Failed to fetch dashboard data for programs:", e);
  }

  return <ProgramsClient initialPrograms={apiPrograms} providers={providers} destinations={destinations} />;
}
