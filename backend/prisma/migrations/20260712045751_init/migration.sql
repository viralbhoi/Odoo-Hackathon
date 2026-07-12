/*
  Warnings:

  - You are about to alter the column `safetyScore` on the `Driver` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Driver" ALTER COLUMN "safetyScore" SET DEFAULT 100,
ALTER COLUMN "safetyScore" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "endedOdometer" DOUBLE PRECISION,
ADD COLUMN     "startedOdometer" DOUBLE PRECISION;
