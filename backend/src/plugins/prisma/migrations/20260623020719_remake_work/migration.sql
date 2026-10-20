/*
  Warnings:

  - You are about to drop the column `name` on the `item` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `monetaryTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `referenceType` on the `monetaryTransactionReference` table. All the data in the column will be lost.
  - Added the required column `productId` to the `item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionFlow` to the `monetaryTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionType` to the `monetaryTransactionReference` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "requestOrigin" AS ENUM ('project', 'office');

-- CreateEnum
CREATE TYPE "transactionFlow" AS ENUM ('cash', 'credit', 'electronic');

-- CreateEnum
CREATE TYPE "transactionIOType" AS ENUM ('debet', 'credit');

-- CreateEnum
CREATE TYPE "payrollStructureType" AS ENUM ('basic', 'allowance', 'deduction');

-- CreateEnum
CREATE TYPE "payrollCalculationType" AS ENUM ('percentage', 'fixedAmount');

-- CreateEnum
CREATE TYPE "payrollFrequency" AS ENUM ('hourly', 'daily', 'weekly', 'biWeekly', 'monthly');

-- AlterTable
ALTER TABLE "item" DROP COLUMN "name",
ADD COLUMN     "productId" INTEGER NOT NULL,
ADD COLUMN     "unitPrice" DECIMAL(20,4) NOT NULL;

-- AlterTable
ALTER TABLE "monetaryTransaction" DROP COLUMN "type",
ADD COLUMN     "transactionFlow" "transactionFlow" NOT NULL;

-- AlterTable
ALTER TABLE "monetaryTransactionReference" DROP COLUMN "referenceType",
ADD COLUMN     "transactionType" "transactionType" NOT NULL;

-- CreateTable
CREATE TABLE "equipmentEntity" (
    "id" SERIAL NOT NULL,
    "equipmentTypeId" INTEGER,
    "brandId" INTEGER,
    "modelId" INTEGER,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" INTEGER,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "equipmentEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipmentType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "equipmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipmentBrand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "equipmentBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipmentModel" (
    "id" SERIAL NOT NULL,
    "typeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "equipmentModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipmentModelFeature" (
    "id" SERIAL NOT NULL,
    "equipmentModelId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "unit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "equipmentModelFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipmentFeature" (
    "id" SERIAL NOT NULL,
    "equipmentEntityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "unit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "equipmentFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipmentMaintenance" (
    "id" SERIAL NOT NULL,
    "equipmentEntityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "unit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "equipmentMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipmentPart" (
    "id" SERIAL NOT NULL,
    "equipmentModelId" INTEGER NOT NULL,
    "partNumber" TEXT,
    "name" TEXT NOT NULL,
    "otherName" TEXT,
    "description" TEXT,
    "unit" INTEGER,
    "lifeSpan" INTEGER,
    "lifeSpanUnit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "equipmentPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "source" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "orderStatus" NOT NULL,
    "notes" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requestProduct" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "notes" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requestProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requestSource" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "requestOrigin" "requestOrigin" NOT NULL,

    CONSTRAINT "requestSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "unit" INTEGER,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "unit" INTEGER,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "amount" INTEGER NOT NULL,
    "totalPrice" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workItem" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "workId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "totalPrice" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "workItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workWorker" (
    "workId" INTEGER NOT NULL,
    "workerId" INTEGER NOT NULL,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "totalPrice" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "workWorker_pkey" PRIMARY KEY ("workId","workerId")
);

-- CreateTable
CREATE TABLE "workEquipment" (
    "workId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "totalPrice" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "workEquipment_pkey" PRIMARY KEY ("workId","equipmentId")
);

-- CreateTable
CREATE TABLE "workOffer" (
    "id" SERIAL NOT NULL,
    "notes" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "dateIssued" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "transactionStatus" NOT NULL,
    "totalPrice" DECIMAL(20,4) NOT NULL,
    "discountAmount" DECIMAL(20,2) NOT NULL,
    "discountedPrice" DECIMAL(20,2) NOT NULL,
    "overHeadPercentage" DECIMAL(20,2) NOT NULL,
    "overHeadAmount" DECIMAL(20,2) NOT NULL,
    "profitPercentage" DECIMAL(20,2) NOT NULL,
    "profitAmount" DECIMAL(20,2) NOT NULL,
    "totalWithProfit" DECIMAL(20,2) NOT NULL,
    "taxPercentage" DECIMAL(20,2) NOT NULL,
    "taxAmount" DECIMAL(20,2) NOT NULL,
    "totalWithTax" DECIMAL(20,2) NOT NULL,
    "includeOverhead" BOOLEAN NOT NULL DEFAULT false,
    "includeProfit" BOOLEAN NOT NULL DEFAULT false,
    "includeTax" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "workOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workOfferItem" (
    "id" SERIAL NOT NULL,
    "workOfferId" INTEGER NOT NULL,
    "workId" INTEGER NOT NULL,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "totalPrice" DECIMAL(20,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "workOfferItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "request_number_key" ON "request"("number");

-- CreateIndex
CREATE UNIQUE INDEX "request_source_key" ON "request"("source");

-- AddForeignKey
ALTER TABLE "equipmentEntity" ADD CONSTRAINT "equipmentEntity_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "equipmentBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentEntity" ADD CONSTRAINT "equipmentEntity_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "equipmentModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentEntity" ADD CONSTRAINT "equipmentEntity_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentEntity" ADD CONSTRAINT "equipmentEntity_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentType" ADD CONSTRAINT "equipmentType_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentType" ADD CONSTRAINT "equipmentType_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentBrand" ADD CONSTRAINT "equipmentBrand_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentBrand" ADD CONSTRAINT "equipmentBrand_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentModel" ADD CONSTRAINT "equipmentModel_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentModel" ADD CONSTRAINT "equipmentModel_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentModel" ADD CONSTRAINT "equipmentModel_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "equipmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentModelFeature" ADD CONSTRAINT "equipmentModelFeature_equipmentModelId_fkey" FOREIGN KEY ("equipmentModelId") REFERENCES "equipmentModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentModelFeature" ADD CONSTRAINT "equipmentModelFeature_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentModelFeature" ADD CONSTRAINT "equipmentModelFeature_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentFeature" ADD CONSTRAINT "equipmentFeature_equipmentEntityId_fkey" FOREIGN KEY ("equipmentEntityId") REFERENCES "equipmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentFeature" ADD CONSTRAINT "equipmentFeature_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentFeature" ADD CONSTRAINT "equipmentFeature_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentMaintenance" ADD CONSTRAINT "equipmentMaintenance_equipmentEntityId_fkey" FOREIGN KEY ("equipmentEntityId") REFERENCES "equipmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentMaintenance" ADD CONSTRAINT "equipmentMaintenance_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentMaintenance" ADD CONSTRAINT "equipmentMaintenance_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentPart" ADD CONSTRAINT "equipmentPart_equipmentModelId_fkey" FOREIGN KEY ("equipmentModelId") REFERENCES "equipmentModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentPart" ADD CONSTRAINT "equipmentPart_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipmentPart" ADD CONSTRAINT "equipmentPart_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_source_fkey" FOREIGN KEY ("source") REFERENCES "requestSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestProduct" ADD CONSTRAINT "requestProduct_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestProduct" ADD CONSTRAINT "requestProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestProduct" ADD CONSTRAINT "requestProduct_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestProduct" ADD CONSTRAINT "requestProduct_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work" ADD CONSTRAINT "work_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work" ADD CONSTRAINT "work_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workItem" ADD CONSTRAINT "workItem_workId_fkey" FOREIGN KEY ("workId") REFERENCES "work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workItem" ADD CONSTRAINT "workItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workItem" ADD CONSTRAINT "workItem_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workItem" ADD CONSTRAINT "workItem_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workWorker" ADD CONSTRAINT "workWorker_workId_fkey" FOREIGN KEY ("workId") REFERENCES "work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workWorker" ADD CONSTRAINT "workWorker_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workWorker" ADD CONSTRAINT "workWorker_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workWorker" ADD CONSTRAINT "workWorker_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workEquipment" ADD CONSTRAINT "workEquipment_workId_fkey" FOREIGN KEY ("workId") REFERENCES "work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workEquipment" ADD CONSTRAINT "workEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipmentEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workEquipment" ADD CONSTRAINT "workEquipment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workEquipment" ADD CONSTRAINT "workEquipment_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workOffer" ADD CONSTRAINT "workOffer_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workOffer" ADD CONSTRAINT "workOffer_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workOffer" ADD CONSTRAINT "workOffer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workOfferItem" ADD CONSTRAINT "workOfferItem_workOfferId_fkey" FOREIGN KEY ("workOfferId") REFERENCES "workOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workOfferItem" ADD CONSTRAINT "workOfferItem_workId_fkey" FOREIGN KEY ("workId") REFERENCES "work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workOfferItem" ADD CONSTRAINT "workOfferItem_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workOfferItem" ADD CONSTRAINT "workOfferItem_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
