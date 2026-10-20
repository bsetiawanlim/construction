-- AlterTable
ALTER TABLE "product" ADD COLUMN     "parentProductId" INTEGER;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_parentProductId_fkey" FOREIGN KEY ("parentProductId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
