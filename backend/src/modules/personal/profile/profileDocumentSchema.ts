import z from "zod";

export const profileDocumentSchema = z.object({
    id: z.number().nullish(),
    profileId: z.number(),
    documentType: z.string(),
    documentPath: z.string(),
    documentName: z.string(),
    issueDate: z.preprocess((issueDate) => (issueDate === "" ? null : issueDate), z.coerce.date().nullish()),
    expiredDate: z.preprocess((expiredDate) => (expiredDate === "" ? null : expiredDate), z.coerce.date().nullish()),
})

export const deleteProfileDocumentSchema = z.object({
    id: z.number()
})

export const getProfileDocumentSchema = z.object({
    profileId: z.number()
})

export type ProfileDocumentType = z.infer<typeof profileDocumentSchema>;
export type deleteProfileDocumentType = z.infer<typeof deleteProfileDocumentSchema>;
export type getProfileDocumentType = z.infer<typeof getProfileDocumentSchema>;
