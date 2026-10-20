/*
  Warnings:

  - A unique constraint covering the columns `[profileId]` on the table `customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profileId]` on the table `employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `profile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleName]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleAbbr]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `vendor` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "profile_userId_idx";

-- AlterTable
ALTER TABLE "employee" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vendor" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "customer_profileId_key" ON "customer"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profileId_key" ON "employee"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_userId_key" ON "profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "role_roleName_key" ON "role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "role_roleAbbr_key" ON "role"("roleAbbr");

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
