/*
  Warnings:

  - You are about to drop the column `userId` on the `profile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "employee" DROP CONSTRAINT "employee_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "equipmentBrand" DROP CONSTRAINT "equipmentBrand_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "equipmentEntity" DROP CONSTRAINT "equipmentEntity_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "equipmentFeature" DROP CONSTRAINT "equipmentFeature_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "equipmentMaintenance" DROP CONSTRAINT "equipmentMaintenance_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "equipmentModel" DROP CONSTRAINT "equipmentModel_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "equipmentModelFeature" DROP CONSTRAINT "equipmentModelFeature_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "equipmentPart" DROP CONSTRAINT "equipmentPart_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "equipmentType" DROP CONSTRAINT "equipmentType_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "item" DROP CONSTRAINT "item_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "monetaryAccount" DROP CONSTRAINT "monetaryAccount_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "monetaryTransaction" DROP CONSTRAINT "monetaryTransaction_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "monetaryTransactionReference" DROP CONSTRAINT "monetaryTransactionReference_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "permission" DROP CONSTRAINT "permission_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "productAttribute" DROP CONSTRAINT "productAttribute_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "productAttributeValue" DROP CONSTRAINT "productAttributeValue_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "productCategory" DROP CONSTRAINT "productCategory_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "productImage" DROP CONSTRAINT "productImage_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "productInventory" DROP CONSTRAINT "productInventory_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "productPrice" DROP CONSTRAINT "productPrice_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "profile" DROP CONSTRAINT "profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "purchaseOrder" DROP CONSTRAINT "purchaseOrder_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "purchaseOrderProduct" DROP CONSTRAINT "purchaseOrderProduct_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "request" DROP CONSTRAINT "request_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "requestProduct" DROP CONSTRAINT "requestProduct_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "requestSource" DROP CONSTRAINT "requestSource_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "rfq" DROP CONSTRAINT "rfq_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "rfqProduct" DROP CONSTRAINT "rfqProduct_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "role" DROP CONSTRAINT "role_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "unit" DROP CONSTRAINT "unit_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "work" DROP CONSTRAINT "work_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "workEquipment" DROP CONSTRAINT "workEquipment_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "workItem" DROP CONSTRAINT "workItem_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "workOffer" DROP CONSTRAINT "workOffer_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "workOfferItem" DROP CONSTRAINT "workOfferItem_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "workWorker" DROP CONSTRAINT "workWorker_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "worker" DROP CONSTRAINT "worker_updatedBy_fkey";

-- DropIndex
DROP INDEX "profile_userId_key";

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "employee" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipmentBrand" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipmentEntity" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipmentFeature" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipmentMaintenance" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipmentModel" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipmentModelFeature" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipmentPart" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipmentType" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "item" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "monetaryAccount" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "monetaryTransaction" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "monetaryTransactionReference" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "permission" ALTER COLUMN "updatedBy" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "productAttribute" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "productAttributeValue" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "productCategory" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "productImage" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "productInventory" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "productPrice" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "profile" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "purchaseOrder" ALTER COLUMN "updatedBy" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "purchaseOrderProduct" ALTER COLUMN "updatedBy" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "request" ALTER COLUMN "updatedBy" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "requestProduct" ALTER COLUMN "updatedBy" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "requestSource" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "rfq" ALTER COLUMN "updatedBy" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "rfqProduct" ALTER COLUMN "updatedBy" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "role" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "unit" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "profileId" INTEGER,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "work" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workEquipment" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workItem" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workOffer" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workOfferItem" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workWorker" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "worker" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentEntity" ADD CONSTRAINT "equipmentEntity_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentType" ADD CONSTRAINT "equipmentType_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentBrand" ADD CONSTRAINT "equipmentBrand_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentModel" ADD CONSTRAINT "equipmentModel_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentModelFeature" ADD CONSTRAINT "equipmentModelFeature_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentFeature" ADD CONSTRAINT "equipmentFeature_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentMaintenance" ADD CONSTRAINT "equipmentMaintenance_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentPart" ADD CONSTRAINT "equipmentPart_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryAccount" ADD CONSTRAINT "monetaryAccount_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryTransaction" ADD CONSTRAINT "monetaryTransaction_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryTransactionReference" ADD CONSTRAINT "monetaryTransactionReference_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqProduct" ADD CONSTRAINT "rfqProduct_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrder" ADD CONSTRAINT "purchaseOrder_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrderProduct" ADD CONSTRAINT "purchaseOrderProduct_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productCategory" ADD CONSTRAINT "productCategory_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productAttribute" ADD CONSTRAINT "productAttribute_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productAttributeValue" ADD CONSTRAINT "productAttributeValue_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productPrice" ADD CONSTRAINT "productPrice_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productImage" ADD CONSTRAINT "productImage_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productInventory" ADD CONSTRAINT "productInventory_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestProduct" ADD CONSTRAINT "requestProduct_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestSource" ADD CONSTRAINT "requestSource_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "permission_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker" ADD CONSTRAINT "worker_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work" ADD CONSTRAINT "work_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workItem" ADD CONSTRAINT "workItem_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workWorker" ADD CONSTRAINT "workWorker_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workEquipment" ADD CONSTRAINT "workEquipment_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workOffer" ADD CONSTRAINT "workOffer_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workOfferItem" ADD CONSTRAINT "workOfferItem_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
