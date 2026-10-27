-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "delhiveryStatus" TEXT,
ADD COLUMN     "delhiverySyncAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "delhiverySyncError" TEXT,
ADD COLUMN     "delhiverySyncStatus" TEXT DEFAULT 'PENDING_DISPATCH',
ADD COLUMN     "lastDelhiverySyncAt" TIMESTAMP(3),
ADD COLUMN     "shippingMode" TEXT DEFAULT 'delhivery_pending';
