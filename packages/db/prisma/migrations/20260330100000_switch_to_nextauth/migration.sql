-- Switch from custom auth tables to NextAuth (Auth.js) tables

-- Drop old custom auth tables
DROP TABLE IF EXISTS "magic_links";
DROP TABLE IF EXISTS "sessions";

-- Recreate sessions table for NextAuth
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Create accounts table for NextAuth
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- Create verification_tokens table for NextAuth
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- Add new columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Create unique indexes
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- Add foreign keys
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
