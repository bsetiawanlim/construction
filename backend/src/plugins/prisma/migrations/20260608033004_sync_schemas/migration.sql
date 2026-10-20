/*
  Warnings:

  - Added the required column `documentName` to the `profileDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profileDocument" ADD COLUMN     "documentName" VARCHAR(255) NOT NULL;
