# AMARAM - Sistema de Gestion de Inventario

Sistema web de gestion y control de inventario de AMARAM.

## Estructura

- frontend/: aplicacion React + TypeScript + Vite.
- backend/: API Node.js + Express + TypeScript.
- database/: reservado para documentacion y recursos de base de datos.

El esquema esta en backend/prisma/schema.prisma. Prisma Migrate administra las
migraciones y el seed inicial de categorias, programas y usuarios bootstrap.

## Backend

Usar Node.js 22 LTS o una version posterior compatible con `engines`, y npm.
Ejecutar desde backend/.
En PowerShell usar npm.cmd si la politica local bloquea npm.ps1.
Para reproducir las dependencias en otro equipo: npm.cmd ci.

Crear el entorno local (no se ha creado automaticamente):

~~~powershell
Copy-Item .env.example .env
~~~

Editar .env:

~~~dotenv
DATABASE_URL="postgresql://USUARIO:CONTRASENA_CODIFICADA@localhost:5432/amaram_inventario_db?schema=public"
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:8443
SESSION_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
~~~

Sustituir las credenciales de ejemplo por las locales. Codificar como componente
de URL los caracteres especiales de la contrasena. No subir .env a Git.
SESSION_SECRET debe tener al menos 32 caracteres. PORT es opcional y usa 3000
por defecto. En produccion, CORS_ORIGIN debe contener el origen exacto del
frontend. Las variables Cloudinary son necesarias para gestionar imagenes.
Las contrasenas de usuarios bootstrap usadas por el seed deben contener al
menos 12 caracteres y no se reemplazan si el usuario ya existe.

~~~powershell
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run build
npm.cmd run start
~~~

dev inicia con recarga; start requiere build previo. No ejecutar ambos al mismo
tiempo en el mismo puerto.

GET http://localhost:3000/api/v1/health

~~~json
{"status":"ok","service":"AMARAM API","database":"connected"}
~~~

Health verifica la API y PostgreSQL. CORS usa CORS_ORIGIN; el ejemplo local es
http://localhost:8443.

## Prisma

prisma.config.ts lee DATABASE_URL del entorno. El esquema declara PostgreSQL
y el generador prisma-client con salida src/generated/prisma. En produccion se
debe ejecutar `prisma migrate deploy`; no usar `migrate reset` ni `db push`.
