/*
  Warnings:

  - You are about to drop the column `unit` on the `equipmentEntity` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `equipmentFeature` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `equipmentMaintenance` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `equipmentModelFeature` table. All the data in the column will be lost.
  - You are about to drop the column `lifeSpanUnit` on the `equipmentPart` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `item` table. All the data in the column will be lost.
  - You are about to drop the column `currencyId` on the `monetaryTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `purchaseOrderProduct` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `request` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `requestProduct` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `rfqProduct` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `work` table. All the data in the column will be lost.
  - The primary key for the `workEquipment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discountedPrice` on the `workOffer` table. All the data in the column will be lost.
  - You are about to drop the column `totalWithProfit` on the `workOffer` table. All the data in the column will be lost.
  - You are about to drop the column `totalWithTax` on the `workOffer` table. All the data in the column will be lost.
  - The `status` column on the `workOffer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `discountAmount` on the `workOffer` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,2)` to `Decimal(20,4)`.
  - You are about to alter the column `overHeadPercentage` on the `workOffer` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,2)` to `Decimal(10,4)`.
  - You are about to alter the column `overHeadAmount` on the `workOffer` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,2)` to `Decimal(20,4)`.
  - You are about to alter the column `profitPercentage` on the `workOffer` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,2)` to `Decimal(10,4)`.
  - You are about to alter the column `profitAmount` on the `workOffer` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,2)` to `Decimal(20,4)`.
  - You are about to alter the column `taxPercentage` on the `workOffer` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,2)` to `Decimal(10,4)`.
  - You are about to alter the column `taxAmount` on the `workOffer` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,2)` to `Decimal(20,4)`.
  - The primary key for the `workWorker` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `unit` on the `worker` table. All the data in the column will be lost.
  - You are about to drop the `equipment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roleId,tableName,actionName]` on the table `permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workId,equipmentId]` on the table `workEquipment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workId,itemId]` on the table `workItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[offerNumber]` on the table `workOffer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workOfferId,workId]` on the table `workOfferItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workId,workerId]` on the table `workWorker` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `transactionType` on the `productInventory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `sourceId` to the `request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `requestSource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `requestSource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `requestSource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountPercentage` to the `workOffer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grandTotal` to the `workOffer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `offerNumber` to the `workOffer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "offerStatus" AS ENUM ('DRAFT', 'SENT', 'REVISED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "inventoryTransactionType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- DropForeignKey
ALTER TABLE "request" DROP CONSTRAINT "request_source_fkey";

-- DropIndex
DROP INDEX "request_source_key";

-- AlterTable
ALTER TABLE "employee" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "equipmentBrand" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "equipmentEntity" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "equipmentFeature" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "equipmentMaintenance" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "equipmentModel" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "equipmentModelFeature" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "equipmentPart" DROP COLUMN "lifeSpanUnit",
ADD COLUMN     "lifeSpanUnitId" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "equipmentType" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "item" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "monetaryTransaction" DROP COLUMN "currencyId",
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "monetaryTransactionReference" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "permission" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ADD COLUMN     "unitLabel" VARCHAR(20);

-- AlterTable
ALTER TABLE "productInventory" DROP COLUMN "transactionType",
ADD COLUMN     "transactionType" "inventoryTransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "productPrice" ALTER COLUMN "currency" SET DEFAULT 'IDR';

-- AlterTable
ALTER TABLE "profileAdditional" ALTER COLUMN "notes" DROP NOT NULL;

-- AlterTable
ALTER TABLE "purchaseOrder" ADD COLUMN     "totalAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
ALTER COLUMN "notes" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "purchaseOrderProduct" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "notes" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "request" DROP COLUMN "source",
ADD COLUMN     "sourceId" INTEGER NOT NULL,
ALTER COLUMN "notes" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "requestProduct" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "notes" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "requestSource" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "rfq" ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "notes" DROP NOT NULL,
ALTER COLUMN "replyDate" DROP NOT NULL,
ALTER COLUMN "replyDate" DROP DEFAULT,
ALTER COLUMN "replyExpiredDate" DROP NOT NULL,
ALTER COLUMN "replyExpiredDate" DROP DEFAULT,
ALTER COLUMN "replyNotes" DROP NOT NULL,
ALTER COLUMN "replyNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "rfqProduct" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "notes" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "role" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "vendor" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "work" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workEquipment" DROP CONSTRAINT "workEquipment_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "workEquipment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "workItem" ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workOffer" DROP COLUMN "discountedPrice",
DROP COLUMN "totalWithProfit",
DROP COLUMN "totalWithTax",
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
ADD COLUMN     "discountPercentage" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "grandTotal" DECIMAL(20,4) NOT NULL,
ADD COLUMN     "includeDiscount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offerNumber" VARCHAR(50) NOT NULL,
ALTER COLUMN "notes" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "offerStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "discountAmount" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "overHeadPercentage" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "overHeadAmount" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "profitPercentage" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "profitAmount" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "taxPercentage" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "taxAmount" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workOfferItem" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workWorker" DROP CONSTRAINT "workWorker_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "workWorker_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "worker" DROP COLUMN "unit",
ADD COLUMN     "unitId" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "equipment";

-- CreateIndex
CREATE UNIQUE INDEX "permission_roleId_tableName_actionName_key" ON "permission"("roleId", "tableName", "actionName");

-- CreateIndex
CREATE UNIQUE INDEX "workEquipment_workId_equipmentId_key" ON "workEquipment"("workId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "workItem_workId_itemId_key" ON "workItem"("workId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "workOffer_offerNumber_key" ON "workOffer"("offerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "workOfferItem_workOfferId_workId_key" ON "workOfferItem"("workOfferId", "workId");

-- CreateIndex
CREATE UNIQUE INDEX "workWorker_workId_workerId_key" ON "workWorker"("workId", "workerId");

-- AddForeignKey
ALTER TABLE "equipmentEntity" ADD CONSTRAINT "equipmentEntity_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "equipmentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentEntity" ADD CONSTRAINT "equipmentEntity_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentModelFeature" ADD CONSTRAINT "equipmentModelFeature_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentFeature" ADD CONSTRAINT "equipmentFeature_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentMaintenance" ADD CONSTRAINT "equipmentMaintenance_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentPart" ADD CONSTRAINT "equipmentPart_lifeSpanUnitId_fkey" FOREIGN KEY ("lifeSpanUnitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryTransactionReference" ADD CONSTRAINT "monetaryTransactionReference_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "monetaryTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqProduct" ADD CONSTRAINT "rfqProduct_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrderProduct" ADD CONSTRAINT "purchaseOrderProduct_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "requestSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestProduct" ADD CONSTRAINT "requestProduct_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestSource" ADD CONSTRAINT "requestSource_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestSource" ADD CONSTRAINT "requestSource_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker" ADD CONSTRAINT "worker_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work" ADD CONSTRAINT "work_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
