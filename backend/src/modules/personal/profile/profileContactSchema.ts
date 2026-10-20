import z from "zod"

export const profileContactSchema = z.object({
    id: z.number().nullish(),
    profileId: z.number(),
    contactPersonId: z.number(),
    position: z.string().nullish()
})

export const deleteProfileContactSchema = z.object({
    id: z.number()
})

export const getProfileContactSchema = z.object({
    profileId: z.number()
})

export type profileContactType = z.infer<typeof profileContactSchema>
export type deleteProfileContactType = z.infer<typeof deleteProfileContactSchema>
export type getProfileContactType = z.infer<typeof getProfileContactSchema>
