"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import customersData from "./data.json";
import type { RecentCustomerRow } from "./recent-customers-table/schema";
import { RecentCustomersTable } from "./recent-customers-table/table";

const customers = customersData as RecentCustomerRow[];

export function SubscriberOverview({ initialData }: { readonly initialData?: RecentCustomerRow[] }) {
  const data = initialData && initialData.length > 0 ? initialData : customers;

  const handleExport = () => {
    const headers = ["ID", "Name", "Email", "Program Name", "Experience Name", "Billing", "Registration Date"];
    const rows = data.map((d) => [
      d.id,
      `"${d.name}"`,
      d.email,
      `"${d.program_name}"`,
      `"${d.experience_name}"`,
      d.billing,
      d.joined,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `index-aeli-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">{data.length} Registered Travelers & Customers</CardTitle>
        <CardDescription>Real traveler records with booked program, experience category, billing status, and registration date.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 size-3.5" />
            Export
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <RecentCustomersTable data={data} />
      </CardContent>
    </Card>
  );
}
