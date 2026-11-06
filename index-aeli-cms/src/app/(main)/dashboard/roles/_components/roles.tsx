"use client";
"use no memo";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  CreditCard,
  FileUp,
  Grid3x3,
  Info,
  Loader2,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getClientCookie } from "@/lib/cookie.client";

import { rolesColumns } from "./roles-table/columns";
import {
  defaultPermissionSets,
  getRoleMenus,
  MENU_PERMISSIONS_CONFIG,
  type MenuPermission,
  type Role
} from "./roles-table/data";
import { RolesTable } from "./roles-table/table";

interface RolesProps {
  roles: Role[];
  currentUser?: { id?: string; email?: string; role?: string } | null;
}

function getRoleTypeFilter(groupFilter: string) {
  if (groupFilter === "System roles") return "System";
  if (groupFilter === "Custom roles") return "Custom";
  return "All";
}

function getRoleGroupFilterValue(typeFilter: string | null) {
  if (typeFilter === "System") return "System roles";
  if (typeFilter === "Custom") return "Custom roles";
  return undefined;
}

const accessLevels = [
  { value: "Full", label: "Full Access" },
  { value: "Scoped", label: "Scoped Access" },
  { value: "Read only", label: "Read Only" },
  { value: "API access", label: "API Access Only" },
];

export function Roles({ roles, currentUser }: RolesProps) {
  const router = useRouter();
  const isSuperAdmin = currentUser?.role === "super_admin";

  // Table filters & pagination state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });

  // Modal Dialogs state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);
  const [selectedRoleForView, setSelectedRoleForView] = useState<Role | null>(null);
  const [selectedRoleForMembers, setSelectedRoleForMembers] = useState<Role | null>(null);
  const [selectedRoleForReview, setSelectedRoleForReview] = useState<Role | null>(null);
  const [selectedRoleForDelete, setSelectedRoleForDelete] = useState<Role | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Members modal data
  const [membersList, setMembersList] = useState<any[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  // Form: Create Role State
  const [createName, setCreateName] = useState("");
  const [createAccessLevel, setCreateAccessLevel] = useState("Scoped");
  const [createDescription, setCreateDescription] = useState("");
  const [createPermissions, setCreatePermissions] = useState<string[]>(["Destinations", "Programs"]);

  // Form: Edit Role State
  const [editName, setEditName] = useState("");
  const [editAccessLevel, setEditAccessLevel] = useState("Scoped");
  const [editDescription, setEditDescription] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<"Active" | "Needs review">("Active");

  // Form: Import JSON State
  const [importJsonText, setImportJsonText] = useState(
    JSON.stringify(
      [
        {
          role: "Operations Auditor",
          accessLevel: "Scoped",
          group: "Custom roles",
          permissionSets: ["Audit Logs", "Reports", "Programs"],
          description: "Inspects booking rundowns and operational compliance logs.",
          owner: currentUser?.email || "System",
          status: "Active",
        },
      ],
      null,
      2
    )
  );

  // Roles needing review
  const needsReviewRoles = useMemo(() => {
    return roles.filter((r) => r.status === "Needs review" || r.group === "Needs review");
  }, [roles]);

  // Dynamic Owners list for filter
  const ownerOptions = useMemo(() => {
    const set = new Set<string>(["All"]);
    roles.forEach((r) => {
      if (r.owner) set.add(r.owner);
    });
    return Array.from(set);
  }, [roles]);

  // Fetch role members
  const fetchMembers = async (role: Role) => {
    if (!role.id) return;
    setIsMembersLoading(true);
    setMembersList([]);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";
      const res = await fetch(`${apiUrl}/api/v1/roles/${role.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMembersList(json.data.members || []);
      }
    } catch (err) {
      console.error("Failed to fetch members for role", err);
    } finally {
      setIsMembersLoading(false);
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (role: Role) => {
    setSelectedRoleForEdit(role);
    setEditName(role.role);
    setEditAccessLevel(role.accessLevel);
    setEditDescription(role.description || "");
    setEditPermissions(role.permissionSets || []);
    setEditStatus(role.status);
  };

  // Open Members Dialog
  const handleOpenMembers = (role: Role) => {
    setSelectedRoleForMembers(role);
    fetchMembers(role);
  };

  // Handlers for API Mutations
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      return toast.error("Role name is required");
    }

    setIsActionLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createName.trim(),
          accessLevel: createAccessLevel,
          permissionSets: createPermissions,
          description: createDescription.trim(),
          owner: currentUser?.email || "System",
          group: "Custom roles",
          status: "Active",
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to create role");
      }

      toast.success("Role created successfully!");
      setIsCreateOpen(false);
      setCreateName("");
      setCreateDescription("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while creating role");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleForEdit?.id) return;

    setIsActionLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/roles/${selectedRoleForEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          accessLevel: editAccessLevel,
          permissionSets: editPermissions,
          description: editDescription.trim(),
          status: editStatus,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to update role");
      }

      toast.success("Role updated successfully!");
      setSelectedRoleForEdit(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while updating role");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReviewRole = async (role: Role) => {
    if (!role.id) return;
    setIsActionLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/roles/${role.id}/review`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to review role");
      }

      toast.success(`Role '${role.role}' reviewed and activated!`);
      setSelectedRoleForReview(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to review role");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveAllReviews = async () => {
    if (needsReviewRoles.length === 0) return;
    setIsActionLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      for (const role of needsReviewRoles) {
        if (!role.id) continue;
        await fetch(`${apiUrl}/api/v1/roles/${role.id}/review`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success("All pending roles approved and activated!");
      router.refresh();
    } catch (err: any) {
      toast.error("Failed to approve all roles");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDuplicateRole = async (role: Role) => {
    if (!role.id) return;
    const toastId = toast.loading(`Duplicating role '${role.role}'...`);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/roles/${role.id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to duplicate role");
      }

      toast.success(`Role '${role.role}' duplicated successfully!`, { id: toastId });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate role", { id: toastId });
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRoleForDelete?.id) return;

    setIsActionLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/roles/${selectedRoleForDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to delete role");
      }

      toast.success(resJson.message || "Role deleted successfully!");
      setSelectedRoleForDelete(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while deleting role");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleImportRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      let parsed = [];
      try {
        parsed = JSON.parse(importJsonText);
      } catch (e) {
        throw new Error("Invalid JSON format. Please ensure valid JSON syntax.");
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("JSON payload must be an array of role objects.");
      }

      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/roles/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roles: parsed }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to import roles");
      }

      toast.success(resJson.message || "Roles imported successfully!");
      setIsImportOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred during import");
    } finally {
      setIsActionLoading(false);
    }
  };

  const togglePermission = (
    permissionId: string,
    currentList: string[],
    setFn: (list: string[]) => void
  ) => {
    if (currentList.includes(permissionId)) {
      setFn(currentList.filter((p) => p !== permissionId));
    } else {
      setFn([...currentList, permissionId]);
    }
  };

  const isMenuChecked = (menu: MenuPermission, currentPermissions: string[]) => {
    const psetsLower = currentPermissions.map((p) => p.toLowerCase());
    return (
      psetsLower.includes(menu.id.toLowerCase()) ||
      psetsLower.includes(menu.label.toLowerCase()) ||
      menu.associatedPermissions.some((ap) => psetsLower.includes(ap.toLowerCase()))
    );
  };

  const toggleMenuPermission = (
    menu: MenuPermission,
    currentPermissions: string[],
    setFn: (list: string[]) => void
  ) => {
    const checked = isMenuChecked(menu, currentPermissions);
    const related = [menu.id, ...menu.associatedPermissions];
    const relatedLower = related.map((r) => r.toLowerCase());

    if (checked) {
      setFn(currentPermissions.filter((p) => !relatedLower.includes(p.toLowerCase())));
    } else {
      const toAdd = related.filter(
        (item) => !currentPermissions.some((cp) => cp.toLowerCase() === item.toLowerCase())
      );
      setFn([...currentPermissions, ...toAdd]);
    }
  };

  const getMenuIcon = (menuId: string) => {
    switch (menuId) {
      case "Dashboard":
        return <Grid3x3 className="size-4 text-slate-500 shrink-0" />;
      case "Providers":
        return <Briefcase className="size-4 text-indigo-500 shrink-0" />;
      case "Programs":
        return <Compass className="size-4 text-blue-500 shrink-0" />;
      case "Finance":
        return <CreditCard className="size-4 text-emerald-500 shrink-0" />;
      case "Users":
        return <Users className="size-4 text-amber-500 shrink-0" />;
      case "Settings":
        return <Settings className="size-4 text-purple-500 shrink-0" />;
      default:
        return <Shield className="size-4 text-muted-foreground shrink-0" />;
    }
  };

  const table = useReactTable({
    data: roles,
    columns: rolesColumns,
    meta: {
      onReviewRole: (role: Role) => setSelectedRoleForReview(role),
      onViewDetails: (role: Role) => setSelectedRoleForView(role),
      onEditRole: (role: Role) => handleOpenEdit(role),
      onDuplicateRole: (role: Role) => handleDuplicateRole(role),
      onReviewPermissions: (role: Role) => setSelectedRoleForView(role),
      onManageMembers: (role: Role) => handleOpenMembers(role),
      onDeleteRole: (role: Role) => setSelectedRoleForDelete(role),
      isSuperAdmin,
    },
    defaultColumn: {
      size: 140,
      minSize: 80,
      maxSize: 420,
    },
    state: { columnFilters, pagination },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    initialState: {
      columnVisibility: { group: false, search: false },
    },
  });

  const search = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const groupFilter = (table.getColumn("group")?.getFilterValue() as string) ?? "";
  const typeFilter = getRoleTypeFilter(groupFilter);
  const ownerFilter = (table.getColumn("owner")?.getFilterValue() as string) ?? "All";
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string) ?? "All";

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">
            Manage access roles, customized permission scopes, and organizational privilege levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <>
              <Button size="sm" variant="outline" onClick={() => setIsImportOpen(true)}>
                <FileUp className="mr-1.5 size-4" />
                Import JSON
              </Button>
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-1.5 size-4" />
                Create Role
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs className="h-full gap-4" defaultValue="roles">
        <TabsList
        // variant="line"
        // className="w-full justify-start gap-2 border-b ps-0 *:data-[slot=tabs-trigger]:flex-none"
        >
          <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
          <TabsTrigger value="permission-sets">Permission Sets ({defaultPermissionSets.length})</TabsTrigger>
          <TabsTrigger value="access-reviews">
            Access Reviews
            {needsReviewRoles.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {needsReviewRoles.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Roles Main Table */}
        <TabsContent value="roles">
          <div className="flex flex-col gap-4">
            {needsReviewRoles.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                <AlertTriangle className="size-4" />
                <AlertTitle>Review required</AlertTitle>
                <AlertDescription>
                  {needsReviewRoles.length} role(s) have unreviewed permission changes that require administrative audit.
                </AlertDescription>
                <AlertAction>
                  <Button
                    size="sm"
                    variant="link"
                    className="text-amber-900 dark:text-amber-100"
                    onClick={() => {
                      table.getColumn("status")?.setFilterValue("Needs review");
                      table.setPageIndex(0);
                    }}
                  >
                    Filter unreviewed
                    <ChevronRight className="ml-1 size-3.5" />
                  </Button>
                </AlertAction>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-8 rounded-[min(var(--radius-md),12px)] pl-8"
                    placeholder="Search roles..."
                    value={search}
                    onChange={(e) => {
                      table.getColumn("search")?.setFilterValue(e.target.value || undefined);
                      table.setPageIndex(0);
                    }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                      if (v) {
                        table.getColumn("group")?.setFilterValue(getRoleGroupFilterValue(v));
                        table.setPageIndex(0);
                      }
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">Type:</span>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent align="start" alignItemWithTrigger={false}>
                      <SelectGroup>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="System">System</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    value={ownerFilter}
                    onValueChange={(v) => {
                      if (v) {
                        table.getColumn("owner")?.setFilterValue(v === "All" ? undefined : v);
                        table.setPageIndex(0);
                      }
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">Owner:</span>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent align="start" alignItemWithTrigger={false}>
                      <SelectGroup>
                        {ownerOptions.map((owner) => (
                          <SelectItem key={owner} value={owner}>
                            {owner}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      if (v) {
                        table.getColumn("status")?.setFilterValue(v === "All" ? undefined : v);
                        table.setPageIndex(0);
                      }
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">Status:</span>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent align="start" alignItemWithTrigger={false}>
                      <SelectGroup>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Needs review">Needs review</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border bg-card">
                <RolesTable table={table} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Permission Sets */}
        <TabsContent value="permission-sets">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold tracking-tight">Platform Permission Matrix</h2>
              <p className="text-muted-foreground text-sm">
                Overview of all 13 access modules and active role allocations across the INDEX-AELI platform.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {defaultPermissionSets.map((pset) => {
                const assignedRoles = roles.filter((r) => r.permissionSets?.includes(pset.id));

                return (
                  <div key={pset.id} className="flex flex-col justify-between rounded-lg border bg-card p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base">{pset.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {pset.module}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{pset.description}</p>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Assigned in {assignedRoles.length} role(s):
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {assignedRoles.length > 0 ? (
                          assignedRoles.map((r) => (
                            <Badge key={r.role} variant="secondary" className="text-[11px]">
                              {r.role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground/70 italic">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Access Reviews */}
        <TabsContent value="access-reviews">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold tracking-tight">Periodic Access & Privilege Reviews</h2>
                <p className="text-muted-foreground text-sm">
                  Review and re-certify role privileges to preserve security compliance.
                </p>
              </div>

              {needsReviewRoles.length > 0 && isSuperAdmin && (
                <Button size="sm" onClick={handleApproveAllReviews} disabled={isActionLoading}>
                  {isActionLoading ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1.5 size-4" />
                  )}
                  Approve All Pending Reviews
                </Button>
              )}
            </div>

            {needsReviewRoles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <ShieldCheck className="size-10 text-emerald-500 mb-2" />
                <h3 className="font-semibold text-base">All Roles Verified</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                  No roles require administrative review at this time. All role definitions and permission scopes are
                  currently active.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {needsReviewRoles.map((role) => (
                  <div
                    key={role.id || role.role}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-amber-200 bg-amber-500/5 p-4 gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{role.role}</span>
                        <Badge variant="outline" className="border-amber-500/30 text-amber-600 text-xs">
                          Needs Review
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {role.accessLevel}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Owner: <span className="font-medium text-foreground">{role.owner}</span> • Last Reviewed:{" "}
                        <span className="font-medium text-foreground">{role.lastReview}</span> • Assigned Members:{" "}
                        <span className="font-medium text-foreground">{role.users}</span>
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {role.permissionSets?.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px]">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRoleForView(role)}
                      >
                        Inspect Details
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          onClick={() => handleReviewRole(role)}
                          disabled={isActionLoading}
                        >
                          <Check className="mr-1.5 size-3.5" />
                          Approve & Activate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 1. Modal: Create Role */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Define a new access role with specific module permission sets.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRole} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                placeholder="e.g. Operations Coordinator"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role-access-level">Access Tier</Label>
              <Select value={createAccessLevel} onValueChange={(v) => v && setCreateAccessLevel(v)}>
                <SelectTrigger id="role-access-level">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectGroup>
                    {accessLevels.map((lvl) => (
                      <SelectItem key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role-desc">Description</Label>
              <Textarea
                id="role-desc"
                placeholder="Describe the purpose and authority of this role..."
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <SlidersHorizontal className="size-3.5 text-primary" />
                    Permission Menu (Akses Menu Sidebar)
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Pilih menu navigasi yang dapat diakses dan dikelola oleh role ini di CMS portal.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const all = defaultPermissionSets.map((p) => p.id);
                      setCreatePermissions(all);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-muted-foreground text-xs">•</span>
                  <button
                    type="button"
                    onClick={() => setCreatePermissions([])}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MENU_PERMISSIONS_CONFIG.map((menu) => {
                  const isChecked = isMenuChecked(menu, createPermissions);
                  return (
                    <div
                      key={menu.id}
                      onClick={() => toggleMenuPermission(menu, createPermissions, setCreatePermissions)}
                      className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors select-none ${
                        isChecked
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/60 bg-card hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() =>
                          toggleMenuPermission(menu, createPermissions, setCreatePermissions)
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {getMenuIcon(menu.id)}
                          <span className="font-semibold text-xs text-foreground truncate">
                            {menu.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {menu.subItems.join(" • ")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Granular Permission Sets detail */}
              <details className="group rounded-md border p-2.5 bg-muted/10 text-xs">
                <summary className="cursor-pointer font-medium text-xs text-muted-foreground flex items-center justify-between select-none">
                  <span>Granular Resource Permissions ({createPermissions.length} active)</span>
                  <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto mt-2 pt-2 border-t">
                  {defaultPermissionSets.map((pset) => {
                    const isChecked = createPermissions.includes(pset.id);
                    return (
                      <label
                        key={pset.id}
                        className="flex items-center gap-2 text-xs cursor-pointer select-none rounded p-1 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() =>
                            togglePermission(pset.id, createPermissions, setCreatePermissions)
                          }
                        />
                        <span className="truncate">{pset.name}</span>
                      </label>
                    );
                  })}
                </div>
              </details>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isActionLoading}>
                {isActionLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                Create Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: Edit Role */}
      <Dialog open={!!selectedRoleForEdit} onOpenChange={(open) => !open && setSelectedRoleForEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRoleForEdit?.role}</DialogTitle>
            <DialogDescription>
              Update access levels, descriptions, and permission scopes.
            </DialogDescription>
          </DialogHeader>

          {selectedRoleForEdit && (
            <form onSubmit={handleUpdateRole} className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-role-name">Role Name</Label>
                <Input
                  id="edit-role-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={selectedRoleForEdit.isSystem || selectedRoleForEdit.group === "System roles"}
                  required
                />
                {(selectedRoleForEdit.isSystem || selectedRoleForEdit.group === "System roles") && (
                  <span className="text-[11px] text-muted-foreground">
                    Core system role identifier is locked, but menu permissions and access tiers can be freely modified by Super Admin.
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-role-level">Access Tier</Label>
                <Select value={editAccessLevel} onValueChange={(v) => v && setEditAccessLevel(v)}>
                  <SelectTrigger id="edit-role-level">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    <SelectGroup>
                      {accessLevels.map((lvl) => (
                        <SelectItem key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-role-status">Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => v && setEditStatus(v as "Active" | "Needs review")}
                >
                  <SelectTrigger id="edit-role-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    <SelectGroup>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Needs review">Needs review</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-role-desc">Description</Label>
                <Textarea
                  id="edit-role-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <SlidersHorizontal className="size-3.5 text-primary" />
                      Permission Menu (Akses Menu Sidebar)
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Pilih menu navigasi yang dapat diakses dan dikelola oleh role ini di CMS portal.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const all = defaultPermissionSets.map((p) => p.id);
                        setEditPermissions(all);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground text-xs">•</span>
                    <button
                      type="button"
                      onClick={() => setEditPermissions([])}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {MENU_PERMISSIONS_CONFIG.map((menu) => {
                    const isChecked = isMenuChecked(menu, editPermissions);
                    return (
                      <div
                        key={menu.id}
                        onClick={() => toggleMenuPermission(menu, editPermissions, setEditPermissions)}
                        className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors select-none ${
                          isChecked
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/60 bg-card hover:bg-muted/40"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() =>
                            toggleMenuPermission(menu, editPermissions, setEditPermissions)
                          }
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {getMenuIcon(menu.id)}
                            <span className="font-semibold text-xs text-foreground truncate">
                              {menu.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {menu.subItems.join(" • ")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Granular Permission Sets detail */}
                <details className="group rounded-md border p-2.5 bg-muted/10 text-xs">
                  <summary className="cursor-pointer font-medium text-xs text-muted-foreground flex items-center justify-between select-none">
                    <span>Granular Resource Permissions ({editPermissions.length} active)</span>
                    <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto mt-2 pt-2 border-t">
                    {defaultPermissionSets.map((pset) => {
                      const isChecked = editPermissions.includes(pset.id);
                      return (
                        <label
                          key={pset.id}
                          className="flex items-center gap-2 text-xs cursor-pointer select-none rounded p-1 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() =>
                              togglePermission(pset.id, editPermissions, setEditPermissions)
                            }
                          />
                          <span className="truncate">{pset.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </details>
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setSelectedRoleForEdit(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isActionLoading}>
                  {isActionLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. Modal: View Details */}
      <Dialog open={!!selectedRoleForView} onOpenChange={(open) => !open && setSelectedRoleForView(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Role Overview
            </DialogTitle>
            <DialogDescription>
              Complete permission definitions and current configuration.
            </DialogDescription>
          </DialogHeader>

          {selectedRoleForView && (
            <div className="space-y-4 py-2 text-xs">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
                <div>
                  <h4 className="font-semibold text-sm">{selectedRoleForView.role}</h4>
                  <p className="font-mono text-muted-foreground text-xs">
                    Key: {selectedRoleForView.key || selectedRoleForView.role.toLowerCase().replace(/\s+/g, "_")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline">{selectedRoleForView.accessLevel}</Badge>
                  <span className="text-muted-foreground text-[11px]">
                    {selectedRoleForView.isSystem || selectedRoleForView.group === "System roles"
                      ? "System Role"
                      : "Custom Role"}
                  </span>
                </div>
              </div>

              {selectedRoleForView.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedRoleForView.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border p-2">
                  <span className="text-muted-foreground block text-[10px] uppercase">Owner</span>
                  <span className="font-medium text-foreground">{selectedRoleForView.owner}</span>
                </div>
                <div className="rounded border p-2">
                  <span className="text-muted-foreground block text-[10px] uppercase">Last Review</span>
                  <span className="font-medium text-foreground">{selectedRoleForView.lastReview}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold">
                  Permission Menu ({getRoleMenus(selectedRoleForView).length} menus):
                </span>
                <div className="flex flex-wrap gap-1.5 rounded-md border p-2.5">
                  {getRoleMenus(selectedRoleForView).map((m) => (
                    <Badge key={m.id} className={`text-xs ${m.color}`} variant="outline">
                      {m.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold">
                  Granted Resource Permissions ({selectedRoleForView.permissionSets?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto rounded-md border p-2.5">
                  {selectedRoleForView.permissionSets && selectedRoleForView.permissionSets.length > 0 ? (
                    selectedRoleForView.permissionSets.map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {p}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No specific permissions granted</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {isSuperAdmin ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const roleToEdit = selectedRoleForView;
                  setSelectedRoleForView(null);
                  if (roleToEdit) handleOpenEdit(roleToEdit);
                }}
              >
                Edit Role
              </Button>
            ) : <div />}
            <Button variant="outline" onClick={() => setSelectedRoleForView(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Modal: Manage Members */}
      <Dialog open={!!selectedRoleForMembers} onOpenChange={(open) => !open && setSelectedRoleForMembers(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Members in Role: {selectedRoleForMembers?.role}
            </DialogTitle>
            <DialogDescription>
              Listing accounts currently assigned to this privilege tier.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {isMembersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : membersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Users className="size-8 stroke-1 text-muted-foreground/60 mb-2" />
                <p className="text-sm">No members are currently assigned to this role.</p>
                <Link href="/dashboard/users" className="mt-3">
                  <Button size="sm" variant="outline">
                    Assign in User Access
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y rounded-md border">
                {membersList.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <span className="font-semibold text-sm">{m.name || m.email.split("@")[0]}</span>
                      <span className="text-muted-foreground block">{m.email}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        m.status === "active"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[10px]"
                          : "border-slate-500/20 bg-slate-500/10 text-slate-400 text-[10px]"
                      }
                    >
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between items-center">
            <Link href="/dashboard/users">
              <Button size="sm" variant="outline">
                Go to Users Page
              </Button>
            </Link>
            <Button size="sm" onClick={() => setSelectedRoleForMembers(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Modal: Review Changes */}
      <Dialog open={!!selectedRoleForReview} onOpenChange={(open) => !open && setSelectedRoleForReview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Audit & Review Role: {selectedRoleForReview?.role}
            </DialogTitle>
            <DialogDescription>
              Verify privilege scope before certifying this role as Active.
            </DialogDescription>
          </DialogHeader>

          {selectedRoleForReview && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-lg border border-amber-200 bg-amber-500/10 p-3">
                <span className="font-semibold text-amber-800 dark:text-amber-200 block mb-1">
                  Pending Administrative Audit
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  This role is currently marked as <span className="font-semibold text-foreground">Needs review</span>.
                  Approving this will clear the audit flag and promote it to active status.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold">Configured Permissions:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedRoleForReview.permissionSets?.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[11px]">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRoleForReview(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedRoleForReview && handleReviewRole(selectedRoleForReview)}
              disabled={isActionLoading}
            >
              {isActionLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Approve & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Modal: Import JSON */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Roles from JSON</DialogTitle>
            <DialogDescription>
              Paste an array of role objects to bulk-create or update role specifications.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImportRoles} className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="import-json">JSON Payload</Label>
              <Textarea
                id="import-json"
                className="font-mono text-xs"
                rows={10}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isActionLoading}>
                {isActionLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                Import Configurations
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Modal: Delete Role Confirmation */}
      <AlertDialog
        open={!!selectedRoleForDelete}
        onOpenChange={(open) => !open && setSelectedRoleForDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the custom role{" "}
              <span className="font-semibold text-foreground">{selectedRoleForDelete?.role}</span>. Any user
              relying on this role must first be reassigned to avoid permission lockout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
