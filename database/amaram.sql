-- AMARAM MVP: PostgreSQL DDL de referencia.
-- Este archivo no inserta datos ni debe ejecutarse durante la fase de diseño.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('ADMIN', 'INVENTORY');
CREATE TYPE inventory_movement_type AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(150) NOT NULL,
  email varchar(320) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'INVENTORY',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  code varchar(20) NOT NULL UNIQUE,
  uses_sizes boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now()
);

CREATE TABLE programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(150) NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_base varchar(80) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  description text NOT NULL,
  history text,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  creator_name varchar(150) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now()
);

CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sku varchar(80) NOT NULL UNIQUE,
  size varchar(30),
  color varchar(80),
  size_key varchar(30) NOT NULL,
  color_key varchar(80) NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  minimum_stock integer NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now()
);

CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  public_id varchar(255) NOT NULL UNIQUE,
  secure_url text NOT NULL,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  width integer CHECK (width > 0),
  height integer CHECK (height > 0),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  UNIQUE (product_id, position)
);

CREATE TABLE inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type inventory_movement_type NOT NULL,
  quantity integer NOT NULL,
  stock_before integer NOT NULL CHECK (stock_before >= 0),
  stock_after integer NOT NULL CHECK (stock_after >= 0),
  reason text NOT NULL CHECK (length(btrim(reason)) > 0),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movement_stock_change CHECK (
    (type = 'ENTRY' AND quantity > 0 AND stock_after = stock_before + quantity)
    OR (type = 'EXIT' AND quantity > 0 AND stock_after = stock_before - quantity)
    OR (type = 'ADJUSTMENT' AND quantity <> 0 AND stock_after = stock_before + quantity)
  )
);

CREATE TABLE sku_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL UNIQUE REFERENCES categories(id) ON DELETE RESTRICT,
  last_number integer NOT NULL DEFAULT 0 CHECK (last_number >= 0),
  updated_at timestamptz(6) NOT NULL DEFAULT now()
);

-- Claves normalizadas con sentinelas para valores nulos.
CREATE UNIQUE INDEX product_variants_product_size_color_key
  ON product_variants (product_id, size_key, color_key);

CREATE INDEX users_active_idx ON users (active);
CREATE INDEX categories_active_idx ON categories (active);
CREATE INDEX programs_active_idx ON programs (active);
CREATE INDEX products_category_id_idx ON products (category_id);
CREATE INDEX products_program_id_idx ON products (program_id);
CREATE INDEX products_created_by_id_idx ON products (created_by_id);
CREATE INDEX products_active_idx ON products (active);
CREATE INDEX product_variants_product_id_idx ON product_variants (product_id);
CREATE INDEX product_variants_active_idx ON product_variants (active);
CREATE INDEX product_images_product_id_idx ON product_images (product_id);
CREATE INDEX inventory_movements_variant_created_at_idx
  ON inventory_movements (variant_id, created_at DESC);
CREATE INDEX inventory_movements_user_created_at_idx
  ON inventory_movements (user_id, created_at DESC);
CREATE INDEX inventory_movements_type_created_at_idx
  ON inventory_movements (type, created_at DESC);

-- Prisma actualiza updatedAt desde la aplicacion. Este trigger conserva la
-- misma semantica si el DDL se usa directamente en PostgreSQL.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER programs_set_updated_at
  BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER sku_counters_set_updated_at
  BEFORE UPDATE ON sku_counters FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- El historial no se borra: las correcciones se registran como nuevos movimientos.
CREATE OR REPLACE FUNCTION prevent_inventory_movement_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'inventory_movements cannot be deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_movements_prevent_delete
  BEFORE DELETE ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION prevent_inventory_movement_delete();
