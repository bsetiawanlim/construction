-- CreateEnum
CREATE TYPE "rfqStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "rfq" (
    "id" SERIAL NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "rfqTitle" TEXT NOT NULL,
    "rfqDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rfqDueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rfqStatus" "rfqStatus" NOT NULL,
    "rfqDescription" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqItem" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "rfqItemNumber" INTEGER NOT NULL,
    "rfqItemDescription" TEXT NOT NULL,
    "rfqItemUnit" TEXT NOT NULL,
    "rfqItemQuantity" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqVendor" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "sentDate" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfqVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqReply" (
    "id" SERIAL NOT NULL,
    "rfqVendorId" INTEGER NOT NULL,
    "replyDate" TIMESTAMP(3),
    "replyExpiredDate" TIMESTAMP(3),
    "status" "rfqStatus" NOT NULL,
    "notes" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfqReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqReplyItem" (
    "id" SERIAL NOT NULL,
    "rfqReplyId" INTEGER NOT NULL,
    "rfqItemId" INTEGER NOT NULL,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "notes" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfqReplyItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rfq_rfqNumber_key" ON "rfq"("rfqNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rfqReply_rfqVendorId_key" ON "rfqReply"("rfqVendorId");

-- AddForeignKey
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqItem" ADD CONSTRAINT "rfqItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqItem" ADD CONSTRAINT "rfqItem_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqItem" ADD CONSTRAINT "rfqItem_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqVendor" ADD CONSTRAINT "rfqVendor_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqVendor" ADD CONSTRAINT "rfqVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqVendor" ADD CONSTRAINT "rfqVendor_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqVendor" ADD CONSTRAINT "rfqVendor_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqReply" ADD CONSTRAINT "rfqReply_rfqVendorId_fkey" FOREIGN KEY ("rfqVendorId") REFERENCES "rfqVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqReply" ADD CONSTRAINT "rfqReply_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqReply" ADD CONSTRAINT "rfqReply_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqReplyItem" ADD CONSTRAINT "rfqReplyItem_rfqReplyId_fkey" FOREIGN KEY ("rfqReplyId") REFERENCES "rfqReply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqReplyItem" ADD CONSTRAINT "rfqReplyItem_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "rfqItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqReplyItem" ADD CONSTRAINT "rfqReplyItem_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqReplyItem" ADD CONSTRAINT "rfqReplyItem_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
