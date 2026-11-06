"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Archive,
  Building,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Compass,
  Edit,
  Eye,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
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
}

interface Attraction {
  id: string;
  destination_id: string;
  destination_name?: string;
  name: string;
  slug: string;
  location_label: string;
  description: string;
  about: string | null;
  historical_background: string | null;
  operational_hours: string | null;
  facilities: string[] | null;
  status: string;
  created_at: string;
  image?: string;
  gallery?: string[];
}

interface AttractionsClientProps {
  initialAttractions: Attraction[];
  destinations: Destination[];
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

export function AttractionsClient({ initialAttractions, destinations }: AttractionsClientProps) {
  const router = useRouter();

  // Drawer detail state
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);

  // Form fields
  const [formId, setFormId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [name, setName] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [historicalBackground, setHistoricalBackground] = useState("");
  const [operationalHours, setOperationalHours] = useState("");
  const [facilitiesText, setFacilitiesText] = useState("");
  const [image, setImage] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Search filter
  const [search, setSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleOpenCreate = () => {
    setEditingAttraction(null);
    setFormId(crypto.randomUUID());
    setDestinationId(destinations[0] ? destinations[0].id : "");
    setName("");
    setLocationLabel("");
    setDescription("");
    setAbout("");
    setHistoricalBackground("");
    setOperationalHours("");
    setFacilitiesText("");
    setImage("");
    setGallery([]);
    setIsOpen(true);
  };

  const handleOpenEdit = (attr: Attraction) => {
    setEditingAttraction(attr);
    setFormId(attr.id);
    setDestinationId(attr.destination_id);
    setName(attr.name);
    setLocationLabel(attr.location_label);
    setDescription(attr.description);
    setAbout(attr.about ?? "");
    setHistoricalBackground(attr.historical_background ?? "");
    setOperationalHours(attr.operational_hours ?? "");
    setFacilitiesText(attr.facilities ? attr.facilities.join("\n") : "");
    setImage(attr.image ?? "");
    setGallery(attr.gallery ?? []);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!destinationId || !name.trim() || !locationLabel.trim() || !description.trim()) {
      return toast.error("Destination, Name, Location Label, and Description are required");
    }

    setLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const facilities = facilitiesText
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const payload = {
        id: editingAttraction ? undefined : formId,
        destination_id: destinationId,
        name,
        location_label: locationLabel,
        description,
        about: about || description,
        historical_background: historicalBackground,
        operational_hours: operationalHours,
        facilities,
        image,
        gallery,
      };

      const url = editingAttraction
        ? `${apiUrl}/api/v1/admin/attractions/${editingAttraction.id}`
        : `${apiUrl}/api/v1/admin/attractions`;

      const method = editingAttraction ? "PUT" : "POST";

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
        throw new Error(resJson.error || "Failed to save experience");
      }

      toast.success(
        editingAttraction ? "Experience updated successfully!" : "Experience created successfully (Draft)!",
      );
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while saving the experience";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (attrId: string, status: string) => {
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/admin/attractions/${attrId}/status`, {
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

      toast.success(`Experience status updated to ${status}!`);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to change status";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (attrId: string) => {
    if (!confirm("Are you sure you want to delete this experience? This will remove related records.")) return;

    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/admin/attractions/${attrId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to delete experience");
      }

      toast.success("Experience deleted successfully!");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete experience";
      toast.error(errorMessage);
    }
  };

  const filteredAttractions = useMemo(() => {
    return initialAttractions.filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.location_label.toLowerCase().includes(search.toLowerCase()) ||
        a.destination_name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [initialAttractions, search]);

  // Pagination calculations
  const pageCount = useMemo(() => {
    return Math.max(Math.ceil(filteredAttractions.length / pageSize), 1);
  }, [filteredAttractions, pageSize]);

  const activePage = Math.min(currentPage, pageCount);

  const paginatedAttractions = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredAttractions.slice(start, start + pageSize);
  }, [filteredAttractions, activePage, pageSize]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Experiences</h1>
          <p className="text-muted-foreground text-sm">
            Manage physical travel experience/sights linked inside popular destinations.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 size-4" />
          Add Experience
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-[min(var(--radius-md),12px)] pl-8"
              placeholder="Search experiences..."
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
                <TableHead className="h-11 p-3 font-medium">Destination</TableHead>
                <TableHead className="h-11 p-3 font-medium">Location Label</TableHead>
                <TableHead className="h-11 p-3 font-medium">Hours</TableHead>
                <TableHead className="h-11 p-3 font-medium">Status</TableHead>
                <TableHead className="h-11 p-3 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAttractions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No experiences found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAttractions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="p-3 align-middle font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAttraction(a);
                          setIsDrawerOpen(true);
                        }}
                        className="text-left font-semibold text-foreground hover:text-primary hover:underline cursor-pointer focus:outline-hidden"
                        title="Click to view experience details"
                      >
                        {a.name}
                      </button>
                    </TableCell>
                    <TableCell className="p-3 align-middle font-medium text-sm">
                      {a.destination_name || "Unassigned"}
                    </TableCell>
                    <TableCell className="p-3 align-middle text-xs">{a.location_label}</TableCell>
                    <TableCell className="p-3 align-middle text-xs">{a.operational_hours || "N/A"}</TableCell>
                    <TableCell className="p-3 align-middle">
                      <Badge className={getStatusBadgeClass(a.status)} variant="outline">
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 align-middle text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              aria-label={`Open actions for ${a.name}`}
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
                                setSelectedAttraction(a);
                                setIsDrawerOpen(true);
                              }}
                            >
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(a)}>
                              <Edit className="mr-2 size-4" />
                              Edit Experience
                            </DropdownMenuItem>
                            {a.status !== "published" ? (
                              <DropdownMenuItem
                                className="text-emerald-600 focus:text-emerald-700"
                                onClick={() => handleUpdateStatus(a.id, "published")}
                              >
                                <CheckCircle className="mr-2 size-4" />
                                Publish
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-amber-600 focus:text-amber-700"
                                onClick={() => handleUpdateStatus(a.id, "archived")}
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
                              onClick={() => handleDelete(a.id)}
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
            Showing {filteredAttractions.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to{" "}
            {Math.min(activePage * pageSize, filteredAttractions.length)} of {filteredAttractions.length} entries
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="attractions-rows-per-page" className="font-medium text-sm">
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
                <SelectTrigger size="sm" className="w-20" id="attractions-rows-per-page">
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
            <DialogTitle>{editingAttraction ? "Edit Experience" : "Add Experience"}</DialogTitle>
            <DialogDescription>
              Assign the landmark attraction to its parent destination and operational info.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Destination Parent *</span>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Experience Name *</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Candi Uluwatu" required />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Location Label *</span>
              <Input
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="e.g. Pecatu, Kuta Selatan"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Description *</span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this travel sight."
                rows={3}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Detailed About Section</span>
              <Textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Long description about features, entrance details, etc."
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Historical Background</span>
              <Textarea
                value={historicalBackground}
                onChange={(e) => setHistoricalBackground(e.target.value)}
                placeholder="Historical details of the attraction."
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Operational Hours</span>
              <Input
                value={operationalHours}
                onChange={(e) => setOperationalHours(e.target.value)}
                placeholder="e.g. 08:00 AM - 07:00 PM"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Facilities (One per line)</span>
              <Textarea
                value={facilitiesText}
                onChange={(e) => setFacilitiesText(e.target.value)}
                placeholder="e.g. Parking Area&#10;Souvenir Shops&#10;Toilets"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Cover Image</span>
              <ImageUploader value={image} onChange={setImage} ownerType="attraction" ownerId={formId} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Gallery Images</span>
              <ImageUploader value={gallery} onChange={setGallery} multiple ownerType="attraction" ownerId={formId} />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Experience"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Experience Detail Drawer */}
      <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg h-full">
          {selectedAttraction && (() => {
            const isPublished = selectedAttraction.status === "published";

            return (
              <div className="flex h-full flex-col">
                <DrawerHeader className="border-b border-border/40 px-6 py-5">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
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
                      {selectedAttraction.status}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{selectedAttraction.slug}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 text-left">
                    <div className="min-w-0 flex-1">
                      <DrawerTitle className="text-base font-semibold text-foreground tracking-tight">
                        {selectedAttraction.name}
                      </DrawerTitle>
                      <DrawerDescription className="text-xs text-muted-foreground mt-1">
                        <span>{selectedAttraction.destination_name || "Unassigned"} • {selectedAttraction.location_label}</span>
                      </DrawerDescription>
                    </div>
                  </div>
                </DrawerHeader>

                <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Hero Image */}
                  {selectedAttraction.image && (
                    <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/20">
                      <img
                        src={selectedAttraction.image}
                        alt={selectedAttraction.name}
                        className="h-44 w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Operational Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Overview
                    </h4>
                    <div className="rounded-lg border border-border/40 divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Destination</span>
                        <span className="font-medium text-foreground text-xs">{selectedAttraction.destination_name || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Area</span>
                        <span className="text-foreground text-xs">{selectedAttraction.location_label}</span>
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-muted-foreground text-xs">Operating hours</span>
                        <span className="text-foreground text-xs">{selectedAttraction.operational_hours || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Description
                    </h4>
                    <div className="rounded-lg border border-border/40 p-3.5 text-xs text-foreground/90 space-y-3 leading-relaxed">
                      <p>{selectedAttraction.description}</p>
                      {selectedAttraction.about && (
                        <div className="border-t border-border/30 pt-2.5 text-muted-foreground space-y-1">
                          <span className="text-foreground text-xs font-medium block">About</span>
                          <p className="whitespace-pre-line">{selectedAttraction.about}</p>
                        </div>
                      )}
                      {selectedAttraction.historical_background && (
                        <div className="border-t border-border/30 pt-2.5 text-muted-foreground space-y-1">
                          <span className="text-foreground text-xs font-medium block">Historical background</span>
                          <p className="whitespace-pre-line">{selectedAttraction.historical_background}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Facilities */}
                  {selectedAttraction.facilities && selectedAttraction.facilities.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Facilities
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAttraction.facilities.map((fac) => (
                          <span
                            key={fac}
                            className="rounded border border-border/40 bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {fac}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gallery */}
                  {selectedAttraction.gallery && selectedAttraction.gallery.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Gallery ({selectedAttraction.gallery.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedAttraction.gallery.map((imgUrl, i) => (
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
                        handleOpenEdit(selectedAttraction);
                      }}
                    >
                      <Edit className="size-3.5" />
                      Edit experience
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
