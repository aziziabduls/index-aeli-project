"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { differenceInCalendarDays, endOfToday, format, isValid, parseISO } from "date-fns";
import { CircleAlertIcon, CircleCheckIcon, Clock3Icon, LoaderIcon, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import type { RecentCustomerRow } from "./schema";

function billingIcon(billing: string) {
  switch (billing) {
    case "Paid":
      return <CircleCheckIcon className="fill-green-500 stroke-primary-foreground dark:fill-green-600" />;
    case "Pending":
      return <LoaderIcon />;
    case "Overdue":
      return <CircleAlertIcon className="text-amber-600 dark:text-amber-500" />;
    case "Trial":
      return <Clock3Icon className="text-muted-foreground" />;
    default:
      return null;
  }
}

function parseSafeDate(raw: unknown): Date {
  if (!raw) return new Date();
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  try {
    const parsed = typeof raw === "string" ? parseISO(raw) : new Date(raw as string | number);
    if (isValid(parsed)) return parsed;
    const fallback = new Date(raw as string | number);
    if (isValid(fallback)) return fallback;
  } catch {
    // fallback
  }
  return new Date();
}

export const recentCustomersColumns: ColumnDef<RecentCustomerRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all customers on this page"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select ${row.original.name}`}
        />
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
          <UserRound className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-end justify-between gap-3">
            <div className="grid min-w-0 gap-0.5">
              <span className="truncate font-medium text-sm leading-none">{row.original.name}</span>
              <span className="truncate text-muted-foreground text-xs leading-none">{row.original.email}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.id} ${row.name} ${row.email} ${row.program_name} ${row.experience_name}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "program_name",
    header: "Program Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 max-w-[280px]">
        {/* <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted">
          <ListTodo className="size-3.5 text-primary" />
        </span> */}
        <span className="truncate font-medium text-sm text-foreground">
          {row.original.program_name}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "experience_name",
    header: "Experience Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 max-w-[240px]">
        {/* <Compass className="size-3.5 shrink-0 text-muted-foreground" /> */}
        <span className="truncate text-sm text-muted-foreground">
          {row.original.experience_name}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "billing",
    header: "Billing",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {billingIcon(row.original.billing)}
        {row.original.billing}
      </Badge>
    ),
  },
  {
    id: "joinedWindow",
    accessorFn: (row) => {
      try {
        const date = parseSafeDate(row.joined);
        const daysSinceJoined = differenceInCalendarDays(endOfToday(), date);

        if (daysSinceJoined <= 30) return ["30", "90"];
        if (daysSinceJoined <= 90) return ["90"];
      } catch {
        // ignore
      }
      return [];
    },
    filterFn: "arrIncludes",
    enableHiding: true,
  },
  {
    accessorKey: "joined",
    header: "Joined",
    cell: ({ row }) => {
      const date = parseSafeDate(row.original.joined);

      return (
        <div className="grid gap-0.5">
          <span className="text-sm">{format(date, "dd MMMM yyyy")}</span>
          <span className="text-muted-foreground text-xs">at {format(date, "h:mm a")}</span>
        </div>
      );
    },
  },
];
