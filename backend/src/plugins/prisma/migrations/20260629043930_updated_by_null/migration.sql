-- DropForeignKey
ALTER TABLE "profile" DROP CONSTRAINT "profile_updatedBy_fkey";

-- AlterTable
ALTER TABLE "profile" ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
