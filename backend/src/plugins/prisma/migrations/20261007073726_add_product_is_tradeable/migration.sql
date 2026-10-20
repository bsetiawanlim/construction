-- AlterTable
ALTER TABLE "product" ADD COLUMN "isTradeable" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "product_isTradeable_idx" ON "product"("isTradeable");
