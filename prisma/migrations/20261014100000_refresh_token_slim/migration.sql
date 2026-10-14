-- Three columns of refresh_tokens go. user_agent and ip were written at every login and refresh and
-- never read. family_id only grouped the tokens of one sign-in so a reused token could revoke them;
-- reuse now revokes all of the person's refresh tokens instead, which needs no group. The values in
-- these columns are discarded. Existing sessions keep working (token_hash, expires_at and revoked_at
-- are untouched).

-- DropIndex
DROP INDEX "refresh_tokens_family_id_idx";

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "family_id",
DROP COLUMN "ip",
DROP COLUMN "user_agent";
