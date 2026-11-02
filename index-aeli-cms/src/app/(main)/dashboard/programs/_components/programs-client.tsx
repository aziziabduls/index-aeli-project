"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Edit, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export function ProgramsClient({ initialPrograms, providers, destinations }: ProgramsClientProps) {
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

  const formatPrice = (min: number | null, max: number | null, note: string | null) => {
    if (note && note.trim().length > 0) {
      return note;
    }
    if (min === null || min === 0) {
      return "By Quotation / Free";
    }
    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });
    if (max && max > min) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    return formatter.format(min);
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

  const pageNumbers = useMemo(() => {
    if (pageCount <= 3) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }
    if (activePage <= 2) return [1, 2, 3];
    if (activePage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [activePage - 1, activePage, activePage + 1];
  }, [activePage, pageCount]);

  const preventNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-3xl tracking-tight">Programs</h1>
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

      <div className="relative mb-2 flex max-w-sm items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          placeholder="Search programs..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Programs</CardTitle>
          <CardDescription>A list of all tour programs in the catalog.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPrograms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                      No programs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPrograms.map((prog) => (
                    <TableRow key={prog.id}>
                      <TableCell className="font-medium">{prog.name}</TableCell>
                      <TableCell className="text-xs">{prog.category}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs">
                        {providerMap.get(prog.provider_id) || "Unknown Provider"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {prog.destination_id ? destinationMap.get(prog.destination_id) || "Unknown" : "N/A"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatPrice(
                          prog.price_min ? Number(prog.price_min) : null,
                          prog.price_max ? Number(prog.price_max) : null,
                          prog.price_note,
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{prog.duration_label}</div>
                        {(prog.min_quota || prog.max_quota || prog.max_guest_min || prog.max_guest_max) ? (
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                            Quota: {prog.min_quota ?? prog.max_guest_min ?? 1} - {prog.max_quota ?? prog.max_guest_max ?? "∞"} pax
                          </div>
                        ) : null}
                        {prog.date_availability && prog.date_availability !== "all_days" ? (
                          <div className="text-[10px] font-semibold text-amber-600 mt-0.5">
                            {prog.date_availability === "weekends"
                              ? "Weekends only"
                              : prog.date_availability === "weekdays"
                                ? "Weekdays only"
                                : `${prog.available_dates?.length || 0} specific dates`}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground/70 mt-0.5">Everyday</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[prog.status] || ""} variant="outline">
                          {prog.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/programs/${prog.id}`} prefetch={false}>
                          <Button variant="ghost" size="icon" title="Edit Program">
                            <Edit className="size-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredPrograms.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-4 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                  <div className="flex items-center gap-2">
                    <span>Rows per page</span>
                    <Select
                      value={`${pageSize}`}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger size="sm" className="w-20" id="programs-rows-per-page">
                        <SelectValue placeholder={`${pageSize}`} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        <SelectGroup>
                          {[10, 20, 30, 40, 50].map((size) => (
                            <SelectItem key={size} value={`${size}`}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <span>
                    Showing {Math.min((activePage - 1) * pageSize + 1, filteredPrograms.length)} to{" "}
                    {Math.min(activePage * pageSize, filteredPrograms.length)} of {filteredPrograms.length} entries
                  </span>
                </div>

                <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        text=""
                        className={activePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        onClick={(e) => {
                          preventNavigation(e);
                          if (activePage > 1) setCurrentPage(activePage - 1);
                        }}
                      />
                    </PaginationItem>

                    {pageNumbers[0] > 1 && (
                      <>
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              preventNavigation(e);
                              setCurrentPage(1);
                            }}
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {pageNumbers[0] > 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                      </>
                    )}

                    {pageNumbers.map((pageNumber) => (
                      <PaginationItem key={`page-${pageNumber}`}>
                        <PaginationLink
                          href="#"
                          isActive={activePage === pageNumber}
                          onClick={(e) => {
                            preventNavigation(e);
                            setCurrentPage(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    {pageNumbers[pageNumbers.length - 1] < pageCount && (
                      <>
                        {pageNumbers[pageNumbers.length - 1] < pageCount - 1 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              preventNavigation(e);
                              setCurrentPage(pageCount);
                            }}
                          >
                            {pageCount}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        text=""
                        className={activePage === pageCount ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        onClick={(e) => {
                          preventNavigation(e);
                          if (activePage < pageCount) setCurrentPage(activePage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
