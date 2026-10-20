-- DropForeignKey
ALTER TABLE "employee" DROP CONSTRAINT "employee_positionId_fkey";

-- AlterTable
ALTER TABLE "employee" ALTER COLUMN "positionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
