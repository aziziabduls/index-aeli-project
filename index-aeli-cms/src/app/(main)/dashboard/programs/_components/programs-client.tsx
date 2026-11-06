"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Compass,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIDR } from "@/lib/currency";

export interface ProgramRow {
  id: string;
  name: string;
  category: string;
  location_label: string;
  provider_id: string;
  destination_id: string | null;
  price_min: string | null;
  price_max: string | null;
  price_note: string | null;
  duration_label: string;
  max_guest_min?: number | null;
  max_guest_max?: number | null;
  min_quota?: number | null;
  max_quota?: number | null;
  date_availability?: string | null;
  available_dates?: string[] | null;
  status: string;
}

export interface Provider {
  id: string;
  legal_name: string;
}

export interface Destination {
  id: string;
  name: string;
}

interface ProgramsClientProps {
  initialPrograms: ProgramRow[];
  providers: Provider[];
  destinations: Destination[];
}

const pageSizeItems = [10, 20, 30, 40, 50].map((pageSize) => ({
  value: `${pageSize}`,
  label: `${pageSize}`,
}));

export function ProgramsClient({ initialPrograms, providers, destinations }: ProgramsClientProps) {
  // Detail Drawer state
  const [selectedProgram, setSelectedProgram] = useState<ProgramRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search state
  const [search, setSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Helper lookup maps
  const providerMap = useMemo(() => new Map(providers.map((p) => [p.id, p.legal_name])), [providers]);
  const destinationMap = useMemo(() => new Map(destinations.map((d) => [d.id, d.name])), [destinations]);

  // Helper to map status to styling
  const statusColors: Record<string, string> = {
    draft: "border-slate-500/20 bg-slate-500/10 text-slate-400",
    review: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    published: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    archived: "border-rose-500/20 bg-rose-500/10 text-rose-500",
  };

  const formatPrice = (min: number | null, max: number | null) => {
    if (min === null || min === 0 || isNaN(min)) {
      if (max && max > 0 && !isNaN(max)) return formatIDR(max);
      return "By Quotation";
    }
    if (max && max > min && !isNaN(max)) {
      return `${formatIDR(min)} - ${formatIDR(max)}`;
    }
    return formatIDR(min);
  };

  // Filtered programs
  const filteredPrograms = useMemo(() => {
    return initialPrograms.filter((prog) => {
      const searchLower = search.toLowerCase();
      const progName = prog.name.toLowerCase();
      const category = prog.category.toLowerCase();
      const location = (prog.location_label || "").toLowerCase();
      const providerName = (providerMap.get(prog.provider_id) || "").toLowerCase();
      const destName = prog.destination_id ? (destinationMap.get(prog.destination_id) || "").toLowerCase() : "";

      return (
        progName.includes(searchLower) ||
        category.includes(searchLower) ||
        location.includes(searchLower) ||
        providerName.includes(searchLower) ||
        destName.includes(searchLower)
      );
    });
  }, [initialPrograms, search, providerMap, destinationMap]);

  // Pagination logic
  const pageCount = useMemo(() => {
    return Math.max(Math.ceil(filteredPrograms.length / pageSize), 1);
  }, [filteredPrograms, pageSize]);

  // Fallback to max page if current page overflows (e.g. after filtering)
  const activePage = Math.min(currentPage, pageCount);

  const paginatedPrograms = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredPrograms.slice(start, start + pageSize);
  }, [filteredPrograms, activePage, pageSize]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Programs</h1>
          <p className="text-muted-foreground text-sm">
            Manage tour programs, itineraries, rundowns, and pricing details.
          </p>
        </div>

        <Link href="/dashboard/programs/create" prefetch={false}>
          <Button size="sm">
            <Plus className="mr-2 size-4" />
            Create Program
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-[min(var(--radius-md),12px)] pl-8"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/15">
              <TableRow>
                <TableHead className="h-11 p-3 font-medium">Name</TableHead>
                <TableHead className="h-11 p-3 font-medium">Category</TableHead>
                <TableHead className="h-11 p-3 font-medium">Provider</TableHead>
                <TableHead className="h-11 p-3 font-medium">Destination</TableHead>
                <TableHead className="h-11 p-3 font-medium">Price</TableHead>
                <TableHead className="h-11 p-3 font-medium">Duration</TableHead>
                <TableHead className="h-11 p-3 font-medium">Status</TableHead>
                <TableHead className="h-11 p-3 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No programs found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPrograms.map((prog) => (
                  <TableRow key={prog.id}>
                    <TableCell className="p-3 align-middle font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProgram(prog);
                          setIsDrawerOpen(true);
                        }}
                        className="text-left font-semibold text-foreground hover:text-primary hover:underline cursor-pointer focus:outline-hidden"
                        title="Click to view program details"
                      >
                        {prog.name}
                      </button>
                    </TableCell>
                    <TableCell className="p-3 align-middle text-xs">{prog.category}</TableCell>
                    <TableCell className="p-3 align-middle max-w-[150px] truncate text-xs">
                      {providerMap.get(prog.provider_id) || "Unknown Provider"}
                    </TableCell>
                    <TableCell className="p-3 align-middle text-xs">
                      {prog.destination_id ? destinationMap.get(prog.destination_id) || "Unknown" : "N/A"}
                    </TableCell>
                    <TableCell className="p-3 align-middle text-xs font-medium tabular-nums">
                      {formatPrice(
                        prog.price_min ? Number(prog.price_min) : null,
                        prog.price_max ? Number(prog.price_max) : null,
                      )}
                    </TableCell>
                    <TableCell className="p-3 align-middle text-xs">
                      <div className="font-medium">{prog.duration_label}</div>
                    </TableCell>
                    <TableCell className="p-3 align-middle">
                      <Badge className={statusColors[prog.status] || ""} variant="outline">
                        {prog.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 align-middle text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="View Program Details"
                          onClick={() => {
                            setSelectedProgram(prog);
                            setIsDrawerOpen(true);
                          }}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Link href={`/dashboard/programs/${prog.id}`} prefetch={false}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            title="Edit Program"
                          >
                            <Edit className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
            Showing {filteredPrograms.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to{" "}
            {Math.min(activePage * pageSize, filteredPrograms.length)} of {filteredPrograms.length} entries
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="programs-rows-per-page" className="font-medium text-sm">
                Rows per page
              </Label>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  if (value) {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }
                }}
                items={pageSizeItems}
              >
                <SelectTrigger size="sm" className="w-20" id="programs-rows-per-page">
                  <SelectValue placeholder={`${pageSize}`} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {pageSizeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center font-medium text-sm">
              Page {activePage} of {pageCount}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={activePage <= 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={activePage <= 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
                disabled={activePage >= pageCount}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => setCurrentPage(pageCount)}
                disabled={activePage >= pageCount}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Program Detail Drawer */}
      <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg h-full">
          {selectedProgram && (() => {
            const providerName = providerMap.get(selectedProgram.provider_id) || "Unknown Provider";
            const destName = selectedProgram.destination_id
              ? destinationMap.get(selectedProgram.destination_id) || "Unassigned"
              : "N/A";

            return (
              <div className="flex h-full flex-col">
                <DrawerHeader className="border-b border-border/40 px-6 py-5">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                        selectedProgram.status === "published"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-500/10 text-slate-700 dark:text-slate-400"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          selectedProgram.status === "published" ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {selectedProgram.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{selectedProgram.category}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 text-left">
                    <div className="min-w-0 flex-1">
                      <DrawerTitle className="text-base font-semibold text-foreground tracking-tight">
                        {selectedProgram.name}
                      </DrawerTitle>
                      <DrawerDescription className="text-xs text-muted-foreground mt-1">
                        <span>ID {selectedProgram.id}</span>
                      </DrawerDescription>
                    </div>
                  </div>
                </DrawerHeader>

                <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Provider & Location */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Provider & location
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Certified provider</span>
                        <span className="font-medium text-foreground text-xs">{providerName}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Destination</span>
                        <span className="text-foreground text-xs">{destName}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Area</span>
                        <span className="text-foreground text-xs">{selectedProgram.location_label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Pricing
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Published price</span>
                        <span className="font-medium text-foreground tabular-nums text-xs">
                          {formatPrice(
                            selectedProgram.price_min ? Number(selectedProgram.price_min) : null,
                            selectedProgram.price_max ? Number(selectedProgram.price_max) : null,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Price range</span>
                        <span className="text-muted-foreground tabular-nums text-xs">
                          {selectedProgram.price_min ? formatIDR(Number(selectedProgram.price_min)) : "-"}
                          {selectedProgram.price_max ? ` – ${formatIDR(Number(selectedProgram.price_max))}` : ""}
                        </span>
                      </div>
                      {selectedProgram.price_note && (
                        <div className="px-3.5 py-2.5 text-xs text-muted-foreground leading-relaxed">
                          <span className="text-muted-foreground block text-[11px] mb-0.5">Note</span>
                          {selectedProgram.price_note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Duration & Availability */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Schedule & capacity
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Duration</span>
                        <span className="font-medium text-foreground text-xs">{selectedProgram.duration_label}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Seasonality</span>
                        <span className="text-foreground text-xs">
                          {selectedProgram.date_availability || "All year"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Guest limits</span>
                        <span className="text-xs text-foreground tabular-nums">
                          {selectedProgram.max_guest_min || 1} – {selectedProgram.max_guest_max || 50} guests
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Quota</span>
                        <span className="text-xs text-foreground tabular-nums">
                          {selectedProgram.min_quota || 1} – {selectedProgram.max_quota || 100} slots
                        </span>
                      </div>
                    </div>

                    {selectedProgram.available_dates && selectedProgram.available_dates.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-muted-foreground text-[11px] block">Specific departure dates</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProgram.available_dates.map((dateStr) => (
                            <span
                              key={dateStr}
                              className="rounded border border-border/40 bg-muted/20 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                            >
                              {dateStr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DrawerFooter className="border-t border-border/40 px-6 py-4">
                  <div className="flex items-center gap-2 w-full">
                    <Link
                      href={`/dashboard/programs/${selectedProgram.id}`}
                      prefetch={false}
                      className="flex-1"
                    >
                      <Button className="w-full h-9 text-xs gap-1.5">
                        <Edit className="size-3.5" />
                        Edit program
                      </Button>
                    </Link>
                    <DrawerClose asChild>
                      <Button variant="outline" className="h-9 text-xs px-4">
                        Close
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerFooter>
              </div>
            );
          })()}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
