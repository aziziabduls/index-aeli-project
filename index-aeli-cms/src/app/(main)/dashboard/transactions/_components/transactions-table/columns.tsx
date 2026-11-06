"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  UserRound
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatIDR } from "@/lib/currency";

import type { TransactionRow } from "./schema";

function statusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "cleared":
    case "paid":
    case "completed":
      return (
        <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3" />
          Paid
        </Badge>
      );
    case "pending_clearance":
    case "pending":
      return (
        <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Clock className="size-3" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          {status}
        </Badge>
      );
  }
}

export const transactionColumns: ColumnDef<TransactionRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all transactions on this page"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select transaction ${row.original.id}`}
        />
      </div>
    ),
    enableHiding: false,
  },
  {
    id: "transaction",
    header: "Transaction",
    cell: ({ row, table }) => {
      const meta = table.options.meta as { onOpenDetail?: (row: TransactionRow) => void } | undefined;
      return (
        <button
          type="button"
          onClick={() => meta?.onOpenDetail?.(row.original)}
          className="text-left group cursor-pointer focus:outline-hidden"
          title="Click to view transaction details"
        >
          <div className="grid gap-0.5">

            <span className="font-mono font-semibold text-xs text-foreground group-hover:text-primary group-hover:underline">
              {row.original.booking_code || row.original.id}
            </span>
            <span className="font-mono text-xs text-foreground group-hover:text-primary group-hover:underline">
              {row.original.order_id}
            </span>
          </div>
        </button>
      );
    },
  },
  {
    accessorKey: "customer_name",
    header: "Customer / Traveler",
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
          <UserRound className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-sm leading-none text-foreground">
            {row.original.customer_name}
          </div>
          <div className="truncate text-muted-foreground text-xs leading-tight mt-0.5">
            {row.original.customer_email}
          </div>
          {/* {row.original.customer_phone && row.original.customer_phone !== "-" && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="size-2.5" />
              <span>{row.original.customer_phone}</span>
            </div>
          )} */}
        </div>
      </div>
    ),
  },
  {
    id: "search",
    accessorFn: (row) =>
      `${row.id} ${row.booking_code} ${row.customer_name} ${row.customer_email} ${row.program_name} ${row.experience_name} ${row.location_name || ""}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "program_name",
    header: "Program Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 max-w-[240px]">
        <span className="truncate font-medium text-sm text-foreground">
          {row.original.program_name}
        </span>
      </div>
    ),
  },
  // {
  //   id: "location_experience",
  //   header: "Location & Experience",
  //   cell: ({ row }) => (
  //     <div className="grid gap-1 max-w-[200px]">
  //       <div className="flex items-center gap-1.5 text-xs font-medium text-foreground truncate">
  //         <MapPin className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
  //         <span className="truncate">{row.original.location_name || "Indonesia"}</span>
  //       </div>
  //       <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
  //         <Compass className="size-3 shrink-0" />
  //         <span className="truncate">{row.original.experience_name}</span>
  //       </div>
  //     </div>
  //   ),
  // },
  {
    accessorKey: "gross_amount",
    header: "Total Pembayaran",
    cell: ({ row }) => (
      <div className="grid gap-0.5 text-right sm:text-left">
        <span className="font-medium text-sm text-foreground tabular-nums">
          {formatIDR(row.original.gross_amount)}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {row.original.pax} traveler{row.original.pax > 1 ? "s" : ""}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "payment_method",
    header: "Metode Bayar",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <CreditCard className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-foreground truncate max-w-[150px]">
          {row.original.payment_method}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => statusBadge(row.original.status),
  },
  {
    accessorKey: "date",
    header: "Transaction Date",
    cell: ({ row }) => {
      try {
        const d = parseISO(row.original.date);
        const validDate = isValid(d) ? d : new Date(row.original.date);
        if (!isValid(validDate)) throw new Error("Invalid date");
        return (
          <div className="grid gap-0.5">
            <span className="text-xs text-foreground whitespace-nowrap">
              {format(validDate, "dd MMM yyyy")}
            </span>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {format(validDate, "HH:mm")} WIB
            </span>
          </div>
        );
      } catch {
        return <span className="text-xs text-muted-foreground">{row.original.date || "-"}</span>;
      }
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as { onOpenDetail?: (row: TransactionRow) => void } | undefined;
      return (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            title="View Details"
            onClick={() => meta?.onOpenDetail?.(row.original)}
          >
            <Eye className="size-4" />
          </Button>
        </div>
      );
    },
  },
];

