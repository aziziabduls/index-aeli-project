import { cookies } from "next/headers";
import Link from "next/link";

import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { AppConfigClient } from "./_components/app-config-client";
import { type AppConfigData, DEFAULT_APP_CONFIG } from "./_components/app-config-types";

export default async function AppConfigPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  let user: { id?: string; email?: string; role?: string } | null = null;
  const userCookie = cookieStore.get("user")?.value;
  if (userCookie) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie));
    } catch (e) {
      console.error("Failed to parse user cookie in app-config page", e);
    }
  }

  const isSuperAdmin =
    user?.role === "super_admin" || user?.email === "superadmin@indexaeli.com";

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-6" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
            <CardDescription>
              The <strong>App Config</strong> menu can only be accessed by Superadmin (
              <code>superadmin@indexaeli.com</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button render={<Link href="/dashboard" />} variant="outline">
              Back to Overview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const apiUrl =
    process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

  let initialConfig: AppConfigData = DEFAULT_APP_CONFIG;

  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/app-config`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const res = await response.json();
    if (res.success && res.data) {
      initialConfig = {
        ...DEFAULT_APP_CONFIG,
        ...res.data,
        credentials: {
          ...DEFAULT_APP_CONFIG.credentials,
          ...(res.data.credentials || {}),
        },
        contact: {
          ...DEFAULT_APP_CONFIG.contact,
          ...(res.data.contact || {}),
          business_hours: {
            ...(DEFAULT_APP_CONFIG.contact?.business_hours || {}),
            ...(res.data.contact?.business_hours || {}),
          },
        },
        about: {
          ...DEFAULT_APP_CONFIG.about,
          ...(res.data.about || {}),
          values:
            Array.isArray(res.data.about?.values) && res.data.about.values.length > 0
              ? res.data.about.values
              : (DEFAULT_APP_CONFIG.about?.values || []),
          team_members:
            Array.isArray(res.data.about?.team_members) && res.data.about.team_members.length > 0
              ? res.data.about.team_members
              : (DEFAULT_APP_CONFIG.about?.team_members || []),
        },
        footer: {
          ...DEFAULT_APP_CONFIG.footer,
          ...(res.data.footer || {}),
        },
      };
    }
  } catch (e) {
    console.error("Failed to fetch app config from API:", e);
  }

  return <AppConfigClient initialConfig={initialConfig} />;
}

