"use client";
"use no memo";

import { useRouter } from "next/navigation";
import * as React from "react";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  Download,
  Grid,
  Loader2,
  Plus,
  Rows3,
  Search,
  SlidersHorizontal,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientCookie } from "@/lib/cookie.client";
import { getInitials } from "@/lib/utils";

import { filters, type UserRow, type UserTeam } from "./data";
import { usersColumns } from "./users-columns";
import { UsersTable } from "./users-table";

interface UsersProps {
  users: UserRow[];
  currentUser?: { id?: string; email?: string; role?: string } | null;
}

export function Users({ users, currentUser }: UsersProps) {
  const router = useRouter();

  // Modals state
  const [selectedUserForView, setSelectedUserForView] = React.useState<UserRow | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = React.useState<UserRow | null>(null);
  const [selectedUserForTeam, setSelectedUserForTeam] = React.useState<UserRow | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = React.useState<UserRow | null>(null);
  const [addUserOpen, setAddUserOpen] = React.useState(false);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  // Edit form state
  const [editEmail, setEditEmail] = React.useState("");
  const [editRole, setEditRole] = React.useState("content_editor");
  const [editStatus, setEditStatus] = React.useState("active");
  const [editPassword, setEditPassword] = React.useState("");

  // Manage team state
  const [teamValue, setTeamValue] = React.useState<UserTeam>("Platform");
  const [teamRole, setTeamRole] = React.useState("content_editor");

  // Add user state
  const [addEmail, setAddEmail] = React.useState("");
  const [addPassword, setAddPassword] = React.useState("");
  const [addRole, setAddRole] = React.useState("content_editor");

  // Table state
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "joinedDate", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    search: false,
    team: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const handleToggleStatus = async (user: UserRow) => {
    if (!user.id) {
      toast.error("User ID not found");
      return;
    }
    const newStatus = user.status === "Active" ? "inactive" : "active";
    const actionLabel = newStatus === "active" ? "activate" : "deactivate";

    try {
      setIsActionLoading(true);
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${actionLabel} user`);
      }

      toast.success(`User ${newStatus === "active" ? "activated" : "deactivated"} successfully!`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${actionLabel} user`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUserForEdit?.id) return;
    try {
      setIsActionLoading(true);
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const payload: Record<string, string> = {
        email: editEmail,
        role: editRole,
        status: editStatus,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`${apiUrl}/api/v1/users/${selectedUserForEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update user");
      }

      toast.success("User updated successfully!");
      setSelectedUserForEdit(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveTeam = async () => {
    if (!selectedUserForTeam?.id) return;
    try {
      setIsActionLoading(true);
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/users/${selectedUserForTeam.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: teamRole }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update team & role");
      }

      toast.success("Team and role updated successfully!");
      setSelectedUserForTeam(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update team & role");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeletePermanently = async () => {
    if (!selectedUserForDelete?.id) return;
    try {
      setIsActionLoading(true);
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/users/${selectedUserForDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete user permanently");
      }

      const cascaded = json.data?.deletedContent;
      const countMsg = cascaded
        ? ` (${cascaded.destinationsCount} destinations, ${cascaded.attractionsCount} attractions, ${cascaded.programsCount} programs deleted)`
        : "";

      toast.success(`User and all created content were permanently deleted!${countMsg}`);
      setSelectedUserForDelete(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user permanently");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!addEmail || !addPassword) {
      toast.error("Email and password are required");
      return;
    }
    if (addPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setIsActionLoading(true);
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const res = await fetch(`${apiUrl}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: addEmail,
          password: addPassword,
          role: addRole,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create user");
      }

      toast.success("User created successfully!");
      setAddUserOpen(false);
      setAddEmail("");
      setAddPassword("");
      setAddRole("content_editor");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExport = () => {
    const csvRows = [
      ["ID", "Name", "Email", "Role", "Status", "Team", "Joined Date"],
      ...users.map((u) => [
        u.id || "",
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.email}"`,
        `"${u.role}"`,
        `"${u.status}"`,
        `"${u.team}"`,
        `"${u.joinedDate}"`,
      ]),
    ];
    const csvContent = `data:text/csv;charset=utf-8,${csvRows.map((e) => e.join(",")).join("\n")}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Users exported successfully!");
  };

  const table = useReactTable({
    data: users,
    columns: usersColumns,
    meta: {
      currentUser,
      onViewProfile: (user: UserRow) => setSelectedUserForView(user),
      onEditUser: (user: UserRow) => {
        setSelectedUserForEdit(user);
        setEditEmail(user.email);
        setEditRole(
          user.rawRole ||
          (user.role === "Super Admin"
            ? "super_admin"
            : user.role === "Admin"
              ? "admin"
              : user.role === "Content Editor"
                ? "content_editor"
                : "viewer")
        );
        setEditStatus(user.rawStatus || (user.status === "Active" ? "active" : "inactive"));
        setEditPassword("");
      },
      onManageTeam: (user: UserRow) => {
        setSelectedUserForTeam(user);
        setTeamValue(user.team || "Platform");
        setTeamRole(
          user.rawRole ||
          (user.role === "Super Admin"
            ? "super_admin"
            : user.role === "Admin"
              ? "admin"
              : user.role === "Content Editor"
                ? "content_editor"
                : "viewer")
        );
      },
      onToggleStatus: (user: UserRow) => handleToggleStatus(user),
      onDeletePermanently: (user: UserRow) => setSelectedUserForDelete(user),
    },
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.email,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const roleFilter = (table.getColumn("role")?.getFilterValue() as string) ?? filters.role[0];
  const teamFilter = (table.getColumn("team")?.getFilterValue() as string) ?? filters.team[0];
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string) ?? filters.status[0];
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  function setColumnSelectFilter(columnId: string, value: string | null) {
    table.getColumn(columnId)?.setFilterValue(!value || value === "All" ? undefined : value);
    table.setPageIndex(0);
  }

  return (
    <>
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-3xl tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          Manage your organization members, assign roles, and control access permissions.
        </p>
      </div>
      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          {/* <h1 className="text-3xl tracking-tight leading-none">Users</h1>
          <CardDescription className="max-w-sm leading-snug">
            Manage your organization members, assign roles, and control access permissions.
          </CardDescription> */}
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
            <InputGroupAddon align="inline-end">
              <Kbd className="h-4 text-[10px]">⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            {/* <InputGroup className="h-7 w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-7"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(event) => {
                  table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                  table.setPageIndex(0);
                }}
              />
              <InputGroupAddon align="inline-end">
                <Kbd className="h-4 text-[10px]">⌘K</Kbd>
              </InputGroupAddon>
            </InputGroup> */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const currentVisibility = table.getState().columnVisibility;
                table.setColumnVisibility({
                  ...currentVisibility,
                  team: !currentVisibility.team,
                });
              }}
            >
              <SlidersHorizontal className="size-3.5" /> {table.getState().columnVisibility.team ? "Hide Team" : "Show Team"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-3.5" /> Export
            </Button>
            <Button size="sm" onClick={() => setAddUserOpen(true)}>
              <Plus className="size-3.5" /> Add User
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={roleFilter} onValueChange={(value) => setColumnSelectFilter("role", value)}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Role:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {filters.role.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={teamFilter} onValueChange={(value) => setColumnSelectFilter("team", value)}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Team:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {filters.team.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value) => setColumnSelectFilter("status", value)}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Status:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {filters.status.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-4">
            <div className="text-muted-foreground text-sm tabular-nums">{selectedCount} selected</div>

            <Tabs defaultValue="list">
              <TabsList>
                <TabsTrigger value="list" aria-label="List view">
                  <Rows3 className="size-4" />
                </TabsTrigger>
                <TabsTrigger value="grid" aria-label="Grid view">
                  <Grid className="size-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <UsersTable table={table} />
        </CardContent>
      </Card>

      {/* 1. View Profile Dialog */}
      <Dialog open={!!selectedUserForView} onOpenChange={(open) => !open && setSelectedUserForView(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="size-5 text-primary" /> User Profile
            </DialogTitle>
            <DialogDescription>Full details and account credentials info.</DialogDescription>
          </DialogHeader>
          {selectedUserForView && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback className="font-semibold text-base">
                    {getInitials(selectedUserForView.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground text-lg leading-tight">
                    {selectedUserForView.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">{selectedUserForView.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">User ID:</span>
                  <p className="truncate font-mono text-xs">{selectedUserForView.id || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Role:</span>
                  <div>
                    <Badge variant="outline" className="mt-0.5">
                      {selectedUserForView.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Status:</span>
                  <div>
                    <Badge variant="outline" className="mt-0.5">
                      {selectedUserForView.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Joined Date:</span>
                  <p className="text-foreground text-xs">{selectedUserForView.joinedDate}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUserForView(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Edit User Dialog */}
      <Dialog open={!!selectedUserForEdit} onOpenChange={(open) => !open && setSelectedUserForEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Modify email, role, account status, or reset password.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editRole} onValueChange={(v) => v && setEditRole(v)}>
                  <SelectTrigger id="edit-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="content_editor">Content Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editStatus} onValueChange={(v) => v && setEditStatus(v)}>
                  <SelectTrigger id="edit-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-password">Reset Password (Optional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUserForEdit(null)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 size-4 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Manage Team Dialog */}
      <Dialog open={!!selectedUserForTeam} onOpenChange={(open) => !open && setSelectedUserForTeam(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Team & Role</DialogTitle>
            <DialogDescription>Assign functional team department and system role.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Assigned Team</Label>
              <Select value={teamValue} onValueChange={(v) => setTeamValue(v as UserTeam)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filters.team
                    .filter((t) => t !== "All")
                    .map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>System Role</Label>
              <Select value={teamRole} onValueChange={(v) => v && setTeamRole(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="content_editor">Content Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUserForTeam(null)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveTeam} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 size-4 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with credentials and assigned role.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-email">Email Address</Label>
              <Input
                id="add-email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="newuser@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-role">Role</Label>
              <Select value={addRole} onValueChange={(v) => v && setAddRole(v)}>
                <SelectTrigger id="add-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content_editor">Content Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 size-4 animate-spin" />} Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Delete Permanently Alert Dialog */}
      <AlertDialog
        open={!!selectedUserForDelete}
        onOpenChange={(open) => !open && setSelectedUserForDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle className="text-destructive">Delete User Permanently</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{selectedUserForDelete?.email}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-destructive text-xs leading-relaxed">
            <strong>Danger:</strong> This action cannot be undone. All content, travel destinations,
            attractions, programs, and associated media created by this user will also be permanently
            deleted from the system.
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isActionLoading}
              onClick={handleDeletePermanently}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" /> Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
