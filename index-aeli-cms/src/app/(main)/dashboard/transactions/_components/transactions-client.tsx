"use client";

import { CheckCircle2, Clock, Download, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/currency";
import type { TransactionRow } from "./transactions-table/schema";
import { TransactionsTable } from "./transactions-table/table";

export function TransactionsClient({ initialData }: { readonly initialData: TransactionRow[] }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const transactions = initialData || [];

  const totalGross = transactions.reduce((acc, t) => acc + (t.gross_amount || 0), 0);
  const clearedGross = transactions
    .filter((t) => t.status === "cleared" || t.status === "paid" || t.status === "completed")
    .reduce((acc, t) => acc + (t.gross_amount || 0), 0);
  const pendingGross = transactions
    .filter((t) => t.status === "pending_clearance" || t.status === "pending")
    .reduce((acc, t) => acc + (t.gross_amount || 0), 0);
  const totalPax = transactions.reduce((acc, t) => acc + (t.pax || 1), 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";
      await fetch(`${apiUrl}/api/v1/payments/sync`, { method: "POST" });
    } catch {
      // Ignore background sync errors and continue refresh
    }
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Booking Code",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Program Name",
      "Experience Name",
      "Pax",
      "Gross Amount",
      "Platform Fee",
      "Net Payout",
      "Payment Method",
      "Status",
      "Date",
    ];

    const rows = transactions.map((t) => [
      t.id,
      t.booking_code,
      `"${t.customer_name}"`,
      t.customer_email,
      t.customer_phone || "-",
      `"${t.program_name}"`,
      `"${t.experience_name}"`,
      t.pax,
      t.gross_amount,
      t.platform_fee,
      t.net_payout,
      `"${t.payment_method}"`,
      t.status,
      t.date,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `index-aeli-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            Live traveler booking records and payment receipts processed from the web portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-1.5 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing..." : "Sync with Gateway"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1.5 size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatIDR(totalGross)}</div>
            <p className="text-xs text-muted-foreground mt-1">From {transactions.length} total bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Cleared Funds</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatIDR(clearedGross)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Settled into operator balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">In Clearance</CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {formatIDR(pendingGross)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending payment gateway settlement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Travelers</CardTitle>
            <Wallet className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalPax} Pax</div>
            <p className="text-xs text-muted-foreground mt-1">Across all confirmed bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Transactions Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent User Bookings & Transactions</CardTitle>
          <CardDescription>
            Showing all tourist registrations and reservations made on index-aeli-web.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <TransactionsTable data={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}

