"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { parse } from "date-fns";
import { Check, Clock, Eye, Mail, MoreHorizontal, Pencil, Trash2, UserCheck, Users2, UserX, X } from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";

import { statusMeta, type UserRow } from "./data";

export interface UsersTableMeta {
  onViewProfile?: (user: UserRow) => void;
  onEditUser?: (user: UserRow) => void;
  onManageTeam?: (user: UserRow) => void;
  onToggleStatus?: (user: UserRow) => void;
  onDeletePermanently?: (user: UserRow) => void;
  currentUser?: { id?: string; email?: string; role?: string } | null;
}

function RoleCell({ role, team }: { role: string; team: string }) {
  return (
    <div className="grid gap-0.5">
      <span className="whitespace-nowrap">{role}</span>
      <span className="text-muted-foreground text-xs">{team}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: UserRow["status"] }) {
  const meta = statusMeta[status];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  );
}

function getAvatarTone(name: string) {
  const tones = [
    "[&_[data-slot=avatar-fallback]]:bg-amber-100 [&_[data-slot=avatar-fallback]]:text-amber-700 after:border-amber-200 dark:[&_[data-slot=avatar-fallback]]:bg-amber-500/15 dark:[&_[data-slot=avatar-fallback]]:text-amber-300 dark:after:border-amber-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-orange-100 [&_[data-slot=avatar-fallback]]:text-orange-700 after:border-orange-200 dark:[&_[data-slot=avatar-fallback]]:bg-orange-500/15 dark:[&_[data-slot=avatar-fallback]]:text-orange-300 dark:after:border-orange-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-rose-100 [&_[data-slot=avatar-fallback]]:text-rose-700 after:border-rose-200 dark:[&_[data-slot=avatar-fallback]]:bg-rose-500/15 dark:[&_[data-slot=avatar-fallback]]:text-rose-300 dark:after:border-rose-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-pink-100 [&_[data-slot=avatar-fallback]]:text-pink-700 after:border-pink-200 dark:[&_[data-slot=avatar-fallback]]:bg-pink-500/15 dark:[&_[data-slot=avatar-fallback]]:text-pink-300 dark:after:border-pink-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-fuchsia-100 [&_[data-slot=avatar-fallback]]:text-fuchsia-700 after:border-fuchsia-200 dark:[&_[data-slot=avatar-fallback]]:bg-fuchsia-500/15 dark:[&_[data-slot=avatar-fallback]]:text-fuchsia-300 dark:after:border-fuchsia-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-purple-100 [&_[data-slot=avatar-fallback]]:text-purple-700 after:border-purple-200 dark:[&_[data-slot=avatar-fallback]]:bg-purple-500/15 dark:[&_[data-slot=avatar-fallback]]:text-purple-300 dark:after:border-purple-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-violet-100 [&_[data-slot=avatar-fallback]]:text-violet-700 after:border-violet-200 dark:[&_[data-slot=avatar-fallback]]:bg-violet-500/15 dark:[&_[data-slot=avatar-fallback]]:text-violet-300 dark:after:border-violet-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-indigo-100 [&_[data-slot=avatar-fallback]]:text-indigo-700 after:border-indigo-200 dark:[&_[data-slot=avatar-fallback]]:bg-indigo-500/15 dark:[&_[data-slot=avatar-fallback]]:text-indigo-300 dark:after:border-indigo-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-sky-100 [&_[data-slot=avatar-fallback]]:text-sky-700 after:border-sky-200 dark:[&_[data-slot=avatar-fallback]]:bg-sky-500/15 dark:[&_[data-slot=avatar-fallback]]:text-sky-300 dark:after:border-sky-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-emerald-100 [&_[data-slot=avatar-fallback]]:text-emerald-700 after:border-emerald-200 dark:[&_[data-slot=avatar-fallback]]:bg-emerald-500/15 dark:[&_[data-slot=avatar-fallback]]:text-emerald-300 dark:after:border-emerald-500/20",
  ];

  return tones[name.length % tones.length];
}

function getLastActiveBadge(lastActive: number) {
  if (lastActive < 1) {
    return {
      className: "bg-green-600 text-green-950 [&>svg]:text-white",
      icon: Check,
    };
  }

  if (lastActive < 4 * 60) {
    return {
      className: "bg-amber-500 text-amber-950",
      icon: Clock,
    };
  }

  if (lastActive < 7 * 24 * 60) {
    return {
      className: "bg-destructive",
      icon: null,
    };
  }

  return {
    className: "bg-muted-foreground text-muted",
    icon: X,
  };
}

function AvatarCell({ lastActive, name }: { lastActive: number; name: string }) {
  const badge = getLastActiveBadge(lastActive);
  const BadgeIcon = badge.icon;

  return (
    <Avatar size="lg" className={cn("font-medium", getAvatarTone(name))}>
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
      <AvatarBadge className={badge.className}>{BadgeIcon ? <BadgeIcon /> : null}</AvatarBadge>
    </Avatar>
  );
}

export const usersColumns: ColumnDef<UserRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Select all users"
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.name} ${row.email}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <AvatarCell name={row.original.name} lastActive={row.original.lastActive} />
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground text-sm">{row.original.name}</div>
          <div className="truncate text-muted-foreground text-sm">{row.original.email}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role / Team",
    filterFn: "equalsString",
    cell: ({ row }) => <RoleCell role={row.original.role} team={row.original.team} />,
  },
  {
    accessorKey: "team",
    header: "Team",
    filterFn: "equalsString",
    cell: ({ row }) => <div className="text-sm">{row.original.team}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "joinedDate",
    accessorFn: (row) => parse(row.joinedDate, "dd MMM yyyy, h:mm a", new Date()).getTime(),
    header: "Joined date",
    cell: ({ row }) => <div className="text-foreground text-sm">{row.original.joinedDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as UsersTableMeta | undefined;
      const user = row.original;
      const isRootSuperAdmin = user.email.toLowerCase() === "superadmin@indexaeli.com";
      const isSelf = meta?.currentUser?.email?.toLowerCase() === user.email.toLowerCase();
      const isActive = user.status === "Active";

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={`Open actions for ${row.original.name}`}
                  className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                  size="icon-sm"
                  variant="ghost"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => meta?.onViewProfile?.(user)}>
                  <Eye className="mr-2 size-4" />
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => meta?.onEditUser?.(user)}>
                  <Pencil className="mr-2 size-4" />
                  Edit user
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => meta?.onManageTeam?.(user)}>
                  <Users2 className="mr-2 size-4" />
                  Manage team
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                  <Mail className="mr-2 size-4" />
                  Resend invite (Inactive)
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={isRootSuperAdmin || isSelf}
                  variant={isActive ? "destructive" : "default"}
                  className={isActive ? "" : "text-emerald-600 focus:text-emerald-700"}
                  onClick={() => meta?.onToggleStatus?.(user)}
                >
                  {isActive ? (
                    <>
                      <UserX className="mr-2 size-4" />
                      Deactivate user
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 size-4" />
                      Activate user
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isRootSuperAdmin || isSelf}
                  onClick={() => meta?.onDeletePermanently?.(user)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete permanently
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableHiding: false,
    enableSorting: false,
  },
];
