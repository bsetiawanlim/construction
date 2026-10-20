-- CreateTable
CREATE TABLE "facilityTable" (
    "id" SERIAL NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "tableNumber" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100),
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "status" VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    "qrCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "facilityTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facilityTable_facilityId_tableNumber_key" ON "facilityTable"("facilityId", "tableNumber");
CREATE INDEX "facilityTable_facilityId_idx" ON "facilityTable"("facilityId");
CREATE INDEX "facilityTable_sectionId_idx" ON "facilityTable"("sectionId");
CREATE INDEX "facilityTable_tableNumber_idx" ON "facilityTable"("tableNumber");
CREATE INDEX "facilityTable_status_idx" ON "facilityTable"("status");
CREATE INDEX "facilityTable_isActive_idx" ON "facilityTable"("isActive");

-- AddForeignKey
ALTER TABLE "facilityTable" ADD CONSTRAINT "facilityTable_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "facilityTable" ADD CONSTRAINT "facilityTable_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "facilitySection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "facilityTable" ADD CONSTRAINT "facilityTable_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facilityTable" ADD CONSTRAINT "facilityTable_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
