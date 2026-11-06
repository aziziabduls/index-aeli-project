"use client";

import Link from "next/link";

import { CircleHelp, ClipboardList, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { rootUser } from "@/data/users";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  readonly user?: { id: string; email: string; role: string; permissions?: string[] } | null;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const userRole = user?.role || "";
  const isSuperAdmin = userRole === "super_admin" || user?.email === "superadmin@indexaeli.com";
  const permissions = (user?.permissions || []).map((p) => p.toLowerCase());

  const hasGroupAccess = (groupId: number) => {
    if (isSuperAdmin) return true;

    // Group 1: Dashboard Overview
    if (groupId === 1) return true;

    // Group 2: Providers & Categories
    if (groupId === 2) {
      if (permissions.length > 0) {
        return permissions.some((p) => ["providers", "categories", "menu_providers"].includes(p));
      }
      return userRole === "admin" || userRole === "content_editor";
    }

    // Group 3: Location, Experience, Programs
    if (groupId === 3) {
      if (permissions.length > 0) {
        return permissions.some((p) =>
          ["programs", "locations", "experiences", "destinations", "attractions", "content", "menu_programs"].includes(p)
        );
      }
      return userRole === "admin" || userRole === "content_editor";
    }

    // Group 4: Finance (Transactions, Payout)
    if (groupId === 4) {
      if (permissions.length > 0) {
        return permissions.some((p) =>
          ["finance", "payout", "transactions", "billing", "bank_accounts", "menu_finance"].includes(p)
        );
      }
      return userRole === "admin" || userRole === "finance" || userRole === "finance_manager";
    }

    // Group 5: User Access (Users, Roles)
    if (groupId === 5) {
      if (permissions.length > 0) {
        return permissions.some((p) => ["users", "roles", "user access", "identity", "menu_users"].includes(p));
      }
      return userRole === "admin";
    }

    // Group 6: Configuration (App Config)
    if (groupId === 6) {
      if (permissions.length > 0) {
        return permissions.some((p) => ["config", "settings", "configuration", "menu_config"].includes(p));
      }
      return false;
    }

    return true;
  };

  const filteredSidebarItems = sidebarItems
    .map((group) => {
      const hasAccess = hasGroupAccess(group.id);
      return {
        ...group,
        items: hasAccess ? group.items : [],
      };
    })
    .filter((group) => group.items.length > 0);

  const getDisplayName = (email: string, role: string) => {
    if (role === "super_admin") return "Super Admin";
    if (role === "admin") return "Admin";
    if (role === "finance" || role === "finance_manager") return "Finance Manager";
    if (role === "content_editor") return "Content Editor";
    if (role === "viewer") return "Viewer";
    return email.split("@")[0];
  };

  const navUserInfo = user
    ? {
      name: getDisplayName(user.email, user.role),
      email: user.email,
      avatar: "",
    }
    : rootUser;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link prefetch={false} href="/dashboard/default" />}>
              {/* <Command /> */}
              <span className="font-semibold text-base">{APP_CONFIG.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredSidebarItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* <SidebarSupportCard /> */}
        <NavUser user={navUserInfo} />
      </SidebarFooter>
    </Sidebar>
  );
}
