import { cookies } from "next/headers";

import { format } from "date-fns";

import type { UserRow, UserStatus } from "./_components/data";
import { Users } from "./_components/users";

interface DbUser {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  let apiUsers: DbUser[] = [];
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";
    const response = await fetch(`${apiUrl}/api/v1/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const res = await response.json();
    if (res.success && Array.isArray(res.data)) {
      apiUsers = res.data;
    }
  } catch (e) {
    console.error("Failed to fetch users from API:", e);
  }

  const mappedUsers: UserRow[] = apiUsers.map((user: DbUser) => {
    const roleMap: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      content_editor: "Content Editor",
      viewer: "Viewer",
    };

    const name = user.email
      .split("@")[0]
      .split(/[._-]/)
      .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");

    const formattedDate = user.created_at
      ? format(new Date(user.created_at), "dd MMM yyyy, h:mm a")
      : format(new Date(), "dd MMM yyyy, h:mm a");

    const statusValue: UserStatus = user.status === "active" ? "Active" : "Deactivated";

    return {
      email: user.email,
      joinedDate: formattedDate,
      lastActive: 0,
      name: name,
      role: roleMap[user.role] || user.role,
      status: statusValue,
      team: "Platform",
      workspace: ["Weblabs Studio"],
    };
  });

  return <Users users={mappedUsers} />;
}
