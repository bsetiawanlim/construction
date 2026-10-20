-- CreateTable
CREATE TABLE "productRecipe" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "ingredientProductId" INTEGER NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "unitId" INTEGER,
    "unitLabel" VARCHAR(20),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "productRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "productRecipe_productId_idx" ON "productRecipe"("productId");

-- CreateIndex
CREATE INDEX "productRecipe_ingredientProductId_idx" ON "productRecipe"("ingredientProductId");

-- CreateIndex
CREATE UNIQUE INDEX "productRecipe_productId_ingredientProductId_key" ON "productRecipe"("productId", "ingredientProductId");

-- AddForeignKey
ALTER TABLE "productRecipe" ADD CONSTRAINT "productRecipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productRecipe" ADD CONSTRAINT "productRecipe_ingredientProductId_fkey" FOREIGN KEY ("ingredientProductId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productRecipe" ADD CONSTRAINT "productRecipe_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productRecipe" ADD CONSTRAINT "productRecipe_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productRecipe" ADD CONSTRAINT "productRecipe_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Product & ProductInventory currentStock/quantity to DECIMAL(20,4)
ALTER TABLE "product" ALTER COLUMN "currentStock" TYPE DECIMAL(20,4) USING "currentStock"::DECIMAL(20,4);
ALTER TABLE "product" ALTER COLUMN "currentStock" SET DEFAULT 0;

ALTER TABLE "productInventory" ALTER COLUMN "quantity" TYPE DECIMAL(20,4) USING "quantity"::DECIMAL(20,4);
ALTER TABLE "productInventory" ALTER COLUMN "currentStock" TYPE DECIMAL(20,4) USING "currentStock"::DECIMAL(20,4);
