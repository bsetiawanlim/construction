-- CreateTable
CREATE TABLE "vendorProduct" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "vendorSku" VARCHAR(100),
    "vendorPrice" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "leadTimeDays" INTEGER,
    "minOrderQuantity" INTEGER,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "vendorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendorProduct_vendorId_idx" ON "vendorProduct"("vendorId");

-- CreateIndex
CREATE INDEX "vendorProduct_productId_idx" ON "vendorProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "vendorProduct_vendorId_productId_key" ON "vendorProduct"("vendorId", "productId");

-- AddForeignKey
ALTER TABLE "vendorProduct" ADD CONSTRAINT "vendorProduct_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorProduct" ADD CONSTRAINT "vendorProduct_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorProduct" ADD CONSTRAINT "vendorProduct_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorProduct" ADD CONSTRAINT "vendorProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
