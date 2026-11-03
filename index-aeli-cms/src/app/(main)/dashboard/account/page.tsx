import { cookies } from "next/headers";
import { AccountClient } from "./_components/account-client";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

  let userData = null;

  try {
    const res = await fetch(`${apiUrl}/api/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const json = await res.json();
    if (json.success && json.data) {
      userData = json.data;
    }
  } catch (err) {
    console.error("Failed to fetch current user profile:", err);
  }

  // Fallback to cookie user if API had any issue
  if (!userData) {
    const userCookie = cookieStore.get("user")?.value;
    if (userCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCookie));
        userData = {
          id: parsed.id,
          email: parsed.email,
          role: parsed.role,
          name: parsed.name || parsed.email?.split("@")[0],
          status: "active",
          created_at: new Date().toISOString(),
          stats: { destinations: 0, attractions: 0, programs: 0 },
          recent_activities: []
        };
      } catch (_e) {
        // ignore
      }
    }
  }

  return <AccountClient initialUser={userData} />;
}

