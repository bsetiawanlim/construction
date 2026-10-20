/*
  Warnings:

  - A unique constraint covering the columns `[profileId]` on the table `vendor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "vendor_profileId_key" ON "vendor"("profileId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
