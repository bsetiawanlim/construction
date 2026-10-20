export interface ScheduleRecord {
  id: number;
  employeeId: number;
  scheduleDate: string;   // ISO date string
  startTime: string;      // "HH:MM"
  endTime: string;        // "HH:MM"
  facilityId?: number | null;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  employee?: {
    id: number;
    profile?: {
      id: number;
      firstName: string;
      lastName?: string | null;
      isCompany?: boolean;
    } | null;
    position?: { id: number; name: string } | null;
  } | null;
  facility?: { id: number; facilityName: string; facilityCode: string } | null;
}

export interface CreateScheduleInput {
  employeeId: number;
  scheduleDate: string;   // YYYY-MM-DD
  startTime: string;      // HH:MM
  endTime: string;        // HH:MM
  facilityId?: number | null;
  notes?: string | null;
}

export interface UpdateScheduleInput {
  id: number;
  scheduleDate?: string;
  startTime?: string;
  endTime?: string;
  facilityId?: number | null;
  notes?: string | null;
  isActive?: boolean;
}
