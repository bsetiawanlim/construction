import type { ApiClient } from "../api/client";
import type { ApiSuccess, Paginated } from "../api/types";
import type { ShiftRecord, OpenShiftInput, CloseShiftInput } from "./schemas";

export function createShiftApi(client: ApiClient) {
  return {
    async openShift(input: OpenShiftInput): Promise<ApiSuccess<ShiftRecord>> {
      return client.post<ShiftRecord>("/api/shift/open", input);
    },

    async closeShift(input: CloseShiftInput): Promise<ApiSuccess<ShiftRecord>> {
      return client.post<ShiftRecord>("/api/shift/close", input);
    },

    async getCurrentShift(): Promise<ApiSuccess<ShiftRecord | null>> {
      return client.get<ShiftRecord | null>("/api/shift/current");
    },

    async listShifts(query?: { page?: number; limit?: number; facilityId?: number; openOnly?: boolean; startDate?: string; endDate?: string }): Promise<Paginated<ShiftRecord>> {
      return client.list<ShiftRecord>("/api/shift/get-all", query as any);
    },
  };
}
