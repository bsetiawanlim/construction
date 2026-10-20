export interface EmployeeLaborItem {
  id: string;
  positionId?: number;
  employeeId?: number;
  roleOrName: string;
  hours: number;
  hourlyRate?: number;
  notes?: string;
}

export interface EquipmentUsageItem {
  id: string;
  equipmentId?: number;
  equipmentName: string;
  hours: number;
  hourlyRate?: number;
  notes?: string;
}

export interface RecipeMetaSpecification {
  version?: number;
  instructions?: string;
  labor: EmployeeLaborItem[];
  equipment: EquipmentUsageItem[];
}

export function parseRecipeMeta(rawDescription?: string | null): {
  cleanDescription: string;
  meta: RecipeMetaSpecification;
} {
  const defaultMeta: RecipeMetaSpecification = {
    version: 1,
    instructions: "",
    labor: [],
    equipment: [],
  };

  if (!rawDescription) {
    return { cleanDescription: "", meta: defaultMeta };
  }

  const markerStart = "---RECIPE_SPEC_START---";
  const markerEnd = "---RECIPE_SPEC_END---";
  const startIndex = rawDescription.indexOf(markerStart);
  const endIndex = rawDescription.indexOf(markerEnd);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const cleanDescription = rawDescription.substring(0, startIndex).trim();
    const jsonStr = rawDescription
      .substring(startIndex + markerStart.length, endIndex)
      .trim();
    try {
      const parsed = JSON.parse(jsonStr);
      return {
        cleanDescription,
        meta: {
          version: parsed.version || 1,
          instructions: parsed.instructions || "",
          labor: Array.isArray(parsed.labor) ? parsed.labor : [],
          equipment: Array.isArray(parsed.equipment) ? parsed.equipment : [],
        },
      };
    } catch {
      return { cleanDescription: rawDescription, meta: defaultMeta };
    }
  }

  return { cleanDescription: rawDescription, meta: defaultMeta };
}
