import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fs from "node:fs";
import path from "node:path";
import { success } from "../../utils/response";

export interface SubFeatureConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  enabled: boolean;
  routePaths: string[];
  category: string;
}

export interface ModuleConfig {
  id: "transaction" | "profiles" | "user" | "product" | "facility";
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  features: Record<string, SubFeatureConfig>;
}

export type SystemModulesConfig = Record<
  "transaction" | "profiles" | "user" | "product" | "facility",
  ModuleConfig
>;

const DEFAULT_MODULES_CONFIG: SystemModulesConfig = {
  transaction: {
    id: "transaction",
    name: "Transaction",
    description:
      "Point of sale retail checkout, vendor purchase orders, employee payroll, and equipment rental rates.",
    icon: "💳",
    enabled: true,
    features: {
      sales: {
        id: "sales",
        name: "Sales & POS Register",
        shortName: "Sales",
        description:
          "Desktop & touch POS cashier terminal, split tender checkout, order history, and daily sales reports.",
        icon: "🛒",
        enabled: true,
        routePaths: ["/pos", "/pos/orders", "/pos/reports"],
        category: "Transaction",
      },
      purchase: {
        id: "purchase",
        name: "Purchase & Procurement",
        shortName: "Purchase",
        description:
          "Vendor purchase orders, requests for quotation (RFQ), supplier deliveries, and procurement ledger.",
        icon: "📑",
        enabled: true,
        routePaths: ["/procurement/orders"],
        category: "Transaction",
      },
      payroll: {
        id: "payroll",
        name: "Payroll Management",
        shortName: "Payroll",
        description:
          "Employee compensation salary structure, payroll periods, salary records, and automated payslips.",
        icon: "💵",
        enabled: true,
        routePaths: ["/payroll"],
        category: "Transaction",
      },
      rents: {
        id: "rents",
        name: "Equipment Rental & Leases",
        shortName: "Rents",
        description:
          "Machinery & equipment rental pricing tiers, daily/monthly lease schedules, and asset hire rates.",
        icon: "🔑",
        enabled: true,
        routePaths: ["/rents"],
        category: "Transaction",
      },
    },
  },
  profiles: {
    id: "profiles",
    name: "Profiles",
    description:
      "Master identity directory of individuals, business associates, clients, and organizational personnel.",
    icon: "🪪",
    enabled: true,
    features: {
      profile: {
        id: "profile",
        name: "Master Profiles Directory",
        shortName: "Profiles",
        description:
          "Unified master registry of individuals, corporate entities, contact channels, and tax IDs.",
        icon: "🪪",
        enabled: true,
        routePaths: ["/profiles", "/persons"],
        category: "Profiles",
      },
      vendor: {
        id: "vendor",
        name: "Vendors & Suppliers",
        shortName: "Vendors",
        description:
          "Supply chain partners, procurement contacts, vendor catalogs, and supplier profiles.",
        icon: "🏢",
        enabled: true,
        routePaths: ["/vendors"],
        category: "Profiles",
      },
      customer: {
        id: "customer",
        name: "Customers & CRM",
        shortName: "Customers",
        description:
          "Client directory, customer tiers, contact channels, and purchase loyalty tracking.",
        icon: "👥",
        enabled: true,
        routePaths: ["/customers"],
        category: "Profiles",
      },
      employee: {
        id: "employee",
        name: "Employees & Staff",
        shortName: "Employees",
        description:
          "Staff directory, internal positions, branch facility assignments, and work attendance.",
        icon: "👔",
        enabled: true,
        routePaths: ["/employees"],
        category: "Profiles",
      },
    },
  },
  user: {
    id: "user",
    name: "User & Security",
    description:
      "Organizational user accounts, credentials, security roles, and granular RBAC permissions.",
    icon: "🛡️",
    enabled: true,
    features: {
      user: {
        id: "user",
        name: "User Accounts",
        shortName: "Users",
        description:
          "Manage organizational user credentials, active statuses, and profile identity linkages.",
        icon: "👤",
        enabled: true,
        routePaths: ["/users"],
        category: "User",
      },
      role: {
        id: "role",
        name: "Role Management",
        shortName: "Roles",
        description:
          "Define granular security profiles, access roles, and role hierarchy levels.",
        icon: "🛡️",
        enabled: true,
        routePaths: ["/roles"],
        category: "User",
      },
      permissions: {
        id: "permissions",
        name: "Permissions Matrix",
        shortName: "Permissions",
        description:
          "Table-level action privileges (create, read, update, delete, summary) and facility clearance.",
        icon: "🔐",
        enabled: true,
        routePaths: ["/roles"],
        category: "User",
      },
    },
  },
  product: {
    id: "product",
    name: "Product & Inventory",
    description:
      "Product catalog, multi-level recipe formulas, inventory stock ledger, and heavy equipment fleet.",
    icon: "📦",
    enabled: true,
    features: {
      product: {
        id: "product",
        name: "Products & Stock Ledger",
        shortName: "Products",
        description:
          "Product SKUs, retail pricing, category taxonomy, and real-time inventory adjustments.",
        icon: "📦",
        enabled: true,
        routePaths: ["/products", "/inventory"],
        category: "Product",
      },
      formula: {
        id: "formula",
        name: "Formulas & Recipes (BOM)",
        shortName: "Formulas",
        description:
          "Production formulas, ingredients bill of materials, and automated recursive stock deduction.",
        icon: "🧪",
        enabled: true,
        routePaths: ["/recipes"],
        category: "Product",
      },
      equipment: {
        id: "equipment",
        name: "Equipment & Machinery",
        shortName: "Equipment",
        description:
          "Heavy equipment fleet, machinery models, maintenance schedules, and asset tracking.",
        icon: "🚜",
        enabled: true,
        routePaths: ["/equipment"],
        category: "Product",
      },
    },
  },
  facility: {
    id: "facility",
    name: "Facility & Operations",
    description:
      "Physical facilities, store outlets, warehouses, section stations, and station display systems (KDS).",
    icon: "🏬",
    enabled: true,
    features: {
      facilities: {
        id: "facilities",
        name: "Facilities & Outlets",
        shortName: "Facilities",
        description:
          "Manage physical store outlets, warehouses, regional depots, and branch facilities.",
        icon: "🏬",
        enabled: true,
        routePaths: ["/facilities"],
        category: "Facility",
      },
      sections: {
        id: "sections",
        name: "Facility Sections & KDS",
        shortName: "Sections",
        description:
          "Kitchen & bar station routing display (KDS), section divisions, and preparation stations.",
        icon: "🍳",
        enabled: true,
        routePaths: ["/facility-sections"],
        category: "Facility",
      },
    },
  },
};

const CONFIG_DIR = path.resolve(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "modules.json");

function readModulesConfig(): SystemModulesConfig {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(DEFAULT_MODULES_CONFIG, null, 2),
        "utf-8"
      );
      return DEFAULT_MODULES_CONFIG;
    }
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_MODULES_CONFIG, ...parsed };
  } catch (err) {
    console.error("Error reading modules config:", err);
    return DEFAULT_MODULES_CONFIG;
  }
}

function writeModulesConfig(config: SystemModulesConfig) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving modules config:", err);
  }
}

export async function systemModuleRoutes(
  fastify: FastifyInstance,
  options: any
) {
  // GET /api/system/modules
  fastify.get(
    "/api/system/modules",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const config = readModulesConfig();
      return success(reply, config, "Module configuration retrieved successfully");
    }
  );

  // POST /api/system/modules/update
  fastify.post(
    "/api/system/modules/update",
    async (request: FastifyRequest<{ Body: SystemModulesConfig }>, reply: FastifyReply) => {
      const newConfig = request.body;
      if (!newConfig || typeof newConfig !== "object") {
        return reply.code(400).send({ error: "Invalid module configuration payload" });
      }
      writeModulesConfig(newConfig);
      return success(reply, newConfig, "Module configuration updated successfully");
    }
  );

  // POST /api/system/modules/toggle
  fastify.post(
    "/api/system/modules/toggle",
    async (
      request: FastifyRequest<{
        Body: {
          moduleId: "transaction" | "profiles" | "user" | "product" | "facility";
          featureId?: string;
          enabled: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { moduleId, featureId, enabled } = request.body;
      const current = readModulesConfig();

      if (!current[moduleId]) {
        return reply.code(404).send({ error: `Module '${moduleId}' not found` });
      }

      if (featureId) {
        // Toggle specific feature
        if (!current[moduleId].features[featureId]) {
          return reply
            .code(404)
            .send({ error: `Feature '${featureId}' not found in module '${moduleId}'` });
        }
        current[moduleId].features[featureId].enabled = enabled;
      } else {
        // Toggle entire module
        current[moduleId].enabled = enabled;
        // Optionally sync all features
        Object.keys(current[moduleId]!.features).forEach((fKey) => {
          if (current[moduleId]!.features[fKey]) {
            current[moduleId]!.features[fKey]!.enabled = enabled;
          }
        });
      }

      writeModulesConfig(current);
      return success(reply, current, "Module toggle applied successfully");
    }
  );

  // POST /api/system/modules/reset
  fastify.post(
    "/api/system/modules/reset",
    async (request: FastifyRequest, reply: FastifyReply) => {
      writeModulesConfig(DEFAULT_MODULES_CONFIG);
      return success(
        reply,
        DEFAULT_MODULES_CONFIG,
        "Module configuration reset to default"
      );
    }
  );
}
