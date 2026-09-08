-- Inventory movements are immutable; this key makes retries return the same
-- committed operation instead of changing stock twice.
ALTER TABLE "inventory_movements"
  ADD COLUMN "idempotency_key" VARCHAR(128) NOT NULL;

CREATE UNIQUE INDEX "inventory_movements_idempotency_key_key"
  ON "inventory_movements"("idempotency_key");
