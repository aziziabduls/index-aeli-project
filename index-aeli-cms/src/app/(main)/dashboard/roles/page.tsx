import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Roles } from "./_components/roles";
import type { Role } from "./_components/roles-table/data";

export default async function Page() {
  const cookieStore = await cookies();

  let user = null;
  const userCookie = cookieStore.get("user")?.value;
  if (userCookie) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie));
    } catch (e) {
      console.error("Failed to parse user cookie in roles page", e);
    }
  }

  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    redirect("/unauthorized");
  }

  const token = cookieStore.get("session_token")?.value;
  let apiRoles: Role[] = [];
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";
    const response = await fetch(`${apiUrl}/api/v1/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const res = await response.json();
    if (res.success && Array.isArray(res.data)) {
      apiRoles = res.data;
    }
  } catch (e) {
    console.error("Failed to fetch roles from API:", e);
  }

  return <Roles roles={apiRoles} />;
}
