export type PayrollFrequency = "hourly" | "daily" | "weekly" | "biWeekly" | "monthly";

export const PAYROLL_CONSTANTS = {
    HOURS_PER_DAY: 8,
    DAYS_PER_WEEK: 5,
    HOURS_PER_WEEK: 40,
    WEEKS_PER_YEAR: 52,
    BIWEEKS_PER_YEAR: 26,
    MONTHS_PER_YEAR: 12,
    WEEKS_PER_MONTH: 52 / 12,           // ~4.3333
    BIWEEKS_PER_MONTH: 26 / 12,         // ~2.1667
    WORKING_DAYS_PER_MONTH: (52 * 5) / 12,   // ~21.6667
    WORKING_HOURS_PER_MONTH: (52 * 40) / 12, // ~173.3333
};

export interface EmployeeRatesInput {
    hourlyRate?: number | null;
    dailyRate?: number | null;
    weeklyRate?: number | null;
    biWeeklyRate?: number | null;
    monthlySalary?: number | null;
    contractRate?: number | null;
}

export interface AttendanceInput {
    attendedDays?: number;
    loggedHours?: number;
}

export interface CalculateBaseSalaryInput {
    salaryBasis: PayrollFrequency;
    payFrequency: PayrollFrequency;
    rates: EmployeeRatesInput;
    attendance?: AttendanceInput;
}

/**
 * Normalizes rates to ensure a value exists for the requested basis.
 * If the exact rate is not populated, derives it using standard working baselines.
 */
export function resolveRateForBasis(basis: PayrollFrequency, rates: EmployeeRatesInput): number {
    const rawHourly = rates.hourlyRate ? Number(rates.hourlyRate) : 0;
    const rawDaily = rates.dailyRate ? Number(rates.dailyRate) : 0;
    const rawWeekly = rates.weeklyRate ? Number(rates.weeklyRate) : 0;
    const rawBiWeekly = rates.biWeeklyRate ? Number(rates.biWeeklyRate) : 0;
    const rawMonthly = rates.monthlySalary ? Number(rates.monthlySalary) : 0;

    switch (basis) {
        case "hourly":
            if (rawHourly > 0) return rawHourly;
            if (rawDaily > 0) return rawDaily / PAYROLL_CONSTANTS.HOURS_PER_DAY;
            if (rawWeekly > 0) return rawWeekly / PAYROLL_CONSTANTS.HOURS_PER_WEEK;
            if (rawBiWeekly > 0) return rawBiWeekly / (PAYROLL_CONSTANTS.HOURS_PER_WEEK * 2);
            if (rawMonthly > 0) return rawMonthly / PAYROLL_CONSTANTS.WORKING_HOURS_PER_MONTH;
            return 0;

        case "daily":
            if (rawDaily > 0) return rawDaily;
            if (rawHourly > 0) return rawHourly * PAYROLL_CONSTANTS.HOURS_PER_DAY;
            if (rawWeekly > 0) return rawWeekly / PAYROLL_CONSTANTS.DAYS_PER_WEEK;
            if (rawBiWeekly > 0) return rawBiWeekly / (PAYROLL_CONSTANTS.DAYS_PER_WEEK * 2);
            if (rawMonthly > 0) return rawMonthly / PAYROLL_CONSTANTS.WORKING_DAYS_PER_MONTH;
            return 0;

        case "weekly":
            if (rawWeekly > 0) return rawWeekly;
            if (rawBiWeekly > 0) return rawBiWeekly / 2;
            if (rawDaily > 0) return rawDaily * PAYROLL_CONSTANTS.DAYS_PER_WEEK;
            if (rawHourly > 0) return rawHourly * PAYROLL_CONSTANTS.HOURS_PER_WEEK;
            if (rawMonthly > 0) return (rawMonthly * PAYROLL_CONSTANTS.MONTHS_PER_YEAR) / PAYROLL_CONSTANTS.WEEKS_PER_YEAR;
            return 0;

        case "biWeekly":
            if (rawBiWeekly > 0) return rawBiWeekly;
            if (rawWeekly > 0) return rawWeekly * 2;
            if (rawMonthly > 0) return (rawMonthly * PAYROLL_CONSTANTS.MONTHS_PER_YEAR) / PAYROLL_CONSTANTS.BIWEEKS_PER_YEAR;
            if (rawDaily > 0) return rawDaily * PAYROLL_CONSTANTS.DAYS_PER_WEEK * 2;
            if (rawHourly > 0) return rawHourly * PAYROLL_CONSTANTS.HOURS_PER_WEEK * 2;
            return 0;

        case "monthly":
        default:
            if (rawMonthly > 0) return rawMonthly;
            if (rawBiWeekly > 0) return (rawBiWeekly * PAYROLL_CONSTANTS.BIWEEKS_PER_YEAR) / PAYROLL_CONSTANTS.MONTHS_PER_YEAR;
            if (rawWeekly > 0) return (rawWeekly * PAYROLL_CONSTANTS.WEEKS_PER_YEAR) / PAYROLL_CONSTANTS.MONTHS_PER_YEAR;
            if (rawDaily > 0) return rawDaily * PAYROLL_CONSTANTS.WORKING_DAYS_PER_MONTH;
            if (rawHourly > 0) return rawHourly * PAYROLL_CONSTANTS.WORKING_HOURS_PER_MONTH;
            return 0;
    }
}

/**
 * Calculates base salary based on the chosen salaryBasis and payFrequency.
 * Follows the Attendance-Strict rule:
 * - Hourly and Daily strictly use attendance logs.
 * - Weekly, Bi-Weekly, and Monthly use fixed cycle ratios.
 */
export function calculateBaseSalary(input: CalculateBaseSalaryInput): {
    baseSalary: number;
    resolvedRate: number;
    unitsApplied: number;
    unitLabel: string;
} {
    const { salaryBasis, payFrequency, rates, attendance = {} } = input;
    const attendedDays = Math.max(0, attendance.attendedDays ?? 0);
    const loggedHours = Math.max(0, attendance.loggedHours ?? 0);

    const resolvedRate = resolveRateForBasis(salaryBasis, rates);

    // Case 1: Counted Hourly -> strictly uses attendance hours
    if (salaryBasis === "hourly") {
        const unitsApplied = loggedHours;
        const baseSalary = resolvedRate * unitsApplied;
        return {
            baseSalary: Math.max(0, baseSalary),
            resolvedRate,
            unitsApplied,
            unitLabel: "hours",
        };
    }

    // Case 2: Counted Daily -> strictly uses attendance logs
    if (salaryBasis === "daily") {
        if (payFrequency === "hourly") {
            const hourlyEquiv = resolvedRate / PAYROLL_CONSTANTS.HOURS_PER_DAY;
            const unitsApplied = loggedHours;
            const baseSalary = hourlyEquiv * unitsApplied;
            return {
                baseSalary: Math.max(0, baseSalary),
                resolvedRate: hourlyEquiv,
                unitsApplied,
                unitLabel: "hours",
            };
        }
        const unitsApplied = attendedDays;
        const baseSalary = resolvedRate * unitsApplied;
        return {
            baseSalary: Math.max(0, baseSalary),
            resolvedRate,
            unitsApplied,
            unitLabel: "days",
        };
    }

    // Case 3: Counted Weekly -> fixed cycle ratios (or attendance if paid daily/hourly)
    if (salaryBasis === "weekly") {
        switch (payFrequency) {
            case "weekly":
                return { baseSalary: resolvedRate, resolvedRate, unitsApplied: 1, unitLabel: "week" };
            case "biWeekly":
                return { baseSalary: resolvedRate * 2, resolvedRate, unitsApplied: 2, unitLabel: "weeks" };
            case "monthly":
                return { baseSalary: resolvedRate * PAYROLL_CONSTANTS.WEEKS_PER_MONTH, resolvedRate, unitsApplied: PAYROLL_CONSTANTS.WEEKS_PER_MONTH, unitLabel: "weeks" };
            case "daily": {
                const dailyEquiv = resolvedRate / PAYROLL_CONSTANTS.DAYS_PER_WEEK;
                const unitsApplied = attendedDays > 0 ? attendedDays : 1;
                return { baseSalary: dailyEquiv * unitsApplied, resolvedRate: dailyEquiv, unitsApplied, unitLabel: "days" };
            }
            case "hourly": {
                const hourlyEquiv = resolvedRate / PAYROLL_CONSTANTS.HOURS_PER_WEEK;
                const unitsApplied = loggedHours > 0 ? loggedHours : PAYROLL_CONSTANTS.HOURS_PER_DAY;
                return { baseSalary: hourlyEquiv * unitsApplied, resolvedRate: hourlyEquiv, unitsApplied, unitLabel: "hours" };
            }
        }
    }

    // Case 4: Counted Bi-Weekly -> fixed cycle ratios (or attendance if paid daily/hourly)
    if (salaryBasis === "biWeekly") {
        switch (payFrequency) {
            case "biWeekly":
                return { baseSalary: resolvedRate, resolvedRate, unitsApplied: 1, unitLabel: "bi-week" };
            case "weekly":
                return { baseSalary: resolvedRate / 2, resolvedRate, unitsApplied: 0.5, unitLabel: "bi-week" };
            case "monthly":
                return { baseSalary: resolvedRate * PAYROLL_CONSTANTS.BIWEEKS_PER_MONTH, resolvedRate, unitsApplied: PAYROLL_CONSTANTS.BIWEEKS_PER_MONTH, unitLabel: "bi-weeks" };
            case "daily": {
                const dailyEquiv = resolvedRate / (PAYROLL_CONSTANTS.DAYS_PER_WEEK * 2);
                const unitsApplied = attendedDays > 0 ? attendedDays : 1;
                return { baseSalary: dailyEquiv * unitsApplied, resolvedRate: dailyEquiv, unitsApplied, unitLabel: "days" };
            }
            case "hourly": {
                const hourlyEquiv = resolvedRate / (PAYROLL_CONSTANTS.HOURS_PER_WEEK * 2);
                const unitsApplied = loggedHours > 0 ? loggedHours : PAYROLL_CONSTANTS.HOURS_PER_DAY;
                return { baseSalary: hourlyEquiv * unitsApplied, resolvedRate: hourlyEquiv, unitsApplied, unitLabel: "hours" };
            }
        }
    }

    // Case 5: Counted Monthly -> fixed cycle ratios (or attendance if paid daily/hourly)
    // (default)
    switch (payFrequency) {
        case "monthly":
            return { baseSalary: resolvedRate, resolvedRate, unitsApplied: 1, unitLabel: "month" };
        case "biWeekly":
            return {
                baseSalary: resolvedRate / PAYROLL_CONSTANTS.BIWEEKS_PER_MONTH,
                resolvedRate,
                unitsApplied: 1 / PAYROLL_CONSTANTS.BIWEEKS_PER_MONTH,
                unitLabel: "months",
            };
        case "weekly":
            return {
                baseSalary: resolvedRate / PAYROLL_CONSTANTS.WEEKS_PER_MONTH,
                resolvedRate,
                unitsApplied: 1 / PAYROLL_CONSTANTS.WEEKS_PER_MONTH,
                unitLabel: "months",
            };
        case "daily": {
            const dailyEquiv = resolvedRate / PAYROLL_CONSTANTS.WORKING_DAYS_PER_MONTH;
            const unitsApplied = attendedDays > 0 ? attendedDays : 1;
            return { baseSalary: dailyEquiv * unitsApplied, resolvedRate: dailyEquiv, unitsApplied, unitLabel: "days" };
        }
        case "hourly": {
            const hourlyEquiv = resolvedRate / PAYROLL_CONSTANTS.WORKING_HOURS_PER_MONTH;
            const unitsApplied = loggedHours > 0 ? loggedHours : PAYROLL_CONSTANTS.HOURS_PER_DAY;
            return { baseSalary: hourlyEquiv * unitsApplied, resolvedRate: hourlyEquiv, unitsApplied, unitLabel: "hours" };
        }
    }
}

export interface ComponentInput {
    id: number;
    type: "basic" | "allowance" | "deduction";
    calculationType: "percentage" | "fixedAmount" | "perDay" | "perHour";
    amount: number;
}

export interface PayrollCalculationResult {
    basicSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
    details: {
        componentId: number;
        amount: number;
    }[];
}

/**
 * Calculates payroll components, totals, and net salary.
 * Percentage components calculate off the resolved basicSalary.
 * perDay and perHour components scale by provided attendance metrics.
 */
export function calculateSalary(
    components: ComponentInput[],
    attendance?: AttendanceInput
): PayrollCalculationResult {
    let basicSalary = 0;
    const details: { componentId: number; amount: number }[] = [];
    const attendedDays = attendance?.attendedDays ?? 0;
    const loggedHours = attendance?.loggedHours ?? 0;

    // Find basic salary first
    const basicComponent = components.find((c) => c.type === "basic");
    if (basicComponent) {
        basicSalary = Math.max(0, basicComponent.amount);
        details.push({
            componentId: basicComponent.id,
            amount: basicSalary,
        });
    }

    let totalAllowances = 0;
    let totalDeductions = 0;

    for (const comp of components) {
        if (comp.type === "basic") continue;

        let computedAmount = 0;
        if (comp.calculationType === "percentage") {
            computedAmount = (comp.amount / 100) * basicSalary;
        } else if (comp.calculationType === "perDay") {
            computedAmount = comp.amount * attendedDays;
        } else if (comp.calculationType === "perHour") {
            computedAmount = comp.amount * loggedHours;
        } else {
            computedAmount = comp.amount;
        }
        computedAmount = Math.max(0, computedAmount);

        details.push({
            componentId: comp.id,
            amount: computedAmount,
        });

        if (comp.type === "allowance") {
            totalAllowances += computedAmount;
        } else if (comp.type === "deduction") {
            totalDeductions += computedAmount;
        }
    }

    const netSalary = Math.max(0, basicSalary + totalAllowances - totalDeductions);

    return {
        basicSalary,
        totalAllowances,
        totalDeductions,
        netSalary,
        details,
    };
}

