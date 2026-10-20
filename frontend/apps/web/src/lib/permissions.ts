import type { SessionUser } from "@pz/shared";

export type ModuleCategory = "Transaction" | "Profiles" | "User" | "Product" | "Facility" | "General";
export type SystemModuleKey = "transaction" | "profiles" | "user" | "product" | "facility" | "general";

export interface DashboardModule {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: string;
  exact?: boolean;
  category: ModuleCategory;
  moduleId?: SystemModuleKey;
  featureId?: string;
  description: string;
  badge?: string;
  isAuthorized: (user: SessionUser | null | undefined, canAccess: (table: string, action: string) => boolean) => boolean;
}

export const ALL_DASHBOARD_MODULES: DashboardModule[] = [
  // ==========================================
  // GENERAL & CORE PLATFORM
  // ==========================================
  {
    id: "dashboard",
    label: "Dashboard Overview",
    shortLabel: "Home",
    href: "/dashboard",
    icon: "🏠",
    exact: true,
    category: "General",
    moduleId: "general",
    description: "System overview, authorized module launchpad, and daily activity metrics.",
    isAuthorized: () => true, // Accessible to all authenticated users
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    shortLabel: "Reports",
    href: "/report",
    icon: "📊",
    category: "General",
    moduleId: "general",
    description: "Central reporting hub: sales performance, payroll compensation, equipment fleet, product stock levels, and facility opname.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("pos", "report") ||
        can("pos", "summary") ||
        can("pos", "*") ||
        can("sales-order", "*") ||
        can("salary-record", "*") ||
        can("payroll-period", "*") ||
        can("equipment", "*") ||
        can("product", "*")
      ),
  },
  {
    id: "settings-modules",
    label: "Module Manager",
    shortLabel: "Modules",
    href: "/settings/modules",
    icon: "🧩",
    category: "General",
    moduleId: "general",
    description: "Configure installable enterprise modules, enable or disable standalone features independently.",
    badge: "Config",
    isAuthorized: (u) => Boolean(u?.isSuperAdmin),
  },
  {
    id: "settings-backup",
    label: "Database Backup",
    shortLabel: "Backup",
    href: "/settings/backup",
    icon: "🗄️",
    category: "General",
    moduleId: "general",
    description: "Create, download, and restore PostgreSQL database backups.",
    badge: "Admin",
    isAuthorized: (u) => Boolean(u?.isSuperAdmin),
  },

  // ==========================================
  // FACILITY MODULE (Facilities, Sections & KDS)
  // ==========================================
  {
    id: "facilities",
    label: "Facilities & Outlets",
    shortLabel: "Facilities",
    href: "/facilities",
    icon: "🏬",
    category: "Facility",
    moduleId: "facility",
    featureId: "facilities",
    description: "Manage physical store outlets, warehouses, regional depots, and branch facilities.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("facility", "get") ||
        can("facility", "get-all") ||
        can("facility", "*") ||
        can("product", "inventory")
      ),
  },
  {
    id: "facility-sections",
    label: "Section Orders (KDS)",
    shortLabel: "Section Orders",
    href: "/facility-sections",
    icon: "🍳",
    category: "Facility",
    moduleId: "facility",
    featureId: "sections",
    description: "Kitchen & Bar station order routing display: dispatch coffee orders to the bar and food orders to the kitchen.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("sales-order", "*") ||
        can("sales-order", "get") ||
        can("sales-order", "get-all") ||
        can("pos", "*") ||
        can("facility", "*") ||
        can("facility-section", "*")
      ),
  },

  // ==========================================
  // TRANSACTION MODULE (Sales, Purchase, Payroll, Rents)
  // ==========================================
  {
    id: "pos",
    label: "Point of Sale",
    shortLabel: "POS",
    href: "/pos",
    icon: "🛒",
    exact: true,
    category: "Transaction",
    moduleId: "transaction",
    featureId: "sales",
    description: "Process retail checkout, manage active cart items, split tender payments, and register customer sales.",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("pos", "*") || can("pos", "create") || can("sales-order", "create") || can("sales-order", "*") || can("sales-order", "report") || can("sales-order", "summary")),
  },
  {
    id: "orders",
    label: "Orders History",
    shortLabel: "Orders",
    href: "/pos/orders",
    icon: "📋",
    category: "Transaction",
    moduleId: "transaction",
    featureId: "sales",
    description: "Browse completed sales orders, review transaction status, and check receipts.",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("sales-order", "all") || can("sales-order", "get") || can("sales-order", "list") || can("sales-order", "get-all") || can("sales-order", "*") || can("pos", "*")),
  },
  {
    id: "purchase-orders",
    label: "Purchase Orders",
    shortLabel: "Procurement",
    href: "/procurement/orders",
    icon: "📑",
    category: "Transaction",
    moduleId: "transaction",
    featureId: "purchase",
    description: "Manage vendor purchase orders, procurement commitments, and supplier deliveries.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("purchase-order", "get") ||
        can("purchase-order", "get-all") ||
        can("purchase-order", "*") ||
        can("rfq", "*")
      ),
  },
  {
    id: "shift",
    label: "Shift & Cash Drawer",
    shortLabel: "Shift",
    href: "/shift",
    icon: "🕐",
    category: "Transaction",
    moduleId: "transaction",
    featureId: "sales",
    description: "Open and close cashier shifts, track opening/closing cash, and reconcile the cash drawer.",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("pos", "*") || can("pos", "create") || can("shift", "*") || can("shift", "open")),
  },
  {
    id: "schedule",
    label: "Employee Schedule",
    shortLabel: "Schedule",
    href: "/schedule",
    icon: "📅",
    category: "Transaction",
    moduleId: "transaction",
    featureId: "sales",
    description: "Weekly roster calendar — assign shifts to employees, track working hours, and plan staffing per outlet.",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("employee", "*") || can("schedule", "*") || can("schedule", "get-all")),
  },
  {
    id: "discounts",
    label: "Discounts & Promos",
    shortLabel: "Discounts",
    href: "/discounts",
    icon: "🏷️",
    category: "Transaction",
    moduleId: "transaction",
    featureId: "sales",
    description: "Create and manage promotional discount codes, percentage or fixed-amount deals.",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("pos", "*") || can("discount", "*") || can("discount", "get-all")),
  },
  {
    id: "price-comparison",
    label: "Supplier Price Comparison",
    shortLabel: "Price Compare",
    href: "/procurement/price-comparison",
    icon: "💹",
    category: "Transaction",
    moduleId: "transaction",
    featureId: "purchase",
    description: "Compare vendor prices side-by-side for every product to find the best deal.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("purchase-order", "get") ||
        can("purchase-order", "get-all") ||
        can("purchase-order", "*") ||
        can("rfq", "*") ||
        can("vendor", "*") ||
        can("vendor", "get") ||
        can("vendor", "get-all")
      ),
  },
  {
    id: "payroll",
    label: "Payroll Management",
    shortLabel: "Payroll",
    href: "/payroll",
    icon: "💵",
    category: "Transaction",
    moduleId: "transaction",
    featureId: "payroll",
    description: "Employee salary structure, compensation components, payroll periods, and payslip generation.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("salary-record", "*") ||
        can("payroll-period", "*") ||
        can("payroll-component", "*") ||
        can("employee", "*")
      ),
  },
  {
    id: "rents",
    label: "Equipment Rents & Leases",
    shortLabel: "Rents",
    href: "/rents",
    icon: "🔑",
    category: "Transaction",
    moduleId: "transaction",
    featureId: "rents",
    description: "Machinery & equipment rental pricing tiers, daily/monthly lease schedules, and asset hire rates.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("equipment", "get") ||
        can("equipment", "get-all") ||
        can("equipment", "*") ||
        can("equipment-price", "*")
      ),
  },

  // ==========================================
  // PROFILES MODULE (Profile, Vendor, Customer, Employee)
  // ==========================================
  {
    id: "profiles",
    label: "Profiles",
    shortLabel: "Profiles",
    href: "/profiles",
    icon: "🪪",
    category: "Profiles",
    moduleId: "profiles",
    featureId: "profile",
    description: "Master identity directory of individuals and business entities across the platform.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("profile", "read") ||
        can("profile", "get-all") ||
        can("profile", "get") ||
        can("profile", "*") ||
        can("customer", "*") ||
        can("employee", "*") ||
        can("user", "*")
      ),
  },
  {
    id: "vendors",
    label: "Vendors",
    shortLabel: "Vendors",
    href: "/vendors",
    icon: "🏢",
    category: "Profiles",
    moduleId: "profiles",
    featureId: "vendor",
    description: "Supply chain partners, procurement contacts, and supplier profile identities.",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("vendor", "read") || can("vendor", "get-all") || can("vendor", "get") || can("vendor", "*")),
  },
  {
    id: "customers",
    label: "Customers",
    shortLabel: "Customers",
    href: "/customers",
    icon: "👥",
    category: "Profiles",
    moduleId: "profiles",
    featureId: "customer",
    description: "Maintain client profiles, loyalty tiers, address records, and customer groups.",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("customer", "read") || can("customer", "get-all") || can("customer", "get") || can("customer", "*")),
  },
  {
    id: "employees",
    label: "Employees",
    shortLabel: "Employees",
    href: "/employees",
    icon: "👔",
    category: "Profiles",
    moduleId: "profiles",
    featureId: "employee",
    description: "Staff directory, internal positions, contact channels, and employment records.",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("employee", "read") || can("employee", "get-all") || can("employee", "get") || can("employee", "*")),
  },

  // ==========================================
  // USER MODULE (User, Role, Permissions)
  // ==========================================
  {
    id: "users",
    label: "User Management",
    shortLabel: "Users",
    href: "/users",
    icon: "👤",
    category: "User",
    moduleId: "user",
    featureId: "user",
    description: "Manage organizational user credentials, role assignments, and profile links.",
    badge: "Admin",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("user", "get-all") || can("user", "get") || can("user", "*")),
  },
  {
    id: "roles",
    label: "Role Management",
    shortLabel: "Roles",
    href: "/roles",
    icon: "🛡️",
    category: "User",
    moduleId: "user",
    featureId: "role",
    description: "Define granular security profiles, table privileges, and RBAC permission sets.",
    badge: "Admin",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("role", "get-all") || can("role", "get") || can("role", "*")),
  },

  // ==========================================
  // PRODUCT MODULE (Product, Formula, Equipment)
  // ==========================================
  {
    id: "products",
    label: "Products Catalog",
    shortLabel: "Products",
    href: "/products",
    icon: "📦",
    category: "Product",
    moduleId: "product",
    featureId: "product",
    description: "Manage product SKUs, retail pricing, categories, and inventory items.",
    isAuthorized: (u, can) =>
      Boolean(u?.isSuperAdmin || can("product", "get") || can("product", "get-all") || can("product", "read") || can("product", "*")),
  },
  {
    id: "inventory",
    label: "Inventory Ledger",
    shortLabel: "Inventory",
    href: "/inventory",
    icon: "📊",
    category: "Product",
    moduleId: "product",
    featureId: "product",
    description: "Real-time stock ledger, stock level alerts, and inventory adjustments (IN, OUT, AUDIT).",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("product", "inventory") ||
        can("product", "get-all") ||
        can("product", "*") ||
        can("item", "*")
      ),
  },
  {
    id: "recipes",
    label: "Formulas (BOM)",
    shortLabel: "Formulas",
    href: "/recipes",
    icon: "🧪",
    category: "Product",
    moduleId: "product",
    featureId: "formula",
    description: "Manage formulas, ingredients bill of materials, and automated recursive stock deduction.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("product", "get") ||
        can("product", "get-all") ||
        can("product", "*") ||
        can("product-recipe", "*") ||
        can("recipe", "*")
      ),
  },
  {
    id: "equipment",
    label: "Equipments",
    shortLabel: "Equipment",
    href: "/equipment",
    icon: "🚜",
    category: "Product",
    moduleId: "product",
    featureId: "equipment",
    description: "Machinery, tools, fleet equipment tracking, asset valuation, and maintenance schedules.",
    isAuthorized: (u, can) =>
      Boolean(
        u?.isSuperAdmin ||
        can("equipment", "get") ||
        can("equipment", "get-all") ||
        can("equipment", "*") ||
        can("equipment-brand", "*") ||
        can("equipment-model", "*") ||
        can("equipment-type", "*")
      ),
  },
];
