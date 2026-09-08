-- CreateTable
CREATE TABLE "user_sessions" (
    "sid" VARCHAR(255) NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "user_sessions_expire_idx" ON "user_sessions"("expire");
