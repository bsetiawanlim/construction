/*
  Warnings:

  - You are about to drop the column `type` on the `profileAdditional` table. All the data in the column will be lost.
  - You are about to alter the column `identifier` on the `profileAdditional` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(30)`.
  - Added the required column `value` to the `profileAdditional` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profileAdditional" DROP COLUMN "type",
ADD COLUMN     "value" VARCHAR(50) NOT NULL,
ALTER COLUMN "identifier" SET DATA TYPE VARCHAR(30);
