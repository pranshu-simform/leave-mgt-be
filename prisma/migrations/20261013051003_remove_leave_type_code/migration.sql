-- The leave type `code` is gone: nothing read it (types are linked by id). The name becomes the
-- unique key instead, which keeps the seed idempotent and still stops a duplicate type.
-- This fails if two leave types already share a name; check before running it on a shared database.

-- DropIndex
DROP INDEX "leave_types_code_key";

-- AlterTable
ALTER TABLE "leave_types" DROP COLUMN "code";

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_name_key" ON "leave_types"("name");
