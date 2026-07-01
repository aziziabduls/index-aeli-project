import { Briefcase, Compass, Grid3x3, ListTodo, Lock, type LucideIcon, MapPin, Tags, Users } from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Programs",
    items: [
      {
        id: "default",
        title: "Overview",
        url: "/dashboard",
        icon: Grid3x3,
      },
      {
        id: "programs",
        title: "Programs",
        url: "/dashboard/programs",
        icon: ListTodo,
      },
      {
        id: "destinations",
        title: "Destinations",
        url: "/dashboard/destinations",
        icon: MapPin,
      },
      {
        id: "attractions",
        title: "Experience",
        url: "/dashboard/attractions",
        icon: Compass,
      },
    ],
  },
  {
    id: 2,
    label: "Providers & Categories",
    items: [
      {
        id: "providers",
        title: "Providers",
        url: "/dashboard/providers",
        icon: Briefcase,
      },
      {
        id: "categories",
        title: "Categories",
        url: "/dashboard/categories",
        icon: Tags,
      },
    ],
  },
  {
    id: 3,
    label: "User Access",
    items: [
      {
        id: "users",
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
      },
      {
        id: "roles",
        title: "Roles",
        url: "/dashboard/roles",
        icon: Lock,
      },
    ],
  },
];
