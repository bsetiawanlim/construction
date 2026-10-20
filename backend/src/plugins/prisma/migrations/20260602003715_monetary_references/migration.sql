/*
  Warnings:

  - You are about to drop the column `referenceId` on the `monetaryTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `referenceType` on the `monetaryTransaction` table. All the data in the column will be lost.
  - Added the required column `status` to the `monetaryTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "referenceType" AS ENUM ('receivedInvoice', 'issuedInvoice');

-- CreateEnum
CREATE TYPE "transactionStatus" AS ENUM ('pending', 'completed', 'cancelled', 'reversed', 'partialSettled');

-- AlterTable
ALTER TABLE "monetaryTransaction" DROP COLUMN "referenceId",
DROP COLUMN "referenceType",
ADD COLUMN     "status" "transactionStatus" NOT NULL;

-- CreateTable
CREATE TABLE "monetaryTransactionReference" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "referenceType" "referenceType" NOT NULL,

    CONSTRAINT "monetaryTransactionReference_pkey" PRIMARY KEY ("id")
);
