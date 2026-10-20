/*
  Warnings:

  - You are about to drop the column `departDate` on the `customer` table. All the data in the column will be lost.
  - You are about to drop the column `joinDate` on the `customer` table. All the data in the column will be lost.
  - You are about to drop the column `departDate` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `joinDate` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `departDate` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `joinDate` on the `vendor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customer" DROP COLUMN "departDate",
DROP COLUMN "joinDate";

-- AlterTable
ALTER TABLE "employee" DROP COLUMN "departDate",
DROP COLUMN "joinDate",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "vendor" DROP COLUMN "departDate",
DROP COLUMN "joinDate";
