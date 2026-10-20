-- AlterTable
CREATE SEQUENCE profile_id_seq;
ALTER TABLE "profile" ALTER COLUMN "id" SET DEFAULT nextval('profile_id_seq'),
ALTER COLUMN "dateOfBirth" SET DATA TYPE DATE;
ALTER SEQUENCE profile_id_seq OWNED BY "profile"."id";
