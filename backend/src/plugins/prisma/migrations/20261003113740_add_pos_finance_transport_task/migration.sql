-- CreateEnum
CREATE TYPE "taskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "taskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "payrollPeriodStatus" AS ENUM ('DRAFT', 'PROCESSING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "salaryRecordStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "salesOrderStatus" AS ENUM ('DRAFT', 'COMPLETED', 'VOID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "paymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'EWALLET');

-- CreateEnum
CREATE TYPE "paymentStatus" AS ENUM ('PENDING', 'SETTLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "vehicleType" AS ENUM ('truck', 'pickup', 'van', 'motorcycle', 'car', 'heavyVehicle');

-- CreateEnum
CREATE TYPE "vehicleStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "driverStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "tripStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "payrollPeriod" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" "payrollPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "payrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrollComponent" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "payrollStructureType" NOT NULL,
    "calculationType" "payrollCalculationType" NOT NULL,
    "defaultAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "payrollComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salaryRecord" (
    "id" SERIAL NOT NULL,
    "periodId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "basicSalary" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalAllowances" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" "salaryRecordStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "salaryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salaryRecordDetail" (
    "id" SERIAL NOT NULL,
    "salaryRecordId" INTEGER NOT NULL,
    "componentId" INTEGER NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "salaryRecordDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salesOrder" (
    "id" SERIAL NOT NULL,
    "orderNumber" VARCHAR(50) NOT NULL,
    "customerId" INTEGER,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(20,4) NOT NULL,
    "includeDiscount" BOOLEAN NOT NULL DEFAULT false,
    "discountPercentage" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "includeTax" BOOLEAN NOT NULL DEFAULT false,
    "taxPercentage" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "status" "salesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "salesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salesOrderItem" (
    "id" SERIAL NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" VARCHAR(200) NOT NULL,
    "unitId" INTEGER,
    "quantity" DECIMAL(20,4) NOT NULL,
    "unitPrice" DECIMAL(20,4) NOT NULL,
    "discountPercentage" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(20,4) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "salesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salesPayment" (
    "id" SERIAL NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "method" "paymentMethod" NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "changeAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "referenceNumber" VARCHAR(100),
    "monetaryAccountId" INTEGER,
    "status" "paymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "salesPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" SERIAL NOT NULL,
    "plateNumber" VARCHAR(20) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "type" "vehicleType" NOT NULL DEFAULT 'truck',
    "year" INTEGER,
    "capacity" DECIMAL(10,2),
    "status" "vehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "fuelType" VARCHAR(30),
    "currentOdometer" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER,
    "employeeId" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "licenseNumber" VARCHAR(50) NOT NULL,
    "licenseType" VARCHAR(20) NOT NULL,
    "licenseExpired" TIMESTAMP(3),
    "phoneNumber" VARCHAR(30),
    "status" "driverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip" (
    "id" SERIAL NOT NULL,
    "tripNumber" VARCHAR(50) NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "origin" VARCHAR(150) NOT NULL,
    "destination" VARCHAR(150) NOT NULL,
    "departureTime" TIMESTAMP(3),
    "arrivalTime" TIMESTAMP(3),
    "startOdometer" DECIMAL(12,2),
    "endOdometer" DECIMAL(12,2),
    "distance" DECIMAL(12,2),
    "status" "tripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cargoDescription" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuelLog" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "tripId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "odometer" DECIMAL(12,2),
    "liters" DECIMAL(10,2) NOT NULL,
    "pricePerLiter" DECIMAL(20,4) NOT NULL,
    "totalCost" DECIMAL(20,4) NOT NULL,
    "gasStation" VARCHAR(100),
    "receiptNumber" VARCHAR(50),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "fuelLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "status" "taskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "taskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "workId" INTEGER,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payrollPeriod_status_idx" ON "payrollPeriod"("status");

-- CreateIndex
CREATE INDEX "payrollPeriod_deletedAt_idx" ON "payrollPeriod"("deletedAt");

-- CreateIndex
CREATE INDEX "payrollComponent_type_idx" ON "payrollComponent"("type");

-- CreateIndex
CREATE INDEX "payrollComponent_deletedAt_idx" ON "payrollComponent"("deletedAt");

-- CreateIndex
CREATE INDEX "salaryRecord_status_idx" ON "salaryRecord"("status");

-- CreateIndex
CREATE INDEX "salaryRecord_deletedAt_idx" ON "salaryRecord"("deletedAt");

-- CreateIndex
CREATE INDEX "salaryRecord_periodId_idx" ON "salaryRecord"("periodId");

-- CreateIndex
CREATE INDEX "salaryRecord_employeeId_idx" ON "salaryRecord"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "salaryRecord_periodId_employeeId_key" ON "salaryRecord"("periodId", "employeeId");

-- CreateIndex
CREATE INDEX "salaryRecordDetail_salaryRecordId_idx" ON "salaryRecordDetail"("salaryRecordId");

-- CreateIndex
CREATE INDEX "salaryRecordDetail_componentId_idx" ON "salaryRecordDetail"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "salaryRecordDetail_salaryRecordId_componentId_key" ON "salaryRecordDetail"("salaryRecordId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "salesOrder_orderNumber_key" ON "salesOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "salesOrder_status_idx" ON "salesOrder"("status");

-- CreateIndex
CREATE INDEX "salesOrder_orderDate_idx" ON "salesOrder"("orderDate");

-- CreateIndex
CREATE INDEX "salesOrder_customerId_idx" ON "salesOrder"("customerId");

-- CreateIndex
CREATE INDEX "salesOrder_deletedAt_idx" ON "salesOrder"("deletedAt");

-- CreateIndex
CREATE INDEX "salesOrderItem_salesOrderId_idx" ON "salesOrderItem"("salesOrderId");

-- CreateIndex
CREATE INDEX "salesOrderItem_productId_idx" ON "salesOrderItem"("productId");

-- CreateIndex
CREATE INDEX "salesPayment_salesOrderId_idx" ON "salesPayment"("salesOrderId");

-- CreateIndex
CREATE INDEX "salesPayment_method_idx" ON "salesPayment"("method");

-- CreateIndex
CREATE INDEX "salesPayment_status_idx" ON "salesPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_plateNumber_key" ON "vehicle"("plateNumber");

-- CreateIndex
CREATE INDEX "vehicle_status_idx" ON "vehicle"("status");

-- CreateIndex
CREATE INDEX "vehicle_deletedAt_idx" ON "vehicle"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "driver_licenseNumber_key" ON "driver"("licenseNumber");

-- CreateIndex
CREATE INDEX "driver_status_idx" ON "driver"("status");

-- CreateIndex
CREATE INDEX "driver_profileId_idx" ON "driver"("profileId");

-- CreateIndex
CREATE INDEX "driver_employeeId_idx" ON "driver"("employeeId");

-- CreateIndex
CREATE INDEX "driver_deletedAt_idx" ON "driver"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "trip_tripNumber_key" ON "trip"("tripNumber");

-- CreateIndex
CREATE INDEX "trip_vehicleId_idx" ON "trip"("vehicleId");

-- CreateIndex
CREATE INDEX "trip_driverId_idx" ON "trip"("driverId");

-- CreateIndex
CREATE INDEX "trip_status_idx" ON "trip"("status");

-- CreateIndex
CREATE INDEX "trip_deletedAt_idx" ON "trip"("deletedAt");

-- CreateIndex
CREATE INDEX "fuelLog_vehicleId_idx" ON "fuelLog"("vehicleId");

-- CreateIndex
CREATE INDEX "fuelLog_tripId_idx" ON "fuelLog"("tripId");

-- CreateIndex
CREATE INDEX "fuelLog_date_idx" ON "fuelLog"("date");

-- CreateIndex
CREATE INDEX "fuelLog_deletedAt_idx" ON "fuelLog"("deletedAt");

-- CreateIndex
CREATE INDEX "task_status_idx" ON "task"("status");

-- CreateIndex
CREATE INDEX "task_priority_idx" ON "task"("priority");

-- CreateIndex
CREATE INDEX "task_assigneeId_idx" ON "task"("assigneeId");

-- CreateIndex
CREATE INDEX "task_workId_idx" ON "task"("workId");

-- CreateIndex
CREATE INDEX "task_deletedAt_idx" ON "task"("deletedAt");

-- AddForeignKey
ALTER TABLE "payrollPeriod" ADD CONSTRAINT "payrollPeriod_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrollPeriod" ADD CONSTRAINT "payrollPeriod_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrollComponent" ADD CONSTRAINT "payrollComponent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrollComponent" ADD CONSTRAINT "payrollComponent_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaryRecord" ADD CONSTRAINT "salaryRecord_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "payrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaryRecord" ADD CONSTRAINT "salaryRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaryRecord" ADD CONSTRAINT "salaryRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaryRecord" ADD CONSTRAINT "salaryRecord_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaryRecordDetail" ADD CONSTRAINT "salaryRecordDetail_salaryRecordId_fkey" FOREIGN KEY ("salaryRecordId") REFERENCES "salaryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaryRecordDetail" ADD CONSTRAINT "salaryRecordDetail_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "payrollComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesOrder" ADD CONSTRAINT "salesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesOrder" ADD CONSTRAINT "salesOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesOrder" ADD CONSTRAINT "salesOrder_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesOrderItem" ADD CONSTRAINT "salesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "salesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesOrderItem" ADD CONSTRAINT "salesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesOrderItem" ADD CONSTRAINT "salesOrderItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesPayment" ADD CONSTRAINT "salesPayment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "salesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesPayment" ADD CONSTRAINT "salesPayment_monetaryAccountId_fkey" FOREIGN KEY ("monetaryAccountId") REFERENCES "monetaryAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuelLog" ADD CONSTRAINT "fuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuelLog" ADD CONSTRAINT "fuelLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuelLog" ADD CONSTRAINT "fuelLog_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuelLog" ADD CONSTRAINT "fuelLog_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_workId_fkey" FOREIGN KEY ("workId") REFERENCES "work"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
