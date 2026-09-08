-- Product SKU base is generated once and remains stable for all its variants.
ALTER TABLE "products"
  ADD COLUMN "sku_base" VARCHAR(80) NOT NULL;

-- Normalized keys make product/size/color uniqueness reliable for NULL values
-- and presentation differences such as spaces, case and diacritics.
ALTER TABLE "product_variants"
  ADD COLUMN "size_key" VARCHAR(30) NOT NULL,
  ADD COLUMN "color_key" VARCHAR(80) NOT NULL;

DROP INDEX "product_variants_product_id_size_color_key";
DROP INDEX "product_variants_product_size_color_not_null_key";
DROP INDEX "product_variants_product_size_null_color_key";
DROP INDEX "product_variants_product_null_size_color_key";
DROP INDEX "product_variants_product_null_size_null_color_key";

CREATE UNIQUE INDEX "products_sku_base_key"
  ON "products"("sku_base");

CREATE UNIQUE INDEX "product_variants_product_id_size_key_color_key_key"
  ON "product_variants"("product_id", "size_key", "color_key");
