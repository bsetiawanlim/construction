/*
  Warnings:

  - The primary key for the `monetaryAccount` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `monetaryAccount` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `monetaryTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `monetaryTransaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `accountName` on table `monetaryAccount` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `sourceAccountId` on the `monetaryTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `targetAccountId` on the `monetaryTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `referenceId` on the `monetaryTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "monetaryTransaction" DROP CONSTRAINT "monetaryTransaction_sourceAccountId_fkey";

-- DropForeignKey
ALTER TABLE "monetaryTransaction" DROP CONSTRAINT "monetaryTransaction_targetAccountId_fkey";

-- AlterTable
ALTER TABLE "monetaryAccount" DROP CONSTRAINT "monetaryAccount_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "accountName" SET NOT NULL,
ADD CONSTRAINT "monetaryAccount_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "monetaryTransaction" DROP CONSTRAINT "monetaryTransaction_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "sourceAccountId",
ADD COLUMN     "sourceAccountId" INTEGER NOT NULL,
DROP COLUMN "targetAccountId",
ADD COLUMN     "targetAccountId" INTEGER NOT NULL,
DROP COLUMN "referenceId",
ADD COLUMN     "referenceId" INTEGER NOT NULL,
ADD CONSTRAINT "monetaryTransaction_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "monetaryTransaction" ADD CONSTRAINT "monetaryTransaction_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "monetaryAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryTransaction" ADD CONSTRAINT "monetaryTransaction_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "monetaryAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
