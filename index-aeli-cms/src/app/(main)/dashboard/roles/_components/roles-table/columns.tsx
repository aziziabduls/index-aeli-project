"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getRoleMenus, type Role } from "./data";

export const rolesColumns: ColumnDef<Role>[] = [
  {
    id: "group",
    accessorKey: "group",
    filterFn: "equalsString",
    enableHiding: true,
  },
  {
    id: "search",
    accessorFn: (row) => [row.role, row.owner, ...row.permissionSets].join(" "),
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    id: "role",
    accessorKey: "role",
    header: "Role",
    size: 180,
    minSize: 180,
    cell: ({ row }) => <span className="font-medium text-sm">{row.original.role}</span>,
  },
  {
    id: "accessLevel",
    accessorKey: "accessLevel",
    header: "Access level",
    size: 110,
    cell: ({ row }) => {
      const level = row.original.accessLevel;
      const badgeClass =
        level === "Full"
          ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-500"
          : level === "Scoped"
            ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
            : level === "API access"
              ? "border-purple-500/20 bg-purple-500/10 text-purple-500"
              : "border-slate-500/20 bg-slate-500/10 text-slate-400";

      return (
        <Badge className={`rounded-sm ${badgeClass}`} variant="outline">
          {level}
        </Badge>
      );
    },
  },
  {
    id: "menuPermissions",
    header: "Permission Menu",
    size: 260,
    cell: ({ row }) => {
      const allowedMenus = getRoleMenus(row.original);
      const isAll = allowedMenus.length >= 6;

      if (isAll) {
        return (
          <div className="flex items-center gap-1.5">
            <Badge className="rounded-sm text-xs font-semibold border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
              Full Access (All Menus)
            </Badge>
          </div>
        );
      }

      return (
        <div className="flex flex-wrap items-center justify-start gap-1">
          {allowedMenus.map((menu) => (
            <Badge
              key={menu.id}
              className={`rounded-sm text-[11px] font-medium py-0 px-1.5 ${menu.color}`}
              variant="outline"
              title={`${menu.groupName}: ${menu.subItems.join(", ")}`}
            >
              {menu.label}
            </Badge>
          ))}
          {allowedMenus.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No menu access</span>
          )}
        </div>
      );
    },
  },
  {
    id: "users",
    accessorKey: "users",
    header: "Users",
    size: 70,
    cell: ({ row }) => (
      <span className="font-medium text-sm tabular-nums">{row.original.users}</span>
    ),
  },
  {
    id: "permissionSets",
    accessorFn: (row) => row.permissionSets.join(" "),
    header: "Permission sets",
    size: 240,
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center justify-start gap-1.5">
        {row.original.permissionSets.slice(0, 3).map((set) => (
          <Badge className="rounded-sm text-xs font-normal" variant="outline" key={set}>
            {set}
          </Badge>
        ))}
        {row.original.permissionSets.length > 3 ? (
          <span className="text-xs text-muted-foreground tabular-nums">+{row.original.permissionSets.length - 3}</span>
        ) : null}
      </div>
    ),
  },
  {
    id: "lastReview",
    accessorKey: "lastReview",
    header: "Last review",
    size: 110,
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.lastReview}</span>,
  },
  {
    id: "owner",
    accessorKey: "owner",
    header: "Owner",
    size: 100,
    filterFn: "equalsString",
    cell: ({ row }) => <span className="text-sm">{row.original.owner}</span>,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    size: 120,
    filterFn: "equalsString",
    cell: ({ row }) => {
      const isReview = row.original.status === "Needs review";
      return (
        <Badge
          className={
            isReview
              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-sm font-medium"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-sm"
          }
          variant="outline"
        >
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "",
    size: 70,
    cell: ({ row, table }) => {
      const isSystemRole = Boolean(row.original.isSystem || row.original.group === "System roles");
      const needsReview = row.original.status === "Needs review";
      const meta = table.options.meta as {
        onReviewRole?: (role: Role) => void;
        onViewDetails?: (role: Role) => void;
        onEditRole?: (role: Role) => void;
        onDuplicateRole?: (role: Role) => void;
        onReviewPermissions?: (role: Role) => void;
        onManageMembers?: (role: Role) => void;
        onDeleteRole?: (role: Role) => void;
        isSuperAdmin?: boolean;
      } | undefined;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Open actions" />}>
            <MoreVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end">
            <DropdownMenuGroup>
              {needsReview ? (
                <DropdownMenuItem
                  onClick={() => meta?.onReviewRole?.(row.original)}
                  className="font-medium text-amber-600 focus:text-amber-700"
                >
                  Review changes
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => meta?.onViewDetails?.(row.original)}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!meta?.isSuperAdmin}
                onClick={() => meta?.onEditRole?.(row.original)}
              >
                Edit role
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!meta?.isSuperAdmin}
                onClick={() => meta?.onDuplicateRole?.(row.original)}
              >
                Duplicate role
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => meta?.onReviewPermissions?.(row.original)}>
                Review permissions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => meta?.onManageMembers?.(row.original)}>
                Manage members
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {!isSystemRole && meta?.isSuperAdmin ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => meta?.onDeleteRole?.(row.original)}
                  >
                    Delete role
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableColumnFilter: false,
  },
];
