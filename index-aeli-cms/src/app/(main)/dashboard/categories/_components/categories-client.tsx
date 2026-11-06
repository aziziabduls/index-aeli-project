"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Compass,
  Edit,
  Eye,
  FolderTree,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const pageSizeItems = [10, 20, 30, 40, 50].map((pageSize) => ({
  value: `${pageSize}`,
  label: `${pageSize}`,
}));

export function CategoriesClient({ initialCategories, programs }: CategoriesClientProps) {
  const router = useRouter();

  // Drawer detail state
  const [selectedCategory, setSelectedCategory] = useState<(Category & {
    totalCount: number;
    publishedCount: number;
    draftCount: number;
  }) | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dialog & Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
    const customCategories: Category[] = customNames.map((name) => ({
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

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setIsOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
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

      const url = editingCategory?.id
        ? `${apiUrl}/api/v1/admin/categories/${editingCategory.id}`
        : `${apiUrl}/api/v1/admin/categories`;
      const method = editingCategory?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
        throw new Error(resJson.error || `Failed to ${editingCategory ? "update" : "create"} category`);
      }

      toast.success(editingCategory ? "Category updated successfully!" : "Category created successfully!");
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while saving category";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!cat.id) {
      toast.error("Cannot delete a custom category that has no database record");
      return;
    }
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/admin/categories/${cat.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to delete category");
      }

      toast.success("Category deleted successfully!");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while deleting category";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Overview of program categories, definitions, and active program metrics.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 size-4" />
          Add Category
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-[min(var(--radius-md),12px)] pl-8"
              placeholder="Search categories..."
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
                <TableHead className="h-11 w-[240px] p-3 font-medium">Category</TableHead>
                <TableHead className="h-11 p-3 font-medium">Description</TableHead>
                <TableHead className="h-11 w-[120px] p-3 text-center font-medium">Total Programs</TableHead>
                <TableHead className="h-11 w-[120px] p-3 text-center font-medium text-emerald-600">Active</TableHead>
                <TableHead className="h-11 w-[120px] p-3 text-center font-medium text-slate-500">Draft</TableHead>
                <TableHead className="h-11 w-[80px] p-3 text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((cat) => (
                  <TableRow key={cat.name}>
                    <TableCell className="p-3 align-middle font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsDrawerOpen(true);
                        }}
                        className="flex items-center gap-2 font-semibold text-foreground text-left hover:text-primary hover:underline cursor-pointer focus:outline-hidden"
                        title="Click to view category details"
                      >
                        {cat.name}
                      </button>
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal p-3 align-middle text-muted-foreground text-sm">
                      {cat.description}
                    </TableCell>
                    <TableCell className="p-3 text-center align-middle font-semibold">{cat.totalCount}</TableCell>
                    <TableCell className="p-3 text-center align-middle font-semibold text-emerald-600">
                      {cat.publishedCount}
                    </TableCell>
                    <TableCell className="p-3 text-center align-middle font-semibold text-slate-500">
                      {cat.draftCount}
                    </TableCell>
                    <TableCell className="p-3 align-middle text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              aria-label={`Open actions for ${cat.name}`}
                              className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                              size="icon-sm"
                              variant="ghost"
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCategory(cat);
                                setIsDrawerOpen(true);
                              }}
                            >
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(cat)}>
                              <Edit className="mr-2 size-4" />
                              Edit Category
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          {cat.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => handleDelete(cat)}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </>
                          )}
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
            Showing {filteredCategories.length === 0 ? 0 : (activePage - 1) * pageSize + 1} to{" "}
            {Math.min(activePage * pageSize, filteredCategories.length)} of {filteredCategories.length} entries
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="categories-rows-per-page" className="font-medium text-sm">
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
                <SelectTrigger size="sm" className="w-20" id="categories-rows-per-page">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category details. Renaming will automatically update all associated tour programs."
                : "Create a new program category. Custom categories can be assigned when setting up tour programs."}
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
                {loading ? "Saving..." : editingCategory ? "Update Category" : "Save Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Detail Drawer */}
      <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg h-full">
          {selectedCategory && (() => {
            const matchingPrograms = programs.filter(
              (p) => p.category?.toLowerCase() === selectedCategory.name.toLowerCase()
            );

            return (
              <div className="flex h-full flex-col">
                <DrawerHeader className="border-b border-border/40 px-6 py-5">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <span className="rounded-md bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                      Category
                    </span>
                    <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                      <span>{selectedCategory.totalCount} programs</span>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">{selectedCategory.publishedCount} active</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4 text-left">
                    <div className="min-w-0 flex-1">
                      <DrawerTitle className="text-base font-semibold text-foreground tracking-tight">
                        {selectedCategory.name}
                      </DrawerTitle>
                      <DrawerDescription className="text-xs text-muted-foreground mt-1">
                        <span>Classification ID {selectedCategory.id || "system"}</span>
                      </DrawerDescription>
                    </div>
                  </div>
                </DrawerHeader>

                <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Category Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Description
                    </h4>
                    <div className="rounded-lg border border-border/40 p-3.5 text-xs text-foreground/90 leading-relaxed">
                      {selectedCategory.description || "No description provided for this category."}
                    </div>
                  </div>

                  {/* Associated Programs */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Associated programs ({matchingPrograms.length})
                    </h4>

                    {matchingPrograms.length === 0 ? (
                      <div className="rounded-lg border border-border/40 p-4 text-center text-xs text-muted-foreground">
                        No tour programs currently assigned
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/40 divide-y divide-border/40">
                        {matchingPrograms.map((prog) => {
                          const isPublished = prog.status === "published";
                          return (
                            <div
                              key={prog.id}
                              className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <span className="font-medium text-foreground block truncate">{prog.name}</span>
                                <span className="text-[11px] text-muted-foreground">ID {prog.id}</span>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium shrink-0 ${
                                  isPublished
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : "bg-slate-500/10 text-slate-700 dark:text-slate-400"
                                }`}
                              >
                                <span
                                  className={`size-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-slate-400"}`}
                                />
                                {prog.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <DrawerFooter className="border-t border-border/40 px-6 py-4">
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      className="flex-1 h-9 text-xs gap-1.5"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleOpenEdit(selectedCategory);
                      }}
                    >
                      <Edit className="size-3.5" />
                      Edit category
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
