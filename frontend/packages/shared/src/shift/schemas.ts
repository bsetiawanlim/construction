export interface ShiftRecord {
  id: number;
  openedBy: string;
  closedBy?: string | null;
  openedAt: string;
  closedAt?: string | null;
  openingCash: number | string;
  closingCash?: number | string | null;
  expectedCash?: number | string | null;
  cashVariance?: number | string | null;
  totalSales?: number | string | null;
  totalOrders?: number | null;
  totalCash?: number | string | null;
  totalCard?: number | string | null;
  totalTransfer?: number | string | null;
  totalEwallet?: number | string | null;
  notes?: string | null;
  facilityId?: number | null;
  openedByUser?: { id: string; name?: string | null; email?: string | null } | null;
  closedByUser?: { id: string; name?: string | null; email?: string | null } | null;
  facility?: { id: number; facilityName: string; facilityCode: string } | null;
}

export interface OpenShiftInput {
  openingCash: number;
  facilityId?: number | null;
  notes?: string | null;
}

export interface CloseShiftInput {
  closingCash: number;
  notes?: string | null;
}
