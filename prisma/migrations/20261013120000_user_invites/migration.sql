-- A user HR has just created has no password until they follow the link in their email, so
-- password_hash may be NULL ("invited"). Login already refuses a user without one.
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- One row per set-password link. Only the SHA-256 of the token is stored. A link works once
-- (used_at) and until expires_at.
CREATE TABLE "set_password_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_password_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "set_password_tokens_token_hash_key" ON "set_password_tokens"("token_hash");

CREATE INDEX "set_password_tokens_user_id_idx" ON "set_password_tokens"("user_id");

ALTER TABLE "set_password_tokens" ADD CONSTRAINT "set_password_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
