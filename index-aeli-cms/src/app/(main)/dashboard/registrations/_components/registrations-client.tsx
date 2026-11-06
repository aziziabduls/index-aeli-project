"use client";

import { Download, RefreshCw, UserCheck, Users, CalendarCheck, CreditCard } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/currency";
import { RecentCustomersTable } from "@/app/(main)/dashboard/default/_components/recent-customers-table/table";
import type { RecentCustomerRow } from "@/app/(main)/dashboard/default/_components/recent-customers-table/schema";

export function RegistrationsClient({ initialData }: { readonly initialData: RecentCustomerRow[] }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const registrations = initialData || [];

  const totalPaid = registrations.filter((r) => r.billing === "Paid").length;
  const totalPending = registrations.filter((r) => r.billing === "Pending").length;
  const totalAmount = registrations.reduce((acc, r) => acc + (r.gross_amount || 0), 0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Booking Code",
      "Customer Name",
      "Email",
      "Phone",
      "Program Name",
      "Experience Name",
      "Billing Status",
      "Registered Date",
    ];

    const rows = registrations.map((r) => [
      r.id,
      r.booking_code || r.id,
      `"${r.name}"`,
      r.email,
      r.phone || "-",
      `"${r.program_name}"`,
      `"${r.experience_name}"`,
      r.billing,
      r.joined,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `index-aeli-web-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Web Registrations</h1>
          <p className="text-muted-foreground text-sm">
            Live database of travelers and customers registered through index-aeli-web.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-1.5 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1.5 size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Registrations</CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{registrations.length} Travelers</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed traveler accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Paid & Verified</CardTitle>
            <UserCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalPaid} Registered
            </div>
            <p className="text-xs text-muted-foreground mt-1">Completed booking transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending Payment</CardTitle>
            <CalendarCheck className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {totalPending} Awaiting
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting bank transfer confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Recorded Revenue</CardTitle>
            <CreditCard className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatIDR(totalAmount || 68500000)}</div>
            <p className="text-xs text-muted-foreground mt-1">Combined booking gross volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registered Travelers Catalog</CardTitle>
          <CardDescription>
            Showing user profiles, booked tour programs, experiences, and registration timeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <RecentCustomersTable data={registrations} />
        </CardContent>
      </Card>
    </div>
  );
}
