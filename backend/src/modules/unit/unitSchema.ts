import { z } from "zod";

export const baseQuantity = {
    length: { unit: "meter", abbr: "m" },
    weight: { unit: "kilogram", abbr: "kg" },
    temperature: { unit: "celsius", abbr: "°c" },
    time: { unit: "second", abbr: "s" },
    amountOfSubstance: { unit: "mole", abbr: "mol" },
    electricCurrent: { unit: "ampere", abbr: "A" },
    luminousIntensity: { unit: "candela", abbr: "cd" },
    amount: { unit: "piece", abbr: "pc" }
} as const;

export const derivedQuantity = {
    velocity: { unit: "meter per second", abbr: "m/s", baseQuantity: ["length", "time"] },
    volume: { unit: "meter cube", abbr: "m^3", baseQuantity: ["length"] }
} as const;

export const unitSchema = z.object({
    id: z.number().int().positive().nullish(),
    baseQuantity: z.string().min(1, "baseQuantity is required"),
    unit: z.string().min(1, "unit is required"),
    abbr: z.string().min(1, "abbr is required"),
    toBase: z.string().min(1, "toBase is required"),
    fromBase: z.string().min(1, "fromBase is required"),
    description: z.string().nullish(),
});

export const getUnitByQuantitySchema = z.object({
    baseQuantity: z.string().min(1, "baseQuantity is required"),
});

export const convertUnitSchema = z.object({
    unitId1: z.number().int().positive("unitId1 is required"),
    unitId2: z.number().int().positive("unitId2 is required"),
    value: z.number(),
});

export const deleteUnitSchema = z.object({
    id: z.number().int().positive("id is required"),
});

export type UnitType = z.infer<typeof unitSchema>;
export type unitType = UnitType; // backward compatibility
export type GetUnitByQuantityType = z.infer<typeof getUnitByQuantitySchema>;
export type ConvertUnitType = z.infer<typeof convertUnitSchema>;
export type DeleteUnitType = z.infer<typeof deleteUnitSchema>;
