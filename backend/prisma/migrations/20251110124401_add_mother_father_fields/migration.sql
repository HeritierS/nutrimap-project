-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('married', 'divorced', 'single', 'teen');

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "fatherNationalId" TEXT,
ADD COLUMN     "motherAge" INTEGER,
ADD COLUMN     "motherMaritalStatus" "MaritalStatus",
ADD COLUMN     "motherNationalId" TEXT;
