-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOTEL', 'ROOM', 'APARTMENT', 'HOSTEL', 'MOTEL', 'BUNGALOW');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "property_type" "PropertyType" NOT NULL DEFAULT 'HOTEL';
