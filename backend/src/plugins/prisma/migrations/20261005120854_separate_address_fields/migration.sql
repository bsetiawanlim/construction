-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" VARCHAR(100) DEFAULT 'Indonesia',
ADD COLUMN     "postalCode" VARCHAR(20),
ADD COLUMN     "province" VARCHAR(100);

-- CreateIndex
CREATE INDEX "profile_city_idx" ON "profile"("city");

-- CreateIndex
CREATE INDEX "profile_province_idx" ON "profile"("province");

-- CreateIndex
CREATE INDEX "profile_country_idx" ON "profile"("country");
