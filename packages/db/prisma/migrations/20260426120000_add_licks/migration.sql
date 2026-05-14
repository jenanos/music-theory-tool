-- CreateTable
CREATE TABLE "licks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "key" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tuning" TEXT,
    "data" JSONB NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "user_id" TEXT,
    "group_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "licks_user_id_idx" ON "licks"("user_id");

-- CreateIndex
CREATE INDEX "licks_group_id_idx" ON "licks"("group_id");

-- CreateIndex
CREATE INDEX "licks_visibility_idx" ON "licks"("visibility");

-- AddForeignKey
ALTER TABLE "licks" ADD CONSTRAINT "licks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licks" ADD CONSTRAINT "licks_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
