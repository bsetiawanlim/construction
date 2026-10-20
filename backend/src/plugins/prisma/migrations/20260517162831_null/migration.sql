-- DropForeignKey
ALTER TABLE "employee" DROP CONSTRAINT "employee_roleId_fkey";

-- AlterTable
ALTER TABLE "employee" ALTER COLUMN "roleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
