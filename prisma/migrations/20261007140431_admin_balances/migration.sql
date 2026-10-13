-- AlterEnum
ALTER TYPE "LedgerReason" ADD VALUE 'ADJUSTMENT';

-- AlterTable
ALTER TABLE "leave_balance_ledger" ADD COLUMN     "note" TEXT;

-- CreateIndex
CREATE INDEX "leave_balance_ledger_balance_id_idx" ON "leave_balance_ledger"("balance_id");
