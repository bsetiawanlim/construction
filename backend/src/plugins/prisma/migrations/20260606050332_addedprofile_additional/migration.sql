-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "phoneNumber" VARCHAR(20),
ADD COLUMN     "phoneNumberVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp" VARCHAR(20),
ADD COLUMN     "whatsappVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "profileAdditional" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "identifier" VARCHAR(50) NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "profileAdditional_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "profileAdditional" ADD CONSTRAINT "profileAdditional_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileAdditional" ADD CONSTRAINT "profileAdditional_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileAdditional" ADD CONSTRAINT "profileAdditional_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
