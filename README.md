# AMARAM - Sistema de Gestion de Inventario

## Estructura

- frontend/: maqueta React + TypeScript + Vite existente, sin cambios.
- backend/: API Node.js + Express + TypeScript.
- database/: reservado para documentacion y recursos de base de datos.

El esquema esta en backend/prisma/schema.prisma. No contiene modelos.
No se han creado migraciones, tablas ni seed.

## Backend

Usar Node.js 24 LTS y npm. Ejecutar desde backend/.
En PowerShell usar npm.cmd si la politica local bloquea npm.ps1.
Para reproducir las dependencias en otro equipo: npm.cmd ci.

Crear el entorno local (no se ha creado automaticamente):

~~~powershell
Copy-Item .env.example .env
~~~

Editar .env:

~~~dotenv
DATABASE_URL="postgresql://USUARIO:CONTRASENA_CODIFICADA@localhost:5432/amaram_inventario_db?schema=public"
SESSION_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
~~~

Sustituir las credenciales de ejemplo por las locales. Codificar como componente
de URL los caracteres especiales de la contrasena. No subir .env a Git.
Las variables de sesiones y Cloudinary quedan vacias en esta etapa.
PORT es opcional (3000 por defecto). Health funciona sin DATABASE_URL.

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
{"status":"ok","service":"AMARAM API"}
~~~

Health verifica la API, no PostgreSQL.
CORS permite http://localhost:8443, el origen local del frontend.

## Prisma

prisma.config.ts lee DATABASE_URL del entorno. El esquema declara PostgreSQL
y el generador prisma-client con salida src/generated/prisma.
src/db/prisma.ts prepara el adaptador de forma diferida, sin abrir conexiones
durante el arranque. PrismaClient se incorporara y generara con los primeros
modelos autorizados. Los scripts no generan cliente ni ejecutan migraciones.
No ejecutar migrate, db push, db pull ni seed durante esta etapa.
