"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Compass,
  Copy,
  CreditCard,
  Filter,
  Hash,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
  Users,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIDR } from "@/lib/currency";

import { transactionColumns } from "./columns";
import type { TransactionRow } from "./schema";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "cleared", label: "Cleared" },
  { value: "pending_clearance", label: "In Clearance" },
] as const;

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-high", label: "Highest amount" },
  { value: "amount-low", label: "Lowest amount" },
] as const;

const sortOptionState = {
  newest: [{ id: "date", desc: true }],
  oldest: [{ id: "date", desc: false }],
  "amount-high": [{ id: "gross_amount", desc: true }],
  "amount-low": [{ id: "gross_amount", desc: false }],
} satisfies Record<(typeof sortOptions)[number]["value"], SortingState>;

const pageSizeItems = [10, 20, 30, 40, 50].map((pageSize) => ({
  value: `${pageSize}`,
  label: `${pageSize}`,
}));

export function TransactionsTable({ data }: { data: TransactionRow[] }) {
  const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "date", desc: true }]);
  const [columnVisibility] = React.useState<VisibilityState>({
    search: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns: transactionColumns,
    meta: {
      onOpenDetail: (row: TransactionRow) => {
        setSelectedTransaction(row);
        setIsDrawerOpen(true);
      },
    },
    state: {
      rowSelection,
      columnFilters,
      sorting,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string) ?? "all";
  const sortValue = React.useMemo(() => {
    const currentSort = sorting[0];
    if (!currentSort) return "newest";

    if (currentSort.id === "date") {
      return currentSort.desc ? "newest" : "oldest";
    }

    if (currentSort.id === "gross_amount") {
      return currentSort.desc ? "amount-high" : "amount-low";
    }

    return "newest";
  }, [sorting]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search traveler, booking code, program..."
              value={searchQuery}
              onChange={(e) => {
                table.getColumn("search")?.setFilterValue(e.target.value);
                table.setPageIndex(0);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-9 text-xs" />}>
              <Filter className="mr-1.5 size-3.5" />
              Status
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(value) => {
                  table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value);
                  table.setPageIndex(0);
                }}
              >
                {statusOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-9 text-xs" />}>
              <ArrowUpDown className="mr-1.5 size-3.5" />
              Sort
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={sortValue}
                onValueChange={(value) => {
                  table.setSorting(sortOptionState[value as keyof typeof sortOptionState] ?? sortOptionState.newest);
                  table.setPageIndex(0);
                }}
              >
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/15">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan} className="h-11 p-3 font-medium text-xs">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={transactionColumns.length} className="h-24 text-center text-muted-foreground text-sm">
                  No transactions found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-xs">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} transaction(s) selected.
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size-select" className="text-muted-foreground text-xs">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(val) => val && table.setPageSize(Number(val))}
            >
              <SelectTrigger id="page-size-select" className="h-8 w-16 text-xs">
                <SelectValue placeholder={`${table.getState().pagination.pageSize}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {pageSizeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="text-xs">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground text-xs">
            Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Drawer */}
      <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg h-full">
          {selectedTransaction && (() => {
            let formattedDate = selectedTransaction.date;
            try {
              const d = parseISO(selectedTransaction.date);
              const validDate = isValid(d) ? d : new Date(selectedTransaction.date);
              if (isValid(validDate)) {
                formattedDate = `${format(validDate, "dd MMMM yyyy, HH:mm")} WIB`;
              }
            } catch {
              // fallback
            }

            const copyBookingCode = () => {
              if (selectedTransaction.booking_code) {
                navigator.clipboard.writeText(selectedTransaction.booking_code);
                toast.success("Booking code copied");
              }
            };

            const isCleared = ["cleared", "paid", "completed"].includes(
              selectedTransaction.status.toLowerCase()
            );

            return (
              <div className="flex h-full flex-col">
                <DrawerHeader className="border-b border-border/40 px-6 py-5">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                        isCleared
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${isCleared ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {isCleared ? "Cleared" : "In clearance"}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formattedDate}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 text-left">
                    <div className="min-w-0 flex-1">
                      <DrawerTitle className="font-mono text-base font-semibold text-foreground tracking-tight">
                        {selectedTransaction.booking_code || selectedTransaction.id}
                      </DrawerTitle>
                      <DrawerDescription className="text-xs text-muted-foreground mt-1">
                        <span>Transaction reference {selectedTransaction.id}</span>
                      </DrawerDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={copyBookingCode}
                    >
                      <Copy className="size-3.5" />
                      Copy
                    </Button>
                  </div>
                </DrawerHeader>

                <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Customer
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Name</span>
                        <span className="font-medium text-foreground">{selectedTransaction.customer_name}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Email</span>
                        <span className="font-mono text-xs text-foreground">{selectedTransaction.customer_email}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Phone</span>
                        <span className="font-mono text-xs text-foreground">{selectedTransaction.customer_phone || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Party size</span>
                        <span className="text-xs font-medium text-foreground tabular-nums">
                          {selectedTransaction.pax} traveler{selectedTransaction.pax > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Trip
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-start justify-between gap-4 px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs shrink-0">Program</span>
                        <span className="font-medium text-foreground text-right text-xs">
                          {selectedTransaction.program_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Experience</span>
                        <span className="text-foreground text-xs">{selectedTransaction.experience_name}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Location</span>
                        <span className="text-foreground text-xs">{selectedTransaction.location_name || "Indonesia"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Settlement
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Payment method</span>
                        <span className="text-foreground text-xs">
                          {selectedTransaction.payment_method}
                          {selectedTransaction.issuer ? ` (${selectedTransaction.issuer.toUpperCase()})` : ""}
                        </span>
                      </div>
                      {selectedTransaction.order_id && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">Order ID</span>
                          <span className="font-mono text-xs text-foreground">{selectedTransaction.order_id}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Gross total</span>
                        <span className="font-medium text-foreground tabular-nums text-xs">
                          {formatIDR(selectedTransaction.gross_amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Platform fee (5%)</span>
                        <span className="text-muted-foreground tabular-nums text-xs">
                          -{formatIDR(selectedTransaction.platform_fee)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/20">
                        <span className="font-medium text-foreground text-xs">Net payout</span>
                        <span className="font-semibold text-foreground tabular-nums text-xs">
                          {formatIDR(selectedTransaction.net_payout)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <DrawerFooter className="border-t border-border/40 px-6 py-4">
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full h-9 text-xs">
                      Close
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            );
          })()}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

