-- AlterTable
CREATE SEQUENCE customer_id_seq;
ALTER TABLE "customer" ALTER COLUMN "id" SET DEFAULT nextval('customer_id_seq');
ALTER SEQUENCE customer_id_seq OWNED BY "customer"."id";

-- AlterTable
CREATE SEQUENCE employee_id_seq;
ALTER TABLE "employee" ALTER COLUMN "id" SET DEFAULT nextval('employee_id_seq');
ALTER SEQUENCE employee_id_seq OWNED BY "employee"."id";

-- AlterTable
CREATE SEQUENCE vendor_id_seq;
ALTER TABLE "vendor" ALTER COLUMN "id" SET DEFAULT nextval('vendor_id_seq');
ALTER SEQUENCE vendor_id_seq OWNED BY "vendor"."id";
