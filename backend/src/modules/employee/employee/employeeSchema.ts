import { z } from 'zod';

export const employmentTypeEnum = z.enum(['MONTHLY', 'BI_WEEKLY', 'WEEKLY', 'DAILY', 'HOURLY', 'CONTRACT']);
export type EmploymentType = z.infer<typeof employmentTypeEnum>;

export const payrollFrequencyEnum = z.enum(['hourly', 'daily', 'weekly', 'biWeekly', 'monthly']);
export type PayrollFrequency = z.infer<typeof payrollFrequencyEnum>;

export const employeeSchema = z.object({
    id: z.number().nullish(),
    profileId: z.number().nullish(),
    firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    positionId: z.number().nullish(),
    facilityId: z.number().nullish(),
    employmentType: employmentTypeEnum.default('MONTHLY').optional(),
    salaryBasis: payrollFrequencyEnum.default('monthly').nullish(),
    payFrequency: payrollFrequencyEnum.default('monthly').nullish(),
    hourlyRate: z.number().min(0).nullish(),
    dailyRate: z.number().min(0).nullish(),
    weeklyRate: z.number().min(0).nullish(),
    biWeeklyRate: z.number().min(0).nullish(),
    monthlySalary: z.number().min(0).nullish(),
    contractRate: z.number().min(0).nullish(),
    startDate: z.preprocess((val) => (val === "" ? null : val), z.coerce.date().nullish()),
    endDate: z.preprocess((val) => (val === "" ? null : val), z.coerce.date().nullish()),
    departReason: z.string().nullish(),
});

export const deleteEmployeeSchema = z.object({
    id: z.number(),
    departReason: z.string().nullish(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type DeleteEmployeeInput = z.infer<typeof deleteEmployeeSchema>;

export type employeeType = EmployeeInput;
export type deleteEmployeeType = DeleteEmployeeInput;

