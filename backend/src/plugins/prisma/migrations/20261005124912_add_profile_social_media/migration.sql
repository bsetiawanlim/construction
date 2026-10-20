-- CreateTable
CREATE TABLE "profileSocialMedia" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "username" VARCHAR(100),
    "url" VARCHAR(500) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "profileSocialMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profileSocialMedia_profileId_idx" ON "profileSocialMedia"("profileId");

-- CreateIndex
CREATE INDEX "profileSocialMedia_platform_idx" ON "profileSocialMedia"("platform");

-- AddForeignKey
ALTER TABLE "profileSocialMedia" ADD CONSTRAINT "profileSocialMedia_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileSocialMedia" ADD CONSTRAINT "profileSocialMedia_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profileSocialMedia" ADD CONSTRAINT "profileSocialMedia_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
