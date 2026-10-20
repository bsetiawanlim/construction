-- CreateTable
CREATE TABLE "facilityEmployee" (
    "id" SERIAL NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "role" VARCHAR(100),
    "notes" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "facilityEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilityProduct" (
    "id" SERIAL NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "isTradeable" BOOLEAN NOT NULL DEFAULT true,
    "minStock" DECIMAL(20,4) DEFAULT 0,
    "maxStock" DECIMAL(20,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "facilityProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilityEquipment" (
    "id" SERIAL NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "equipmentEntityId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "facilityEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "facilityEmployee_facilityId_idx" ON "facilityEmployee"("facilityId");
CREATE INDEX "facilityEmployee_employeeId_idx" ON "facilityEmployee"("employeeId");
CREATE UNIQUE INDEX "facilityEmployee_facilityId_employeeId_key" ON "facilityEmployee"("facilityId", "employeeId");

-- CreateIndex
CREATE INDEX "facilityProduct_facilityId_idx" ON "facilityProduct"("facilityId");
CREATE INDEX "facilityProduct_productId_idx" ON "facilityProduct"("productId");
CREATE INDEX "facilityProduct_isTradeable_idx" ON "facilityProduct"("isTradeable");
CREATE INDEX "facilityProduct_isActive_idx" ON "facilityProduct"("isActive");
CREATE UNIQUE INDEX "facilityProduct_facilityId_productId_key" ON "facilityProduct"("facilityId", "productId");

-- CreateIndex
CREATE INDEX "facilityEquipment_facilityId_idx" ON "facilityEquipment"("facilityId");
CREATE INDEX "facilityEquipment_equipmentEntityId_idx" ON "facilityEquipment"("equipmentEntityId");
CREATE INDEX "facilityEquipment_sectionId_idx" ON "facilityEquipment"("sectionId");
CREATE INDEX "facilityEquipment_status_idx" ON "facilityEquipment"("status");
CREATE UNIQUE INDEX "facilityEquipment_facilityId_equipmentEntityId_key" ON "facilityEquipment"("facilityId", "equipmentEntityId");

-- AddForeignKey
ALTER TABLE "facilityEmployee" ADD CONSTRAINT "facilityEmployee_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "facilityEmployee" ADD CONSTRAINT "facilityEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "facilityEmployee" ADD CONSTRAINT "facilityEmployee_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facilityEmployee" ADD CONSTRAINT "facilityEmployee_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilityProduct" ADD CONSTRAINT "facilityProduct_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "facilityProduct" ADD CONSTRAINT "facilityProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "facilityProduct" ADD CONSTRAINT "facilityProduct_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facilityProduct" ADD CONSTRAINT "facilityProduct_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilityEquipment" ADD CONSTRAINT "facilityEquipment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "facilityEquipment" ADD CONSTRAINT "facilityEquipment_equipmentEntityId_fkey" FOREIGN KEY ("equipmentEntityId") REFERENCES "equipmentEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "facilityEquipment" ADD CONSTRAINT "facilityEquipment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "facilitySection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "facilityEquipment" ADD CONSTRAINT "facilityEquipment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facilityEquipment" ADD CONSTRAINT "facilityEquipment_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
