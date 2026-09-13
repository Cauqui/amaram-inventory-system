-- CreateEnum
CREATE TYPE "UserAuditAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'ROLE_CHANGED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'PASSWORD_RESET', 'PASSWORD_CHANGED_SELF');

-- CreateTable
CREATE TABLE "user_audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "target_user_id" UUID,
    "action" "UserAuditAction" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_audit_logs_target_user_id_created_at_idx" ON "user_audit_logs"("target_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_audit_logs_actor_user_id_created_at_idx" ON "user_audit_logs"("actor_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_audit_logs_action_created_at_idx" ON "user_audit_logs"("action", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
