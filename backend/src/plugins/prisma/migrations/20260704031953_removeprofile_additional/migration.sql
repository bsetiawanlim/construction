/*
  Warnings:

  - You are about to drop the `profileAdditional` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "profileAdditional" DROP CONSTRAINT "profileAdditional_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "profileAdditional" DROP CONSTRAINT "profileAdditional_profileId_fkey";

-- DropForeignKey
ALTER TABLE "profileAdditional" DROP CONSTRAINT "profileAdditional_updatedBy_fkey";

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "notes" TEXT;

-- DropTable
DROP TABLE "profileAdditional";
