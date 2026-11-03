"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Archive, CheckCircle, Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function AttractionsClient({ initialAttractions, destinations }: AttractionsClientProps) {
  const router = useRouter();

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

      <div className="relative mb-2 flex max-w-sm items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          placeholder="Search Experience..."
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
          <CardTitle>All Experiences</CardTitle>
          <CardDescription>A list of sightseeing landmarks associated with programs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Location Label</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAttractions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      No experiences found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAttractions.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-semibold">{a.name}</TableCell>
                      <TableCell className="font-medium text-purple-600 text-sm">
                        {a.destination_name || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-xs">{a.location_label}</TableCell>
                      <TableCell className="text-xs">{a.operational_hours || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(a.status)} variant="outline">
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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

          {filteredAttractions.length > 0 && (
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
                      <SelectTrigger size="sm" className="w-20" id="attractions-rows-per-page">
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
                    Showing {Math.min((activePage - 1) * pageSize + 1, filteredAttractions.length)} to{" "}
                    {Math.min(activePage * pageSize, filteredAttractions.length)} of {filteredAttractions.length}{" "}
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
    </div>
  );
}
