/*
  Warnings:

  - The `unit` column on the `item` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `unit` column on the `worker` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "item" DROP COLUMN "unit",
ADD COLUMN     "unit" INTEGER;

-- AlterTable
ALTER TABLE "worker" DROP COLUMN "unit",
ADD COLUMN     "unit" INTEGER;
