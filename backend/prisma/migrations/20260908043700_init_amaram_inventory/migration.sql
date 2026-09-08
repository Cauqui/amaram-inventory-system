-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'INVENTORY');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'INVENTORY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "uses_sizes" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "history" TEXT,
    "category_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "creator_name" VARCHAR(150) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" VARCHAR(80) NOT NULL,
    "size" VARCHAR(30),
    "color" VARCHAR(80),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "public_id" VARCHAR(255) NOT NULL,
    "secure_url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stock_before" INTEGER NOT NULL,
    "stock_after" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku_counters" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sku_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_active_idx" ON "users"("active");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE INDEX "categories_active_idx" ON "categories"("active");

-- CreateIndex
CREATE INDEX "programs_active_idx" ON "programs"("active");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_program_id_idx" ON "products"("program_id");

-- CreateIndex
CREATE INDEX "products_created_by_id_idx" ON "products"("created_by_id");

-- CreateIndex
CREATE INDEX "products_active_idx" ON "products"("active");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_active_idx" ON "product_variants"("active");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_size_color_key" ON "product_variants"("product_id", "size", "color");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_public_id_key" ON "product_images"("public_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_product_id_position_key" ON "product_images"("product_id", "position");

-- CreateIndex
CREATE INDEX "inventory_movements_variant_id_created_at_idx" ON "inventory_movements"("variant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "inventory_movements_user_id_created_at_idx" ON "inventory_movements"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "inventory_movements_type_created_at_idx" ON "inventory_movements"("type", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sku_counters_category_id_key" ON "sku_counters"("category_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku_counters" ADD CONSTRAINT "sku_counters_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PostgreSQL-specific business constraints approved for the MVP.
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_stock_nonnegative"
    CHECK ("stock" >= 0),
  ADD CONSTRAINT "product_variants_minimum_stock_nonnegative"
    CHECK ("minimum_stock" >= 0);

ALTER TABLE "product_images"
  ADD CONSTRAINT "product_images_position_nonnegative"
    CHECK ("position" >= 0),
  ADD CONSTRAINT "product_images_width_positive"
    CHECK ("width" IS NULL OR "width" > 0),
  ADD CONSTRAINT "product_images_height_positive"
    CHECK ("height" IS NULL OR "height" > 0);

ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_stock_before_nonnegative"
    CHECK ("stock_before" >= 0),
  ADD CONSTRAINT "inventory_movements_stock_after_nonnegative"
    CHECK ("stock_after" >= 0),
  ADD CONSTRAINT "inventory_movements_reason_not_blank"
    CHECK (length(btrim("reason")) > 0),
  ADD CONSTRAINT "inventory_movements_stock_change"
    CHECK (
      ("type" = 'ENTRY' AND "quantity" > 0 AND "stock_after" = "stock_before" + "quantity")
      OR ("type" = 'EXIT' AND "quantity" > 0 AND "stock_after" = "stock_before" - "quantity")
      OR ("type" = 'ADJUSTMENT' AND "quantity" <> 0 AND "stock_after" = "stock_before" + "quantity")
    );

ALTER TABLE "sku_counters"
  ADD CONSTRAINT "sku_counters_last_number_nonnegative"
    CHECK ("last_number" >= 0);

-- A regular UNIQUE index treats NULL values as distinct. These partial indexes
-- guarantee one product/talla/color combination for all NULL combinations.
CREATE UNIQUE INDEX "product_variants_product_size_color_not_null_key"
  ON "product_variants" ("product_id", "size", "color")
  WHERE "size" IS NOT NULL AND "color" IS NOT NULL;
CREATE UNIQUE INDEX "product_variants_product_size_null_color_key"
  ON "product_variants" ("product_id", "size")
  WHERE "size" IS NOT NULL AND "color" IS NULL;
CREATE UNIQUE INDEX "product_variants_product_null_size_color_key"
  ON "product_variants" ("product_id", "color")
  WHERE "size" IS NULL AND "color" IS NOT NULL;
CREATE UNIQUE INDEX "product_variants_product_null_size_null_color_key"
  ON "product_variants" ("product_id")
  WHERE "size" IS NULL AND "color" IS NULL;

-- Keep SQL updates aligned with Prisma's @updatedAt fields.
CREATE OR REPLACE FUNCTION "set_updated_at"()
RETURNS trigger AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "users_set_updated_at"
  BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "categories_set_updated_at"
  BEFORE UPDATE ON "categories" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "programs_set_updated_at"
  BEFORE UPDATE ON "programs" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "products_set_updated_at"
  BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "product_variants_set_updated_at"
  BEFORE UPDATE ON "product_variants" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "sku_counters_set_updated_at"
  BEFORE UPDATE ON "sku_counters" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

-- Inventory history is append-only. Corrections must be new movements.
CREATE OR REPLACE FUNCTION "prevent_inventory_movement_delete"()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'inventory_movements cannot be deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "inventory_movements_prevent_delete"
  BEFORE DELETE ON "inventory_movements"
  FOR EACH ROW EXECUTE FUNCTION "prevent_inventory_movement_delete"();
