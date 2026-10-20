/*
  Warnings:

  - Added the required column `departReason` to the `customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departReason` to the `employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departReason` to the `vendor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "departReason" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employee" ADD COLUMN     "departReason" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vendor" ADD COLUMN     "departReason" TEXT NOT NULL;
