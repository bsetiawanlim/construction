-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_updatedBy_fkey";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "createdBy" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
