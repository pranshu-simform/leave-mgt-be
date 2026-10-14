-- The optimistic-lock counter only guarded one person editing their own pending request from two
-- tabs (a decided or cancelled request is already refused by the status guard). Nothing else read
-- it, so the column and its values are discarded.
ALTER TABLE "leave_requests" DROP COLUMN "version";
