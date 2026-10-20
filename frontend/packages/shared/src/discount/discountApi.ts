import type { ApiClient } from "../api/client";
import type { ApiSuccess, Paginated, PaginationParams } from "../api/types";
import type {
  DiscountRecord,
  CreateDiscountInput,
  UpdateDiscountInput,
  ValidateDiscountResult,
} from "./schemas";

export function createDiscountApi(client: ApiClient) {
  return {
    async listDiscounts(
      query?: PaginationParams & { search?: string; isActive?: boolean }
    ): Promise<Paginated<DiscountRecord>> {
      return client.list<DiscountRecord>("/api/discount/get-all", query as any);
    },

    async createDiscount(input: CreateDiscountInput): Promise<ApiSuccess<DiscountRecord>> {
      return client.post<DiscountRecord>("/api/discount/create", input);
    },

    async updateDiscount(input: UpdateDiscountInput): Promise<ApiSuccess<DiscountRecord>> {
      return client.post<DiscountRecord>("/api/discount/update", input);
    },

    async deleteDiscount(id: number): Promise<ApiSuccess<void>> {
      return client.post<void>("/api/discount/delete", { id });
    },

    async validateCode(
      code: string,
      orderSubtotal: number
    ): Promise<ApiSuccess<ValidateDiscountResult>> {
      return client.post<ValidateDiscountResult>("/api/discount/validate", {
        code,
        orderSubtotal,
      });
    },
  };
}
