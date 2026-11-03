"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { BadgeCheck, Bell, Check, Landmark, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteClientCookie } from "@/lib/cookie.client";
import { cn, getInitials } from "@/lib/utils";

export function AccountSwitcher({
  users,
  currentUser,
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
  }>;
  readonly currentUser?: { id: string; email: string; role: string } | null;
}) {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState(() => {
    if (currentUser) {
      const getDisplayName = (email: string, role: string) => {
        if (role === "super_admin") return "Super Admin";
        if (role === "admin") return "Admin";
        if (role === "content_editor") return "Content Editor";
        if (role === "viewer") return "Viewer";
        return email.split("@")[0];
      };
      const getDisplayRole = (role: string) => {
        if (role === "super_admin") return "Super Admin";
        if (role === "admin") return "Admin";
        if (role === "content_editor") return "Editor";
        if (role === "viewer") return "Viewer";
        return role;
      };
      return {
        id: currentUser.id,
        name: getDisplayName(currentUser.email, currentUser.role),
        email: currentUser.email,
        avatar: "",
        role: getDisplayRole(currentUser.role),
      };
    }
    return users[0];
  });

  const handleLogout = () => {
    deleteClientCookie("session_token");
    deleteClientCookie("refresh_token");
    deleteClientCookie("user");
    router.push("/auth/v1/login");
  };

  if (!activeUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
        <Avatar className="size-8 rounded-lg">
          <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
          <AvatarFallback className="rounded-lg">{getInitials(activeUser.name)}</AvatarFallback>
        </Avatar>
        {/* hide when mobile view */}
        <div className="grid flex-1 text-left text-sm leading-tight hidden md:grid">
          <span className="truncate font-medium">{activeUser.name}</span>
          <span className="truncate text-muted-foreground text-xs">{activeUser.email}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[calc(var(--radix-dropdown-menu-trigger-width)-16px)] min-w-[240px] rounded-lg"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        {users.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => setActiveUser(user)}
            className="flex items-center justify-between gap-2 p-2"
          >
            <div className="flex items-center gap-2">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-muted-foreground text-xs">{user.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                {user.role}
              </span>
              <span
                className={cn(
                  "mr-1 flex size-5 items-center justify-center rounded-full text-primary opacity-0",
                  user.id === activeUser.id && "opacity-100",
                )}
              >
                <Check aria-hidden="true" />
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        {/* <DropdownMenuSeparator /> */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard/account")}>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/payout")}>
            <Landmark />
            Payout
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/notifications")}>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
