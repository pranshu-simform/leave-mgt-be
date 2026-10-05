-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventAction" ADD VALUE 'AUTO_APPROVED';
ALTER TYPE "EventAction" ADD VALUE 'APPROVED';
ALTER TYPE "EventAction" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerReason" ADD VALUE 'DEDUCT';
ALTER TYPE "LedgerReason" ADD VALUE 'REFUND';

-- AlterTable
ALTER TABLE "leave_balance_ledger" ADD COLUMN     "actor_id" UUID,
ADD COLUMN     "request_id" UUID;

-- AlterTable
ALTER TABLE "leave_request_events" ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "decided_at" TIMESTAMPTZ(3),
ADD COLUMN     "decided_by" UUID;

-- AlterTable
ALTER TABLE "leave_types" ADD COLUMN     "requires_approval" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "manager_id" UUID;

-- CreateIndex
CREATE INDEX "leave_requests_status_created_at_id_idx" ON "leave_requests"("status", "created_at", "id");

-- CreateIndex
CREATE INDEX "users_manager_id_idx" ON "users"("manager_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balance_ledger" ADD CONSTRAINT "leave_balance_ledger_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "leave_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balance_ledger" ADD CONSTRAINT "leave_balance_ledger_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
