/*
  Warnings:

  - You are about to drop the column `rfqDate` on the `rfq` table. All the data in the column will be lost.
  - You are about to drop the column `rfqDescription` on the `rfq` table. All the data in the column will be lost.
  - You are about to drop the column `rfqDueDate` on the `rfq` table. All the data in the column will be lost.
  - You are about to drop the column `rfqNumber` on the `rfq` table. All the data in the column will be lost.
  - You are about to drop the column `rfqStatus` on the `rfq` table. All the data in the column will be lost.
  - You are about to drop the column `rfqTitle` on the `rfq` table. All the data in the column will be lost.
  - You are about to drop the `rfqItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rfqReply` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rfqReplyItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rfqVendor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[number]` on the table `rfq` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[replyNumber]` on the table `rfq` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `notes` to the `rfq` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `rfq` table without a default value. This is not possible if the table is not empty.
  - Added the required column `replyNotes` to the `rfq` table without a default value. This is not possible if the table is not empty.
  - Added the required column `replyNumber` to the `rfq` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `rfq` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `rfq` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendorId` to the `rfq` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "orderStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "rfqItem" DROP CONSTRAINT "rfqItem_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "rfqItem" DROP CONSTRAINT "rfqItem_rfqId_fkey";

-- DropForeignKey
ALTER TABLE "rfqItem" DROP CONSTRAINT "rfqItem_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "rfqReply" DROP CONSTRAINT "rfqReply_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "rfqReply" DROP CONSTRAINT "rfqReply_rfqVendorId_fkey";

-- DropForeignKey
ALTER TABLE "rfqReply" DROP CONSTRAINT "rfqReply_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "rfqReplyItem" DROP CONSTRAINT "rfqReplyItem_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "rfqReplyItem" DROP CONSTRAINT "rfqReplyItem_rfqItemId_fkey";

-- DropForeignKey
ALTER TABLE "rfqReplyItem" DROP CONSTRAINT "rfqReplyItem_rfqReplyId_fkey";

-- DropForeignKey
ALTER TABLE "rfqReplyItem" DROP CONSTRAINT "rfqReplyItem_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "rfqVendor" DROP CONSTRAINT "rfqVendor_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "rfqVendor" DROP CONSTRAINT "rfqVendor_rfqId_fkey";

-- DropForeignKey
ALTER TABLE "rfqVendor" DROP CONSTRAINT "rfqVendor_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "rfqVendor" DROP CONSTRAINT "rfqVendor_vendorId_fkey";

-- DropIndex
DROP INDEX "rfq_rfqNumber_key";

-- AlterTable
ALTER TABLE "rfq" DROP COLUMN "rfqDate",
DROP COLUMN "rfqDescription",
DROP COLUMN "rfqDueDate",
DROP COLUMN "rfqNumber",
DROP COLUMN "rfqStatus",
DROP COLUMN "rfqTitle",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT NOT NULL,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "replyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "replyExpiredDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "replyNotes" TEXT NOT NULL,
ADD COLUMN     "replyNumber" TEXT NOT NULL,
ADD COLUMN     "status" "orderStatus" NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "vendorId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "rfqItem";

-- DropTable
DROP TABLE "rfqReply";

-- DropTable
DROP TABLE "rfqReplyItem";

-- DropTable
DROP TABLE "rfqVendor";

-- DropEnum
DROP TYPE "rfqStatus";

-- CreateTable
CREATE TABLE "rfqProduct" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "replyPrice" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfqProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchaseOrder" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
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

    CONSTRAINT "purchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchaseOrderProduct" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "price" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchaseOrderProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchaseOrder_rfqId_key" ON "purchaseOrder"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "purchaseOrder_number_key" ON "purchaseOrder"("number");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_number_key" ON "rfq"("number");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_replyNumber_key" ON "rfq"("replyNumber");

-- AddForeignKey
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqProduct" ADD CONSTRAINT "rfqProduct_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqProduct" ADD CONSTRAINT "rfqProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqProduct" ADD CONSTRAINT "rfqProduct_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqProduct" ADD CONSTRAINT "rfqProduct_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrder" ADD CONSTRAINT "purchaseOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrder" ADD CONSTRAINT "purchaseOrder_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrder" ADD CONSTRAINT "purchaseOrder_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrder" ADD CONSTRAINT "purchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrderProduct" ADD CONSTRAINT "purchaseOrderProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrderProduct" ADD CONSTRAINT "purchaseOrderProduct_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrderProduct" ADD CONSTRAINT "purchaseOrderProduct_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseOrderProduct" ADD CONSTRAINT "purchaseOrderProduct_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
