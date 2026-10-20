-- AlterTable
ALTER TABLE "customer" ALTER COLUMN "departReason" DROP NOT NULL;

-- AlterTable
ALTER TABLE "employee" ALTER COLUMN "departReason" DROP NOT NULL;

-- AlterTable
ALTER TABLE "vendor" ALTER COLUMN "departReason" DROP NOT NULL;
