"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Eye,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const pageSizeItems = [10, 20, 30, 40, 50].map((pageSize) => ({
  value: `${pageSize}`,
  label: `${pageSize}`,
}));

export function ProvidersClient({ initialProviders }: ProvidersClientProps) {
  const router = useRouter();

  // Drawer detail state
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Providers</h1>
          <p className="text-muted-foreground text-sm">
            Manage partner operators, legal entities, and contact information.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 size-4" />
          Add Provider
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-[min(var(--radius-md),12px)] pl-8"
              placeholder="Search providers..."
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
                <TableHead className="h-11 p-3 font-medium">Legal Name</TableHead>
                <TableHead className="h-11 p-3 font-medium">Display Brand Name</TableHead>
                <TableHead className="h-11 p-3 font-medium">Contact Email</TableHead>
                <TableHead className="h-11 p-3 font-medium">Phone</TableHead>
                <TableHead className="h-11 p-3 font-medium">Status</TableHead>
                <TableHead className="h-11 p-3 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No providers found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProviders.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="p-3 align-middle font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProvider(p);
                          setIsDrawerOpen(true);
                        }}
                        className="text-left font-semibold text-foreground hover:text-primary hover:underline cursor-pointer focus:outline-hidden"
                        title="Click to view provider details"
                      >
                        {p.legal_name}
                      </button>
                    </TableCell>
                    <TableCell className="p-3 align-middle text-sm">{p.display_name || "-"}</TableCell>
                    <TableCell className="p-3 align-middle text-xs">{p.contact_info?.email || "N/A"}</TableCell>
                    <TableCell className="p-3 align-middle text-xs">{p.contact_info?.phone || "N/A"}</TableCell>
                    <TableCell className="p-3 align-middle">
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
                    <TableCell className="p-3 align-middle text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="View Provider Details"
                          onClick={() => {
                            setSelectedProvider(p);
                            setIsDrawerOpen(true);
                          }}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="Edit Provider"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Edit className="size-4" />
                        </Button>
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
            Showing {filteredProviders.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to{" "}
            {Math.min(activePage * pageSize, filteredProviders.length)} of {filteredProviders.length} entries
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="providers-rows-per-page" className="font-medium text-sm">
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
                <SelectTrigger size="sm" className="w-20" id="providers-rows-per-page">
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

      {/* Provider Detail Drawer */}
      <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg h-full">
          {selectedProvider && (() => {
            const isActive = selectedProvider.status === "active";

            return (
              <div className="flex h-full flex-col">
                <DrawerHeader className="border-b border-border/40 px-6 py-5">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-500/10 text-slate-700 dark:text-slate-400"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                      />
                      {selectedProvider.status}
                    </span>
                    <span className="text-xs text-muted-foreground">AELI Verified Operator</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 text-left">
                    <div className="min-w-0 flex-1">
                      <DrawerTitle className="text-base font-semibold text-foreground tracking-tight">
                        {selectedProvider.legal_name}
                      </DrawerTitle>
                      {selectedProvider.display_name && (
                        <DrawerDescription className="text-xs text-muted-foreground mt-1">
                          <span>Trade brand: {selectedProvider.display_name}</span>
                        </DrawerDescription>
                      )}
                    </div>
                  </div>
                </DrawerHeader>

                <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Entity Information */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Entity details
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Legal name</span>
                        <span className="font-medium text-foreground text-xs">{selectedProvider.legal_name}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Display name</span>
                        <span className="text-foreground text-xs">{selectedProvider.display_name || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Provider ID</span>
                        <span className="font-mono text-muted-foreground text-[11px]">{selectedProvider.id}</span>
                      </div>
                      {selectedProvider.created_at && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">Registered</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {new Date(selectedProvider.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Contact & representative
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Email</span>
                        <span className="font-mono text-xs text-foreground">{selectedProvider.contact_info?.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Phone</span>
                        <span className="font-mono text-xs text-foreground">{selectedProvider.contact_info?.phone || "N/A"}</span>
                      </div>
                      {selectedProvider.contact_info?.pic && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">PIC</span>
                          <span className="text-foreground text-xs">{selectedProvider.contact_info.pic}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DrawerFooter className="border-t border-border/40 px-6 py-4">
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      className="flex-1 h-9 text-xs gap-1.5"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleOpenEdit(selectedProvider);
                      }}
                    >
                      <Edit className="size-3.5" />
                      Edit provider
                    </Button>
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
