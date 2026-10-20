/*
  Warnings:

  - A unique constraint covering the columns `[firstName,lastName,dateOfBirth]` on the table `profile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "profile_firstName_lastName_dateOfBirth_key" ON "profile"("firstName", "lastName", "dateOfBirth");
