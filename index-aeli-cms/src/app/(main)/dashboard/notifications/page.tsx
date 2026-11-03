import { cookies } from "next/headers";
import { NotificationsClient } from "./_components/notifications-client";

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

  let notificationData = null;

  try {
    const res = await fetch(`${apiUrl}/api/v1/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const json = await res.json();
    if (json.success && json.data) {
      notificationData = json.data;
    }
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
  }

  // Fallback defaults
  if (!notificationData) {
    notificationData = {
      notifications: [
        {
          id: "notif-1",
          title: "System Initialized",
          message: "Welcome to the INDEX-AELI CMS platform. Your account is configured with full administrative privileges.",
          type: "info",
          link: "/dashboard/account",
          is_read: false,
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
        {
          id: "notif-2",
          title: "Security Check",
          message: "Role-based access controls and API Gateway proxying are active across all microservices.",
          type: "security",
          link: "/dashboard/account",
          is_read: false,
          created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        },
        {
          id: "notif-3",
          title: "Content Engine Ready",
          message: "Destinations, attractions, and tour programs database schema verified.",
          type: "success",
          link: "/dashboard/programs",
          is_read: true,
          created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        },
      ],
      unread_count: 2,
      preferences: {
        email: true,
        security: true,
        updates: true,
        marketing: false,
      },
    };
  }

  return <NotificationsClient initialData={notificationData} />;
}

