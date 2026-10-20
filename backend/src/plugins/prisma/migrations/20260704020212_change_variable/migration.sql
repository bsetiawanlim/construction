/*
  Warnings:

  - You are about to drop the column `identifier` on the `profileAdditional` table. All the data in the column will be lost.
  - Added the required column `key` to the `profileAdditional` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profileAdditional" DROP COLUMN "identifier",
ADD COLUMN     "key" VARCHAR(30) NOT NULL;
