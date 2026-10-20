import { z } from 'zod';

export const profileSchema = z.object({
    id: z.number().nullish(),
    title: z.preprocess((title) => (title === "" ? null : title), z.string().nullish()),
    firstName: z.string().min(3, "First name has to be at least 3 characters long."),
    lastName: z.preprocess((lastName) => (lastName === "" ? null : lastName), z.string().nullish()),
    email: z.preprocess((email) => (email === "" ? null : email), z.string().nullish()),
    dateOfBirth: z.preprocess((dateOfBirth) => (dateOfBirth === "" ? null : dateOfBirth), z.coerce.date().nullish()),
    address: z.preprocess((address) => (address === "" ? null : address), z.string().nullish()),
    city: z.preprocess((city) => (city === "" ? null : city), z.string().nullish()),
    province: z.preprocess((province) => (province === "" ? null : province), z.string().nullish()),
    postalCode: z.preprocess((postalCode) => (postalCode === "" ? null : postalCode), z.string().nullish()),
    country: z.preprocess((country) => (country === "" ? null : country), z.string().default("Indonesia").nullish()),
    isCompany: z.preprocess((isCompany) => (isCompany === "" ? false : isCompany), z.coerce.boolean().default(false)),
    socialId: z.preprocess((socialId) => (socialId === "" ? null : socialId), z.string().nullish()),
    taxId: z.preprocess((taxId) => (taxId === "" ? null : taxId), z.string().nullish()),
    gender: z.preprocess((gender) => (gender === "" ? null : gender), z.string().nullish()),
    phoneNumber: z.preprocess((phoneNumber) => (phoneNumber === "" ? null : phoneNumber), z.string().nullish()),
    phoneNumberVerified: z.preprocess((phoneNumberVerified) => (phoneNumberVerified === "" ? null : phoneNumberVerified), z.coerce.boolean().default(false).nullish()),
    whatsapp: z.preprocess((whatsapp) => (whatsapp === "" ? null : whatsapp), z.string().nullish()),
    whatsappVerified: z.preprocess((whatsappVerified) => (whatsappVerified === "" ? null : whatsappVerified), z.coerce.boolean().default(false).nullish()),
    notes: z.preprocess((notes) => (notes === "" ? null : notes), z.string().nullish()),
    user: z.object({
        email: z.preprocess((email) => (email === "" ? null : email), z.string().nullish()),
        password: z.preprocess((password) => (password === "" ? null : password), z.string().nullish())
    }).nullish(),
    socialMedia: z.array(z.object({
        platform: z.string(),
        username: z.string().nullish(),
        url: z.string(),
        notes: z.string().nullish()
    })).nullish()
});

export const deleteProfileSchema = z.object({
    profileId: z.number(),
});

export type profileType = z.infer<typeof profileSchema>;
export type deleteProfileType = z.infer<typeof deleteProfileSchema>;