# Product API Backend

Backend listo para producción de una API de gestión de productos y pedidos con roles, autenticación JWT y persistencia MongoDB.

Esta API está pensada para un marketplace de productos electrónicos donde usuarios pueden comprar, vendedores pueden publicar productos y administradores gestionan roles y pedidos.

## Stack

- Node.js
- TypeScript
- Express 5
- MongoDB (Mongoose)
- Docker multi-stage
- GitHub Actions CI
- pnpm
- JWT Bearer Auth
- Zod validation
- pino logging

## Features principales

- Auth con Bearer JWT
- Roles: `user`, `seller`, `admin`
- Ownership validation en productos y pedidos
- Order state machine con transiciones válidas
- MongoDB transaction para cancelación de pedidos y reposición de stock
- Validación centralizada con Zod
- Error handling global y 404 handler
- Healthcheck expuesto en `/health`
- Docker multi-stage production image
- CI pipeline para lint, build y Docker image

## Arquitectura

La API sigue una arquitectura modular por dominio:

- `auth`: autenticación y autorización
- `users`: registro, login y roles
- `products`: CRUD con ownership
- `orders`: creación, cancelación y state machine
- `admin`: gestión de roles
- `middlewares`: auth, errores y validación

## Variables de entorno

| Variable       | Requerido | Uso                                                    |
| -------------- | --------- | ------------------------------------------------------ |
| `PORT`         | sí        | Puerto en el que arranca el servidor (`src/server.ts`) |
| `MONGO_URI`    | sí        | Cadena de conexión MongoDB                             |
| `TOKEN_SECRET` | sí        | Clave secreta para firmar/verificar JWT                |
| `NODE_ENV`     | no        | Controla el modo de error en middleware                |
| `LOG_LEVEL`    | no        | Nivel de log de `pino`                                 |

El repositorio incluye `.env.example` con un ejemplo de variables.

## Cómo correr local

1. Instala dependencias:

```bash
pnpm install
```

2. Crea un archivo `.env` en la raíz con al menos:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/productdb
TOKEN_SECRET=your-secret-key
```

3. Inicia el servidor en modo desarrollo:

```bash
pnpm dev
```

4. Build y ejecutar la versión compilada:

```bash
pnpm build
node dist/server.js
```

## Cómo correr con Docker

```bash
docker build -t product-api .
docker run -p 3000:3000 --env-file .env product-api
```

> En la imagen final se expone el puerto `3000` y el contenedor ejecuta `node dist/server.js` como usuario no root.

## Deploy

Actualmente no hay un enlace público de deploy documentado.

La API está preparada para despliegue en plataformas como Vercel, Render o Railway gracias a su healthcheck, Docker multi-stage y CI pipeline.

## Endpoints principales

### Health

```text
GET /health
```

### Autenticación

```text
POST   /user/register
POST   /user/login
POST   /user/logout
GET    /user/profile
```

### Productos

```text
GET    /products
GET    /products/my-products
POST   /products
GET    /products/:id
PATCH  /products/:id
DELETE /products/:id
```

### Pedidos

```text
GET    /orders
GET    /orders/my
GET    /orders/seller
POST   /orders
GET    /orders/:id
PATCH  /orders/:id/cancel
PATCH  /orders/:id/status
PATCH  /orders/:id/address
```

### Administración

```text
PATCH /admin/users/:id/role
```

## Autenticación

La API usa tokens JWT en el header `Authorization` con el esquema Bearer:

```http
Authorization: Bearer <token>
```

Los endpoints protegidos requieren este header para acceder a recursos de usuario, productos privados y pedidos.

## Roadmap implementado (Fases 1-7)

- Fase 1: ownership y endpoints seguros con validaciones de permisos
- Fase 2: MongoDB transaction en cancelación de pedidos y stock rollback
- Fase 3: Bearer JWT auth para usuarios y roles
- Fase 4: MongoDB como persistencia activa en el backend
- Fase 5: state machine de órdenes con transiciones válidas
- Fase 6: Docker multi-stage y build container
- Fase 7: healthcheck, CI pipeline, logging y documentación profesional

## Próximo paso recomendado

> Próximo paso: frontend consumiendo la API estable y deployada.
