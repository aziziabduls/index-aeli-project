"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Edit, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { getClientCookie } from "@/lib/cookie.client";

interface Provider {
  id: string;
  legal_name: string;
  display_name: string | null;
  contact_info: {
    email?: string;
    phone?: string;
    pic?: string;
  } | null;
  status: string;
  created_at: string;
}

interface ProvidersClientProps {
  initialProviders: Provider[];
}

export function ProvidersClient({ initialProviders }: ProvidersClientProps) {
  const router = useRouter();

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  // Form fields
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  // Search filter
  const [search, setSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleOpenCreate = () => {
    setEditingProvider(null);
    setLegalName("");
    setDisplayName("");
    setEmail("");
    setPhone("");
    setStatus("active");
    setIsOpen(true);
  };

  const handleOpenEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setLegalName(provider.legal_name);
    setDisplayName(provider.display_name ?? "");
    setEmail(provider.contact_info?.email ?? "");
    setPhone(provider.contact_info?.phone ?? "");
    setStatus(provider.status);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!legalName.trim()) {
      return toast.error("Legal Name is required");
    }

    setLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const payload = {
        legal_name: legalName,
        display_name: displayName || legalName,
        contact_info: {
          email: email || undefined,
          phone: phone || undefined,
        },
        status,
      };

      const url = editingProvider
        ? `${apiUrl}/api/v1/admin/providers/${editingProvider.id}`
        : `${apiUrl}/api/v1/admin/providers`;

      const method = editingProvider ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to save provider");
      }

      toast.success(editingProvider ? "Provider updated successfully!" : "Provider created successfully!");
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while saving the provider";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = useMemo(() => {
    return initialProviders.filter(
      (p) =>
        p.legal_name.toLowerCase().includes(search.toLowerCase()) ||
        p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.contact_info?.email?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [initialProviders, search]);

  // Pagination calculations
  const pageCount = useMemo(() => {
    return Math.max(Math.ceil(filteredProviders.length / pageSize), 1);
  }, [filteredProviders, pageSize]);

  const activePage = Math.min(currentPage, pageCount);

  const paginatedProviders = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredProviders.slice(start, start + pageSize);
  }, [filteredProviders, activePage, pageSize]);

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
          <h1 className="font-bold text-3xl tracking-tight">Providers</h1>
          <p className="text-muted-foreground text-sm">
            Manage partner operators, legal entities, and contact information.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 size-4" />
          Add Provider
        </Button>
      </div>

      <div className="relative mb-2 flex max-w-sm items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          placeholder="Search providers..."
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
          <CardTitle>All Providers</CardTitle>
          <CardDescription>A list of registered partner agencies and entities.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Legal Name</TableHead>
                  <TableHead>Display Brand Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProviders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      No providers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProviders.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">{p.legal_name}</TableCell>
                      <TableCell className="text-sm">{p.display_name || "-"}</TableCell>
                      <TableCell className="text-xs">{p.contact_info?.email || "N/A"}</TableCell>
                      <TableCell className="text-xs">{p.contact_info?.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            p.status === "active"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                              : "border-slate-500/20 bg-slate-500/10 text-slate-400"
                          }
                          variant="outline"
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title="Edit Provider" onClick={() => handleOpenEdit(p)}>
                          <Edit className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredProviders.length > 0 && (
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
                      <SelectTrigger size="sm" className="w-20" id="providers-rows-per-page">
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
                    Showing {Math.min((activePage - 1) * pageSize + 1, filteredProviders.length)} to{" "}
                    {Math.min(activePage * pageSize, filteredProviders.length)} of {filteredProviders.length} entries
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Edit Provider" : "Add Provider"}</DialogTitle>
            <DialogDescription>Enter the legal name and contact details for the operator entity.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Legal Name *</span>
              <Input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="PT. Buana Orbit Tiga Sinergi"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Display Brand Name</span>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Buana Sinergi" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Contact Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pic@operator.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Phone Number</span>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +62812345678" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Operator"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
