export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface DiscountRecord {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  discountType: DiscountType;
  value: number | string;
  maxDiscountAmount?: number | string | null;
  minOrderAmount?: number | string | null;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxUsageCount?: number | null;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDiscountInput {
  name: string;
  code?: string | null;
  description?: string | null;
  discountType: DiscountType;
  value: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxUsageCount?: number | null;
}

export interface UpdateDiscountInput {
  id: number;
  name?: string;
  code?: string | null;
  description?: string | null;
  discountType?: DiscountType;
  value?: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxUsageCount?: number | null;
}

export interface ValidateDiscountResult {
  id: number;
  name: string;
  code?: string | null;
  discountType: DiscountType;
  value: number;
  discountAmount: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  expiresAt?: string | null;
  usageCount: number;
  maxUsageCount?: number | null;
}
