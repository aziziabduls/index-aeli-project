import { cookies } from "next/headers";

import { CategoriesClient } from "./_components/categories-client";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  let programs = [];
  let categories = [];

  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/programs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const res = await response.json();
    if (res.success && Array.isArray(res.data)) {
      programs = res.data;
    }
  } catch (e) {
    console.error("Failed to fetch programs for categories summary:", e);
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const res = await response.json();
    if (res.success && Array.isArray(res.data)) {
      categories = res.data;
    }
  } catch (e) {
    console.error("Failed to fetch categories from API:", e);
  }

  return <CategoriesClient initialCategories={categories} programs={programs} />;
}
