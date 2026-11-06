"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Archive,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  CloudSun,
  Edit,
  Eye,
  Globe,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getClientCookie } from "@/lib/cookie.client";

interface Destination {
  id: string;
  name: string;
  slug: string;
  description: string;
  overview: string | null;
  best_time_to_visit: string | null;
  is_popular: boolean;
  status: string;
  created_at: string;
  image?: string;
  gallery?: string[];
  capital?: string | null;
  population?: string | null;
  language?: string | null;
  timezone?: string | null;
  weather_temperature?: string | null;
  weather_condition?: string | null;
}

interface DestinationsClientProps {
  initialDestinations: Destination[];
}

function getStatusBadgeClass(status: string) {
  if (status === "published") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }
  if (status === "review") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-500";
  }
  if (status === "archived") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-500";
  }
  return "border-slate-500/20 bg-slate-500/10 text-slate-400";
}

const pageSizeItems = [10, 20, 30, 40, 50].map((pageSize) => ({
  value: `${pageSize}`,
  label: `${pageSize}`,
}));

export function DestinationsClient({ initialDestinations }: DestinationsClientProps) {
  const router = useRouter();

  // Drawer detail state
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);

  // Form fields
  const [formId, setFormId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [overview, setOverview] = useState("");
  const [bestTimeToVisit, setBestTimeToVisit] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [image, setImage] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [capital, setCapital] = useState("");
  const [population, setPopulation] = useState("");
  const [language, setLanguage] = useState("");
  const [timezone, setTimezone] = useState("");
  const [weatherTemperature, setWeatherTemperature] = useState("");
  const [weatherCondition, setWeatherCondition] = useState("");
  const [loading, setLoading] = useState(false);

  // Search filter
  const [search, setSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleOpenCreate = () => {
    setEditingDestination(null);
    setFormId(crypto.randomUUID());
    setName("");
    setDescription("");
    setOverview("");
    setBestTimeToVisit("");
    setIsPopular(false);
    setImage("");
    setGallery([]);
    setCapital("");
    setPopulation("");
    setLanguage("");
    setTimezone("");
    setWeatherTemperature("");
    setWeatherCondition("");
    setIsOpen(true);
  };

  const handleOpenEdit = (dest: Destination) => {
    setEditingDestination(dest);
    setFormId(dest.id);
    setName(dest.name);
    setDescription(dest.description);
    setOverview(dest.overview ?? "");
    setBestTimeToVisit(dest.best_time_to_visit ?? "");
    setIsPopular(dest.is_popular);
    setImage(dest.image ?? "");
    setGallery(dest.gallery ?? []);
    setCapital(dest.capital ?? "");
    setPopulation(dest.population ?? "");
    setLanguage(dest.language ?? "");
    setTimezone(dest.timezone ?? "");
    setWeatherTemperature(dest.weather_temperature ?? "");
    setWeatherCondition(dest.weather_condition ?? "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      return toast.error("Name and Description are required");
    }

    setLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const payload = {
        id: editingDestination ? undefined : formId,
        name,
        description,
        overview: overview || description,
        best_time_to_visit: bestTimeToVisit || undefined,
        is_popular: isPopular,
        image,
        gallery,
        capital: capital || undefined,
        population: population || undefined,
        language: language || undefined,
        timezone: timezone || undefined,
        weather_temperature: weatherTemperature || undefined,
        weather_condition: weatherCondition || undefined,
      };

      const url = editingDestination
        ? `${apiUrl}/api/v1/admin/destinations/${editingDestination.id}`
        : `${apiUrl}/api/v1/admin/destinations`;

      const method = editingDestination ? "PUT" : "POST";

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
        throw new Error(resJson.error || "Failed to save destination");
      }

      toast.success(
        editingDestination ? "Destination updated successfully!" : "Destination created successfully (Draft)!",
      );
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while saving the destination";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (destId: string, status: string) => {
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/admin/destinations/${destId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to update status");
      }

      toast.success(`Destination status updated to ${status}!`);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to change status";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (destId: string) => {
    if (!confirm("Are you sure you want to delete this destination? This action cannot be undone.")) return;

    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/admin/destinations/${destId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to delete destination");
      }

      toast.success("Destination deleted successfully!");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete destination";
      toast.error(errorMessage);
    }
  };

  const filteredDestinations = useMemo(() => {
    return initialDestinations.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase()),
    );
  }, [initialDestinations, search]);

  // Pagination calculations
  const pageCount = useMemo(() => {
    return Math.max(Math.ceil(filteredDestinations.length / pageSize), 1);
  }, [filteredDestinations, pageSize]);

  const activePage = Math.min(currentPage, pageCount);

  const paginatedDestinations = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredDestinations.slice(start, start + pageSize);
  }, [filteredDestinations, activePage, pageSize]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Destinations</h1>
          <p className="text-muted-foreground text-sm">
            Manage physical locations, regional descriptions, and popularity flags.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 size-4" />
          Add Destination
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-[min(var(--radius-md),12px)] pl-8"
              placeholder="Search destinations..."
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
                <TableHead className="h-11 p-3 font-medium">Slug</TableHead>
                <TableHead className="h-11 p-3 font-medium">Best Time to Visit</TableHead>
                <TableHead className="h-11 p-3 font-medium">Popular</TableHead>
                <TableHead className="h-11 p-3 font-medium">Status</TableHead>
                <TableHead className="h-11 p-3 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDestinations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No destinations found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDestinations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="p-3 align-middle font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDestination(d);
                          setIsDrawerOpen(true);
                        }}
                        className="text-left font-semibold text-foreground hover:text-primary hover:underline cursor-pointer focus:outline-hidden"
                        title="Click to view destination details"
                      >
                        {d.name}
                      </button>
                    </TableCell>
                    <TableCell className="p-3 align-middle font-mono text-sm">{d.slug}</TableCell>
                    <TableCell className="p-3 align-middle text-xs">{d.best_time_to_visit || "N/A"}</TableCell>
                    <TableCell className="p-3 align-middle">
                      {d.is_popular ? (
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <span className="text-muted-foreground text-xs">No</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 align-middle">
                      <Badge className={getStatusBadgeClass(d.status)} variant="outline">
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 align-middle text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              aria-label={`Open actions for ${d.name}`}
                              className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                              size="icon-sm"
                              variant="ghost"
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDestination(d);
                                setIsDrawerOpen(true);
                              }}
                            >
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(d)}>
                              <Edit className="mr-2 size-4" />
                              Edit Destination
                            </DropdownMenuItem>
                            {d.status !== "published" ? (
                              <DropdownMenuItem
                                className="text-emerald-600 focus:text-emerald-700"
                                onClick={() => handleUpdateStatus(d.id, "published")}
                              >
                                <CheckCircle className="mr-2 size-4" />
                                Publish
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-amber-600 focus:text-amber-700"
                                onClick={() => handleUpdateStatus(d.id, "archived")}
                              >
                                <Archive className="mr-2 size-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(d.id)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
            Showing {filteredDestinations.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to{" "}
            {Math.min(activePage * pageSize, filteredDestinations.length)} of {filteredDestinations.length} entries
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="destinations-rows-per-page" className="font-medium text-sm">
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
                <SelectTrigger size="sm" className="w-20" id="destinations-rows-per-page">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDestination ? "Edit Destination" : "Add Destination"}</DialogTitle>
            <DialogDescription>Provide regional profiles, description, and settings.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Name *</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kepulauan Seribu"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Description *</span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief summary describing the destination location."
                rows={3}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Overview Details</span>
              <Textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                placeholder="Detailed visitor guide and historical info."
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Best Time to Visit</span>
              <Input
                value={bestTimeToVisit}
                onChange={(e) => setBestTimeToVisit(e.target.value)}
                placeholder="e.g. May to September"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Regional Capital</span>
                <Input
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  placeholder="e.g. Denpasar"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Estimated Population</span>
                <Input
                  value={population}
                  onChange={(e) => setPopulation(e.target.value)}
                  placeholder="e.g. 4.3 Million"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Spoken Languages</span>
                <Input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. Balinese & Indonesian"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Timezone</span>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. GMT+8 (WITA)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Temperature</span>
                <Input
                  value={weatherTemperature}
                  onChange={(e) => setWeatherTemperature(e.target.value)}
                  placeholder="e.g. 28°C"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Weather Condition</span>
                <Input
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  placeholder="e.g. Sunny & Tropical"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Cover Image</span>
              <ImageUploader value={image} onChange={setImage} ownerType="destination" ownerId={formId} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Gallery Images</span>
              <ImageUploader value={gallery} onChange={setGallery} multiple ownerType="destination" ownerId={formId} />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="isPopular"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isPopular" className="cursor-pointer font-medium text-sm">
                Highlight as Popular Destination
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Destination"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Destination Detail Drawer */}
      <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg h-full">
          {selectedDestination && (() => {
            const isPublished = selectedDestination.status === "published";

            return (
              <div className="flex h-full flex-col">
                <DrawerHeader className="border-b border-border/40 px-6 py-5">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                          isPublished
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-500/10 text-slate-700 dark:text-slate-400"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-slate-400"}`}
                        />
                        {selectedDestination.status}
                      </span>
                      {selectedDestination.is_popular && (
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          Featured
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{selectedDestination.slug}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 text-left">
                    <div className="min-w-0 flex-1">
                      <DrawerTitle className="text-base font-semibold text-foreground tracking-tight">
                        {selectedDestination.name}
                      </DrawerTitle>
                      <DrawerDescription className="text-xs text-muted-foreground mt-1">
                        <span>Destination ID {selectedDestination.id}</span>
                      </DrawerDescription>
                    </div>
                  </div>
                </DrawerHeader>

                <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Hero Image */}
                  {selectedDestination.image && (
                    <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/20">
                      <img
                        src={selectedDestination.image}
                        alt={selectedDestination.name}
                        className="h-44 w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Destination Profile */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Profile
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Best time to visit</span>
                        <span className="font-medium text-foreground text-xs">
                          {selectedDestination.best_time_to_visit || "All year"}
                        </span>
                      </div>
                      {selectedDestination.capital && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">Capital / Hub</span>
                          <span className="text-foreground text-xs">{selectedDestination.capital}</span>
                        </div>
                      )}
                      {selectedDestination.timezone && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">Timezone</span>
                          <span className="font-mono text-xs text-foreground">{selectedDestination.timezone}</span>
                        </div>
                      )}
                      {selectedDestination.language && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">Language</span>
                          <span className="text-foreground text-xs">{selectedDestination.language}</span>
                        </div>
                      )}
                      {selectedDestination.population && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">Population</span>
                          <span className="text-xs text-foreground tabular-nums">{selectedDestination.population}</span>
                        </div>
                      )}
                      {(selectedDestination.weather_temperature || selectedDestination.weather_condition) && (
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-muted-foreground text-xs">Weather</span>
                          <span className="text-xs text-foreground">
                            {selectedDestination.weather_temperature || ""} {selectedDestination.weather_condition ? `(${selectedDestination.weather_condition})` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description & Overview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Overview
                    </h4>
                    <div className="rounded-lg border border-border/40 p-3.5 text-xs text-foreground/90 space-y-3 leading-relaxed">
                      <p>{selectedDestination.description}</p>
                      {selectedDestination.overview && (
                        <div className="border-t border-border/30 pt-2.5 text-muted-foreground space-y-1">
                          <span className="text-foreground text-xs font-medium block">Regional overview</span>
                          <p className="whitespace-pre-line">{selectedDestination.overview}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gallery */}
                  {selectedDestination.gallery && selectedDestination.gallery.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Gallery ({selectedDestination.gallery.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedDestination.gallery.map((imgUrl, i) => (
                          <img
                            key={i}
                            src={imgUrl}
                            alt=""
                            className="h-20 w-full rounded-md border border-border/40 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DrawerFooter className="border-t border-border/40 px-6 py-4">
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      className="flex-1 h-9 text-xs gap-1.5"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleOpenEdit(selectedDestination);
                      }}
                    >
                      <Edit className="size-3.5" />
                      Edit destination
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
