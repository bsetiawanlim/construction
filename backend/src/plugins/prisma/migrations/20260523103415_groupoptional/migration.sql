-- AlterTable
ALTER TABLE "customer" ALTER COLUMN "customergroup" DROP NOT NULL;

-- AlterTable
ALTER TABLE "profileContact" ALTER COLUMN "position" DROP NOT NULL;

-- AlterTable
ALTER TABLE "vendor" ALTER COLUMN "vendorgroup" DROP NOT NULL;
