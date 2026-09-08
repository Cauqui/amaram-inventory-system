# Modelo de datos de AMARAM

`amaram.sql` es una referencia DDL para PostgreSQL y `backend/prisma/schema.prisma`
es el modelo Prisma equivalente. Ninguno inserta datos. En esta etapa no se han
creado tablas ni migraciones.

## Tablas y relaciones

- `users` contiene cuentas internas, roles y estado.
- `categories` define el codigo para SKU; tiene productos y como maximo un
  `sku_counter`.
- `programs` agrupa productos por programa o taller.
- `products` pertenece a una categoria, programa y usuario creador; tiene
  variantes e imagenes.
- `product_variants` representa cada combinacion de talla/color y su saldo.
- `product_images` almacena referencias Cloudinary, nunca binarios.
- `inventory_movements` conserva el usuario, variante, saldos, cantidad, tipo,
  motivo y fecha de cada operacion.
- `sku_counters` conserva un contador unico por categoria.

Las claves foraneas protegen los registros relacionados. Las imagenes se
eliminan junto con su producto; los registros vinculados al historial usan
`RESTRICT`.

## Stock y movimientos

El saldo inicial de una variante es `0`. El primer stock se registrara despues
como un movimiento `ENTRY`; no debe editarse directamente.

`stock` y `minimum_stock` no admiten negativos. En PostgreSQL, cada movimiento
verifica saldos no negativos y su efecto:

- `ENTRY`: cantidad positiva que suma al saldo.
- `EXIT`: cantidad positiva que resta; no puede producir saldo negativo.
- `ADJUSTMENT`: cantidad con signo que representa la diferencia aplicada.

El historial no se elimina: el DDL rechaza `DELETE` sobre movimientos. Las
correcciones se registran como movimientos nuevos. Disponible, bajo stock y sin
stock se calcularan posteriormente usando `stock` y `minimum_stock`.

## SKU

El SKU es unico y no depende del UUID. El servicio futuro aumentara
`sku_counters.last_number` en la misma transaccion que crea la variante, usando
`categories.code` y un consecutivo.

La combinacion producto+talla+color es unica incluso cuando talla o color son
nulos. Prisma expresa la clave compuesta; el SQL añade indices parciales porque
PostgreSQL trata `NULL` como distinto en un `UNIQUE` convencional.
