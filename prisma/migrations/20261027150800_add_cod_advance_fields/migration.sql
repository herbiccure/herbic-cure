-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "advancePaidAt" TIMESTAMP(3),
ADD COLUMN     "advancePaymentId" TEXT,
ADD COLUMN     "advanceSettingsSnapshot" TEXT,
ADD COLUMN     "codBalanceAmount" DOUBLE PRECISION DEFAULT 0;
