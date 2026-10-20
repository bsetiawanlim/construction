/*
  Warnings:

  - Added the required column `createdAt` to the `monetaryTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAt` to the `monetaryTransactionReference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `monetaryTransactionReference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `monetaryTransactionReference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `monetaryTransactionReference` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "monetaryTransaction" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "monetaryTransactionReference" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "socialId" VARCHAR(50),
ADD COLUMN     "taxId" VARCHAR(50);

-- CreateTable
CREATE TABLE "profileDocument" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "documentType" VARCHAR(50) NOT NULL,
    "documentPath" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "profileDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "worker_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "monetaryTransactionReference" ADD CONSTRAINT "monetaryTransactionReference_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryTransactionReference" ADD CONSTRAINT "monetaryTransactionReference_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileDocument" ADD CONSTRAINT "profileDocument_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileDocument" ADD CONSTRAINT "profileDocument_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileDocument" ADD CONSTRAINT "profileDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker" ADD CONSTRAINT "worker_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker" ADD CONSTRAINT "worker_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
