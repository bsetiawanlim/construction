/*
  Warnings:

  - Added the required column `position` to the `profileContact` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "profileContact_contactPersonId_key";

-- DropIndex
DROP INDEX "profileContact_profileId_key";

-- AlterTable
ALTER TABLE "profileContact" ADD COLUMN     "position" VARCHAR(100) NOT NULL;
