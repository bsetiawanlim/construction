import { z } from "zod";

export const positionSchema = z.object({
    id: z.number().nullish(),
    name: z.string().max(100),
    description: z.string().nullish(),
});

export type positionType = z.infer<typeof positionSchema>;

export const deletePositionSchema = z.object({
    id: z.number(),
});

export type deletePositionType = z.infer<typeof deletePositionSchema>;
