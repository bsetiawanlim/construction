-- CreateTable
CREATE TABLE "profileContact" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "contactPersonId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "profileContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profileContact_profileId_key" ON "profileContact"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "profileContact_contactPersonId_key" ON "profileContact"("contactPersonId");

-- AddForeignKey
ALTER TABLE "profileContact" ADD CONSTRAINT "profileContact_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileContact" ADD CONSTRAINT "profileContact_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileContact" ADD CONSTRAINT "profileContact_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileContact" ADD CONSTRAINT "profileContact_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
