-- CreateEnum
CREATE TYPE "accountType" AS ENUM ('bankAccount', 'cashAccount', 'loanAccount', 'savingAccount', 'creditCardAccount');

-- CreateEnum
CREATE TYPE "transactionType" AS ENUM ('debet', 'credit');

-- CreateTable
CREATE TABLE "monetaryAccount" (
    "id" TEXT NOT NULL,
    "institute" VARCHAR(50),
    "accountName" VARCHAR(50),
    "accountId" TEXT,
    "profileId" INTEGER,
    "accountType" "accountType" NOT NULL,
    "description" VARCHAR(255),
    "balance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "monetaryAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monetaryTransaction" (
    "id" TEXT NOT NULL,
    "sourceAccountId" TEXT NOT NULL,
    "targetAccountId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "transactionType" NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "monetaryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monetaryAccount_accountId_key" ON "monetaryAccount"("accountId");

-- AddForeignKey
ALTER TABLE "monetaryAccount" ADD CONSTRAINT "monetaryAccount_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryAccount" ADD CONSTRAINT "monetaryAccount_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryAccount" ADD CONSTRAINT "monetaryAccount_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryTransaction" ADD CONSTRAINT "monetaryTransaction_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "monetaryAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryTransaction" ADD CONSTRAINT "monetaryTransaction_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "monetaryAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryTransaction" ADD CONSTRAINT "monetaryTransaction_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetaryTransaction" ADD CONSTRAINT "monetaryTransaction_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
