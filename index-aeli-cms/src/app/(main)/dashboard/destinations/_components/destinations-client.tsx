"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Edit, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUploader } from "@/components/ui/image-uploader";
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

export function DestinationsClient({ initialDestinations }: DestinationsClientProps) {
  const router = useRouter();

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
          <h1 className="font-bold text-3xl tracking-tight">Destinations</h1>
          <p className="text-muted-foreground text-sm">
            Manage physical locations, regional descriptions, and popularity flags.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 size-4" />
          Add Destination
        </Button>
      </div>

      <div className="relative mb-2 flex max-w-sm items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          placeholder="Search destinations..."
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
          <CardTitle>All Destinations</CardTitle>
          <CardDescription>A list of geographic spots that contain travel programs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Best Time to Visit</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDestinations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      No destinations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDestinations.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-semibold">{d.name}</TableCell>
                      <TableCell className="font-mono text-sm">{d.slug}</TableCell>
                      <TableCell className="text-xs">{d.best_time_to_visit || "N/A"}</TableCell>
                      <TableCell>
                        {d.is_popular ? (
                          <Star className="size-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <span className="text-muted-foreground text-xs">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(d.status)} variant="outline">
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {d.status !== "published" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-emerald-600 text-xs hover:text-emerald-700"
                              onClick={() => handleUpdateStatus(d.id, "published")}
                            >
                              Publish
                            </Button>
                          )}
                          {d.status === "published" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-rose-600 text-xs hover:text-rose-700"
                              onClick={() => handleUpdateStatus(d.id, "archived")}
                            >
                              Archive
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Destination"
                            onClick={() => handleOpenEdit(d)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="text-rose-500 hover:bg-rose-50"
                            onClick={() => handleDelete(d.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredDestinations.length > 0 && (
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
                      <SelectTrigger size="sm" className="w-20" id="destinations-rows-per-page">
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
                    Showing {Math.min((activePage - 1) * pageSize + 1, filteredDestinations.length)} to{" "}
                    {Math.min(activePage * pageSize, filteredDestinations.length)} of {filteredDestinations.length}{" "}
                    entries
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
    </div>
  );
}
