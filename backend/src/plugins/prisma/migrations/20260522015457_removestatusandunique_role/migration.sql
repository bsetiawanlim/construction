/*
  Warnings:

  - You are about to drop the column `status` on the `permission` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "permission_roleId_tableName_actionName_key";

-- AlterTable
ALTER TABLE "permission" DROP COLUMN "status";
