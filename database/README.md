# Modelo de datos de AMARAM

`amaram.sql` es la referencia DDL de PostgreSQL y
`backend/prisma/schema.prisma` es la fuente ejecutable para Prisma Migrate. El
archivo SQL de referencia no debe ejecutarse manualmente.

## Tablas y relaciones

- `users` contiene cuentas internas, roles y estado.
- `categories` define el código usado en SKU y tiene como máximo un contador.
- `programs` agrupa productos por programa o taller.
- `products` pertenece a una categoría, programa y usuario creador. Conserva un
  `sku_base` único y estable, y tiene variantes e imágenes.
- `product_variants` representa cada combinación normalizada de talla y color.
- `product_images` almacena referencias de Cloudinary, nunca binarios.
- `inventory_movements` conserva el usuario, variante, saldos, cantidad, tipo,
  motivo, fecha y una clave de idempotencia única para evitar aplicaciones
  duplicadas del mismo movimiento.
- `sku_counters` conserva el último número utilizado por cada categoría.

Las claves foráneas protegen los registros relacionados. Las imágenes se
eliminan junto con su producto; los registros ligados al historial usan
`RESTRICT`.

## Stock y movimientos

El saldo inicial de toda variante es `0`. El primer stock se registrará como un
movimiento `ENTRY`; el stock no se edita desde los endpoints de producto.

`stock` y `minimum_stock` no admiten negativos. Cada movimiento verifica saldos
no negativos y su efecto:

- `ENTRY`: cantidad positiva que suma al saldo.
- `EXIT`: cantidad positiva que resta y no puede producir saldo negativo.
- `ADJUSTMENT`: cantidad con signo que representa la diferencia aplicada.

El historial no se elimina. Las correcciones se registran mediante movimientos
nuevos. Los estados disponible, bajo stock y sin stock se calcularán usando
`stock` y `minimum_stock`.

Cada cambio de stock se ejecuta en una transacción que bloquea la fila de la
variante. `idempotency_key` identifica una operación lógica: repetirla devuelve
el movimiento existente y no vuelve a modificar el saldo.

## SKU

El SKU no depende del UUID. Al crear un producto, el backend incrementa de forma
atómica `sku_counters.last_number` dentro de la misma transacción y construye
`AMA-{CATEGORY_CODE}-{NUMBER}`. El número se rellena con al menos cuatro dígitos
y nunca se reutiliza.

Las variantes conservan la base del producto y agregan códigos normalizados de
talla y color. `size_key` y `color_key` son claves internas obligatorias; usan
`UNI` y `STD` cuando el dato visible es nulo. La clave única
`product_id + size_key + color_key` evita duplicados por espacios, diferencias
de mayúsculas/minúsculas y diacríticos, incluso con valores nulos.
