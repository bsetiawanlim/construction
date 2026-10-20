-- DropIndex
DROP INDEX "product_isTradeable_idx";

-- CreateTable
CREATE TABLE "equipmentPrice" (
    "id" SERIAL NOT NULL,
    "equipmentEntityId" INTEGER NOT NULL,
    "priceType" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "equipmentPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipmentPrice_equipmentEntityId_idx" ON "equipmentPrice"("equipmentEntityId");

-- AddForeignKey
ALTER TABLE "equipmentPrice" ADD CONSTRAINT "equipmentPrice_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentPrice" ADD CONSTRAINT "equipmentPrice_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentPrice" ADD CONSTRAINT "equipmentPrice_equipmentEntityId_fkey" FOREIGN KEY ("equipmentEntityId") REFERENCES "equipmentEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
