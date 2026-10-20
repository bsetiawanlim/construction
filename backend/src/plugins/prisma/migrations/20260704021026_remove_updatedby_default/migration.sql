-- DropForeignKey
ALTER TABLE "profileAdditional" DROP CONSTRAINT "profileAdditional_updatedBy_fkey";

-- AlterTable
ALTER TABLE "profileAdditional" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "profileAdditional" ADD CONSTRAINT "profileAdditional_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
