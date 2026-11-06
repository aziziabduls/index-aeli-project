export type Role = {
  id?: string;
  role: string;
  key?: string;
  group: string;
  accessLevel: string;
  users: number;
  permissionSets: string[];
  lastReview: string;
  rawLastReview?: string;
  owner: string;
  status: "Active" | "Needs review";
  isSystem?: boolean;
  description?: string;
  members?: Array<{
    id: string;
    email: string;
    name?: string;
    status: string;
    created_at: string;
  }>;
};

export interface PermissionSet {
  id: string;
  name: string;
  module: string;
  description: string;
}

export const defaultPermissionSets: PermissionSet[] = [
  { id: "Users", name: "Users", module: "Identity", description: "Manage team accounts, assign roles, and control access permissions." },
  { id: "Roles", name: "Roles", module: "Identity", description: "Define access tiers, permission scopes, and review matrices." },
  { id: "Destinations", name: "Destinations", module: "Content", description: "Create and edit travel regional destinations and geographic profiles." },
  { id: "Attractions", name: "Attractions", module: "Content", description: "Manage physical landmarks, sightseeing sights, and operational schedules." },
  { id: "Programs", name: "Programs", module: "Program", description: "Configure experiential tour catalog, itineraries, rundowns, and pricing." },
  { id: "Providers", name: "Providers", module: "Program", description: "Manage travel agency operator contracts, legal entities, and contact info." },
  { id: "Categories", name: "Categories", module: "Program", description: "Organize catalog taxonomy, category color palettes, and tags." },
  { id: "Media", name: "Media", module: "Media", description: "Upload static images, banner galleries, and media asset registry." },
  { id: "Finance", name: "Finance", module: "Identity", description: "Access live financial ledger, booking revenue, and banking reconciliation." },
  { id: "Transactions", name: "Transactions", module: "Identity", description: "Inspect tourist booking receipts, payment methods, and transaction statuses." },
  { id: "Billing", name: "Billing", module: "Identity", description: "Manage organization subscription plan, payment methods, and invoices." },
  { id: "Payout", name: "Payout", module: "Identity", description: "Manage bank disbursement accounts, withdrawal schedules, and balances." },
  { id: "Reports", name: "Reports", module: "Analytics", description: "View business intelligence reports, booking statistics, and traveler traffic." },
  { id: "Settings", name: "Settings", module: "Content", description: "Configure global portal branding, tax percentages, and contact details." },
  { id: "Audit Logs", name: "Audit Logs", module: "Audit", description: "Inspect security audit trails and system modification history." },
];

export interface MenuPermission {
  id: string;
  label: string;
  groupName: string;
  description: string;
  subItems: string[];
  associatedPermissions: string[];
  color: string;
}

export const MENU_PERMISSIONS_CONFIG: MenuPermission[] = [
  {
    id: "Dashboard",
    label: "Dashboard",
    groupName: "Overview",
    description: "Overview dashboard, traveler metrics, and real-time subscriber registration summary.",
    subItems: ["Overview"],
    associatedPermissions: ["Dashboard", "Reports"],
    color: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  {
    id: "Providers",
    label: "Providers",
    groupName: "Providers & Categories",
    description: "Certified tour operators registry and program category taxonomy.",
    subItems: ["Providers", "Categories"],
    associatedPermissions: ["Providers", "Categories"],
    color: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  },
  {
    id: "Programs",
    label: "Programs",
    groupName: "Programs (Location & Experience)",
    description: "Destinations/locations, attractions/experiences, and experiential learning programs.",
    subItems: ["Location", "Experience", "Programs"],
    associatedPermissions: ["Programs", "Destinations", "Attractions"],
    color: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    id: "Finance",
    label: "Finance",
    groupName: "Finance (Transactions & Payout)",
    description: "Web traveler bookings, 95% provider revenue distribution, and bank settlements.",
    subItems: ["Transactions", "Payout"],
    associatedPermissions: ["Finance", "Transactions", "Payout", "Billing"],
    color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "Users",
    label: "User Access",
    groupName: "User Access (Users & Roles)",
    description: "Team accounts, role delegation, access matrices, and permissions tiering.",
    subItems: ["Users", "Roles"],
    associatedPermissions: ["Users", "Roles"],
    color: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    id: "Settings",
    label: "Configuration",
    groupName: "Configuration (App Config)",
    description: "Global portal branding, tax rates, contact details, and platform footer.",
    subItems: ["App Config"],
    associatedPermissions: ["Settings", "Config"],
    color: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
];

export function getRoleMenus(role: Role): MenuPermission[] {
  const key = (role.key || role.role || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const psets = (role.permissionSets || []).map((p) => p.toLowerCase());

  // Super admin has all menus
  if (
    key === "super_admin" ||
    key === "superadmin" ||
    role.accessLevel === "Global" ||
    psets.includes("global") ||
    psets.includes("all")
  ) {
    return MENU_PERMISSIONS_CONFIG;
  }

  return MENU_PERMISSIONS_CONFIG.filter((menu) => {
    // 1. Direct menu match (e.g. "Dashboard", "Programs", "Finance", "User Access", "Configuration")
    if (
      psets.some(
        (p) =>
          p === menu.id.toLowerCase() ||
          p === menu.label.toLowerCase() ||
          p === menu.groupName.toLowerCase() ||
          p === `menu_${menu.id.toLowerCase()}`
      )
    ) {
      return true;
    }

    // 2. Associated permissions match
    const hasAssociated = menu.associatedPermissions.some((ap) =>
      psets.some((p) => p === ap.toLowerCase() || p.includes(ap.toLowerCase()) || ap.toLowerCase().includes(p))
    );
    if (hasAssociated) return true;

    // 3. Fallbacks based on role key
    if (menu.id === "Dashboard") return true;
    if (menu.id === "Providers" && ["admin", "content_editor", "finance", "viewer"].includes(key)) return true;
    if (menu.id === "Programs" && ["admin", "content_editor"].includes(key)) return true;
    if (menu.id === "Finance" && ["admin", "finance", "finance_manager"].includes(key)) return true;
    if (menu.id === "Users" && ["admin"].includes(key)) return true;
    if (menu.id === "Settings" && ["admin"].includes(key) && psets.includes("settings")) return true;

    return false;
  });
}

export const roles: Role[] = [
  {
    role: "Finance Manager",
    key: "finance",
    group: "Finance roles",
    accessLevel: "Scoped",
    users: 1,
    permissionSets: ["Finance", "Transactions", "Payout", "Billing", "Reports"],
    lastReview: "Today",
    owner: "System",
    status: "Active",
    description: "Full access to live web transactions, provider payout balances, bank settlements, and booking ledgers."
  },
  {
    role: "Owner",
    group: "Needs review",
    accessLevel: "Full",
    users: 2,
    permissionSets: ["Users", "Settings", "Billing", "Reports", "Integrations", "Audit Logs"],
    lastReview: "Apr 12, 2025",
    owner: "System",
    status: "Needs review",
  },
  {
    role: "Admin",
    group: "Needs review",
    accessLevel: "Full",
    users: 5,
    permissionSets: ["Users", "Settings", "Reports", "Billing", "Integrations"],
    lastReview: "Apr 15, 2025",
    owner: "Jane Doe",
    status: "Needs review",
  },
  {
    role: "Finance Manager",
    key: "finance",
    group: "System roles",
    accessLevel: "Scoped",
    users: 3,
    permissionSets: ["Finance", "Transactions", "Payout", "Billing", "Reports"],
    lastReview: "Nov 4, 2026",
    owner: "System",
    status: "Active",
    isSystem: true,
    description: "Financial oversight: live bookings, disbursements, banking accounts, and revenue audit.",
  },
  {
    role: "Manager",
    group: "Needs review",
    accessLevel: "Scoped",
    users: 12,
    permissionSets: ["Users", "Reports", "Projects", "Tasks"],
    lastReview: "Apr 18, 2025",
    owner: "Jane Doe",
    status: "Needs review",
  },
  {
    role: "Support",
    group: "System roles",
    accessLevel: "Scoped",
    users: 8,
    permissionSets: ["Users", "Tickets", "Reports", "Knowledge Base"],
    lastReview: "May 1, 2025",
    owner: "System",
    status: "Active",
  },
  {
    role: "Analyst",
    group: "System roles",
    accessLevel: "Scoped",
    users: 6,
    permissionSets: ["Reports", "Analytics", "Dashboards", "Exports"],
    lastReview: "May 5, 2025",
    owner: "System",
    status: "Active",
  },
  {
    role: "Guest",
    group: "System roles",
    accessLevel: "Read only",
    users: 14,
    permissionSets: ["Reports", "Dashboards"],
    lastReview: "May 6, 2025",
    owner: "System",
    status: "Active",
  },
  {
    role: "Service",
    group: "System roles",
    accessLevel: "API access",
    users: 3,
    permissionSets: ["Integrations", "API Keys", "Webhooks", "Logs"],
    lastReview: "Apr 22, 2025",
    owner: "System",
    status: "Active",
  },
  {
    role: "Billing",
    group: "Custom roles",
    accessLevel: "Scoped",
    users: 3,
    permissionSets: ["Billing", "Invoices", "Payments", "Reports"],
    lastReview: "Apr 28, 2025",
    owner: "Alex Kim",
    status: "Active",
  },
  {
    role: "Marketing",
    group: "Custom roles",
    accessLevel: "Scoped",
    users: 9,
    permissionSets: ["Users", "Reports", "Campaigns", "Analytics", "Exports"],
    lastReview: "May 2, 2025",
    owner: "Alex Kim",
    status: "Active",
  },
  {
    role: "Developer",
    group: "Custom roles",
    accessLevel: "Scoped",
    users: 10,
    permissionSets: ["Repos", "Deployments", "Settings", "API Keys", "Logs"],
    lastReview: "May 3, 2025",
    owner: "Chris Lee",
    status: "Active",
  },
  {
    role: "Project Lead",
    group: "Custom roles",
    accessLevel: "Scoped",
    users: 7,
    permissionSets: ["Projects", "Tasks", "Reports", "Users", "Settings"],
    lastReview: "Apr 30, 2025",
    owner: "Chris Lee",
    status: "Active",
  },
  {
    role: "Finance Viewer",
    group: "Custom roles",
    accessLevel: "Read only",
    users: 4,
    permissionSets: ["Billing", "Reports", "Invoices", "Dashboards"],
    lastReview: "May 7, 2025",
    owner: "Jane Doe",
    status: "Active",
  },
];
