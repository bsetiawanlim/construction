import type { ApiClient } from "../api/client";
import type { ApiSuccess, Paginated } from "../api/types";
import type { ScheduleRecord, CreateScheduleInput, UpdateScheduleInput } from "./schemas";

export function createScheduleApi(client: ApiClient) {
  return {
    async listSchedules(query?: {
      weekStart?: string;
      employeeId?: number;
      facilityId?: number;
      page?: number;
      limit?: number;
    }): Promise<Paginated<ScheduleRecord>> {
      return client.list<ScheduleRecord>("/api/schedule/get-all", query as any);
    },

    async createSchedule(input: CreateScheduleInput): Promise<ApiSuccess<ScheduleRecord>> {
      return client.post<ScheduleRecord>("/api/schedule/create", input);
    },

    async updateSchedule(input: UpdateScheduleInput): Promise<ApiSuccess<ScheduleRecord>> {
      return client.post<ScheduleRecord>("/api/schedule/update", input);
    },

    async deleteSchedule(id: number): Promise<ApiSuccess<void>> {
      return client.post<void>("/api/schedule/delete", { id });
    },
  };
}
