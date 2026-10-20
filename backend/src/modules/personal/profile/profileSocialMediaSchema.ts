import { z } from "zod";

export const profileSocialMediaSchema = z.object({
    profileId: z.number().int().positive("Profile ID is required"),
    platform: z.string().min(1, "Platform is required").max(50),
    username: z.string().max(100).nullish(),
    url: z.string().min(1, "URL is required").max(500),
    notes: z.string().nullish(),
});

export const updateProfileSocialMediaSchema = z.object({
    id: z.number().int().positive("Social media ID is required"),
    platform: z.string().min(1).max(50).optional(),
    username: z.string().max(100).nullish(),
    url: z.string().min(1).max(500).optional(),
    notes: z.string().nullish(),
});

export const deleteProfileSocialMediaSchema = z.object({
    id: z.number().int().positive("Social media ID is required"),
});

export const getProfileSocialMediaSchema = z.object({
    profileId: z.number().int().positive("Profile ID is required"),
});

export type profileSocialMediaType = z.infer<typeof profileSocialMediaSchema>;
export type updateProfileSocialMediaType = z.infer<typeof updateProfileSocialMediaSchema>;
export type deleteProfileSocialMediaType = z.infer<typeof deleteProfileSocialMediaSchema>;
export type getProfileSocialMediaType = z.infer<typeof getProfileSocialMediaSchema>;
