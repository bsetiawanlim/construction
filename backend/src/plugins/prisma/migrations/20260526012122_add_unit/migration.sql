-- CreateTable
CREATE TABLE "unit" (
    "id" SERIAL NOT NULL,
    "baseQuantity" VARCHAR(50) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "abbr" VARCHAR(10) NOT NULL,
    "toBase" VARCHAR(50) NOT NULL,
    "fromBase" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
