-- AlterTable
ALTER TABLE "product" ADD COLUMN "isLowStockAlertEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "product_isLowStockAlertEnabled_idx" ON "product"("isLowStockAlertEnabled");
