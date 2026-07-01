"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Plus, Search } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { getClientCookie } from "@/lib/cookie.client";

interface Program {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface Category {
  id?: string;
  name: string;
  description: string;
  color?: string;
  gradient?: string;
}

interface CategoriesClientProps {
  initialCategories: Category[];
  programs: Program[];
}

export function CategoriesClient({ initialCategories, programs }: CategoriesClientProps) {
  const router = useRouter();

  // Dialog & Form State
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Search state
  const [search, setSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Parse all categories
  const categoryStats = useMemo(() => {
    const apiNames = initialCategories.map((c) => c.name);

    // Identify any custom categories currently assigned to programs but NOT in initialCategories
    const customNames = Array.from(
      new Set(programs.map((p) => p.category).filter((cat) => cat && !apiNames.includes(cat))),
    );

    // Generate dynamic categories for custom ones (those program-assigned categories not yet saved in database)
    const customCategories = customNames.map((name) => ({
      name,
      description: "Custom user-defined category specified during program setup.",
      color: "from-sky-500/10 to-blue-500/10 text-sky-600 border-sky-500/20 bg-sky-500/5",
      gradient: "from-sky-500 to-blue-600",
    }));

    // Merge API categories with any unsaved custom ones
    const allCategories = [
      ...initialCategories.map((cat, idx) => {
        // Assign color presets if they are not defined in the category object
        const presets = [
          {
            color: "from-orange-500/10 to-red-500/10 text-orange-600 border-orange-500/20 bg-orange-500/5",
            gradient: "from-orange-500 to-red-600",
          },
          {
            color: "from-purple-500/10 to-indigo-500/10 text-purple-600 border-purple-500/20 bg-purple-500/5",
            gradient: "from-purple-500 to-indigo-600",
          },
          {
            color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-500/20 bg-emerald-500/5",
            gradient: "from-emerald-500 to-teal-600",
          },
          {
            color: "from-green-500/10 to-emerald-500/10 text-green-600 border-green-500/20 bg-green-500/5",
            gradient: "from-green-500 to-emerald-600",
          },
          {
            color: "from-yellow-500/10 to-amber-500/10 text-amber-700 border-amber-500/20 bg-amber-500/5",
            gradient: "from-yellow-500 to-amber-600",
          },
        ];
        const preset = presets[idx % presets.length];
        return {
          ...cat,
          color: cat.color || preset.color,
          gradient: cat.gradient || preset.gradient,
        };
      }),
      ...customCategories,
    ];

    return allCategories.map((cat) => {
      const matching = programs.filter((p) => p.category === cat.name);
      const publishedCount = matching.filter((p) => p.status === "published").length;
      const draftCount = matching.filter((p) => p.status === "draft").length;

      return {
        ...cat,
        totalCount: matching.length,
        publishedCount,
        draftCount,
      };
    });
  }, [initialCategories, programs]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categoryStats.filter((cat) => {
      const searchLower = search.toLowerCase();
      return cat.name.toLowerCase().includes(searchLower) || cat.description.toLowerCase().includes(searchLower);
    });
  }, [categoryStats, search]);

  // Pagination calculations
  const pageCount = useMemo(() => {
    return Math.max(Math.ceil(filteredCategories.length / pageSize), 1);
  }, [filteredCategories, pageSize]);

  const activePage = Math.min(currentPage, pageCount);

  const paginatedCategories = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, activePage, pageSize]);

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

  const handleOpenCreate = () => {
    setName("");
    setDescription("");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return toast.error("Category name is required");
    }

    setLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to create category");
      }

      toast.success("Category created successfully!");
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while creating category";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-3xl tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Overview of program categories, definitions, and active program metrics.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 size-4" />
          Add Category
        </Button>
      </div>

      <div className="relative mb-2 flex max-w-sm items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
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
          <CardTitle>All Categories</CardTitle>
          <CardDescription>A list of categories dynamically calculated from tour programs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px] text-center">Total Programs</TableHead>
                  <TableHead className="w-[120px] text-center text-emerald-600">Active</TableHead>
                  <TableHead className="w-[120px] text-center text-slate-500">Draft</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((cat) => (
                    <TableRow key={cat.name}>
                      <TableCell className="align-middle font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${cat.gradient}`} />
                          <Badge variant="outline" className={`w-fit py-0.5 ${cat.color}`}>
                            {cat.name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md whitespace-normal align-middle text-muted-foreground text-sm">
                        {cat.description}
                      </TableCell>
                      <TableCell className="text-center align-middle font-semibold">{cat.totalCount}</TableCell>
                      <TableCell className="text-center align-middle font-semibold text-emerald-600">
                        {cat.publishedCount}
                      </TableCell>
                      <TableCell className="text-center align-middle font-semibold text-slate-500">
                        {cat.draftCount}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredCategories.length > 0 && (
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
                      <SelectTrigger size="sm" className="w-20" id="categories-rows-per-page">
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
                    Showing {Math.min((activePage - 1) * pageSize + 1, filteredCategories.length)} to{" "}
                    {Math.min(activePage * pageSize, filteredCategories.length)} of {filteredCategories.length} entries
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new program category. Custom categories can be assigned when setting up tour programs.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Category Name *</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wellness & Healing"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Description</span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this program category."
                rows={3}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
