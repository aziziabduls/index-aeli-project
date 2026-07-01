import { cookies } from "next/headers";

import { ProgramForm } from "../_components/program-form";

interface Provider {
  id: string;
  legal_name: string;
}

interface Destination {
  id: string;
  name: string;
}

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  let providers: Provider[] = [];
  let destinations: Destination[] = [];
  // biome-ignore lint/suspicious/noExplicitAny: API payload structure
  let attractions: any[] = [];
  let categories: { id?: string; name: string }[] = [];

  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

    // 1. Fetch providers
    const provRes = await fetch(`${apiUrl}/api/v1/admin/providers`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const provJson = await provRes.json();
    if (provJson.success && Array.isArray(provJson.data)) {
      providers = provJson.data;
    }

    // 2. Fetch destinations
    const destRes = await fetch(`${apiUrl}/api/v1/destinations`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const destJson = await destRes.json();
    if (destJson.success && Array.isArray(destJson.data)) {
      destinations = destJson.data;
    }

    // 3. Fetch attractions
    const attrRes = await fetch(`${apiUrl}/api/v1/admin/attractions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const attrJson = await attrRes.json();
    if (attrJson.success && Array.isArray(attrJson.data)) {
      attractions = attrJson.data;
    }

    // 4. Fetch categories
    const catRes = await fetch(`${apiUrl}/api/v1/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const catJson = await catRes.json();
    if (catJson.success && Array.isArray(catJson.data)) {
      categories = catJson.data;
    }
  } catch (e) {
    console.error("Failed to load layout data for program creation:", e);
  }

  return (
    <div className="w-full">
      <ProgramForm
        providers={providers}
        destinations={destinations}
        attractions={attractions}
        categories={categories}
      />
    </div>
  );
}
