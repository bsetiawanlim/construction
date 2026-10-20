-- CreateEnum
CREATE TYPE "wasteReason" AS ENUM ('EXPIRED', 'SPOILED', 'LOST', 'DAMAGED', 'SCRAP', 'OTHER');

-- CreateTable
CREATE TABLE "productWaste" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "facilityId" INTEGER,
    "sectionId" INTEGER,
    "quantity" DECIMAL(20,4) NOT NULL,
    "unitCost" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "reason" "wasteReason" NOT NULL,
    "notes" TEXT,
    "wasteDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "productWaste_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "productWaste_productId_idx" ON "productWaste"("productId");

-- CreateIndex
CREATE INDEX "productWaste_facilityId_idx" ON "productWaste"("facilityId");

-- CreateIndex
CREATE INDEX "productWaste_sectionId_idx" ON "productWaste"("sectionId");

-- CreateIndex
CREATE INDEX "productWaste_reason_idx" ON "productWaste"("reason");

-- CreateIndex
CREATE INDEX "productWaste_wasteDate_idx" ON "productWaste"("wasteDate");

-- AddForeignKey
ALTER TABLE "productWaste" ADD CONSTRAINT "productWaste_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productWaste" ADD CONSTRAINT "productWaste_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productWaste" ADD CONSTRAINT "productWaste_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "facilitySection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productWaste" ADD CONSTRAINT "productWaste_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productWaste" ADD CONSTRAINT "productWaste_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
