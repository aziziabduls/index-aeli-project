import {
  Briefcase,
  Compass,
  CreditCard,
  Grid3x3,
  ListTodo,
  Lock,
  type LucideIcon,
  MapPin,
  Settings,
  Tags,
  Users,
  Wallet,
} from "lucide-react";

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
    label: "Dashboard",
    items: [
      {
        id: "default",
        title: "Overview",
        url: "/dashboard",
        icon: Grid3x3,
      },
    ]
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
    label: "Programs",
    items: [

      {
        id: "destinations",
        title: "Location",
        url: "/dashboard/destinations",
        icon: MapPin,
      },
      {
        id: "attractions",
        title: "Experience",
        url: "/dashboard/attractions",
        icon: Compass,
      },
      {
        id: "programs",
        title: "Programs",
        url: "/dashboard/programs",
        icon: ListTodo,
      },
    ],
  },
  {
    id: 4,
    label: "Finance",
    items: [
      {
        id: "transactions",
        title: "Transactions",
        url: "/dashboard/transactions",
        icon: CreditCard,
      },
      {
        id: "payout",
        title: "Payout",
        url: "/dashboard/payout",
        icon: Wallet,
      },
    ],
  },
  {
    id: 5,
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
  {
    id: 6,
    label: "Configuration",
    items: [
      {
        id: "app-config",
        title: "App Config",
        url: "/dashboard/app-config",
        icon: Settings,
      },
    ],
  },
];
