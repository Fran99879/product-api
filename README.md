# Backend de Aplicación de Productos Electrónicos

Este es el backend para una aplicación de productos electrónicos, construido con Node.js, Express y soporte para múltiples bases de datos (MongoDB, MySQL y sistema de archivos local).

## Características

- Gestión de productos: Crear, leer, actualizar y eliminar productos
- Autenticación de usuarios: Registro, login y logout
- Sistema de pedidos: Crear pedidos, gestionar stock, actualizar estados
- Roles de usuario: Usuario, vendedor y administrador
- Soporte para múltiples bases de datos
- Validación de datos con Zod
- Autenticación JWT
- CORS habilitado

## Tecnologías

- Node.js
- Express.js
- MongoDB (con Mongoose)
- MySQL (con mysql2)
- JWT para autenticación
- Zod para validación
- bcryptjs para hashing de contraseñas

## Instalación

1. Clona el repositorio:
   ```
   git clone <url-del-repositorio>
   cd backend-products
   ```

2. Instala las dependencias:
   ```
   pnpm install
   ```

3. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   PORT=1212
   TOKEN_SECRET=tu_secreto_jwt
   MONGO_URI=mongodb://localhost:27017/productdb
   DATABASE_URL=mysql://root:@localhost:3306/productdb
   ```

4. Configura la base de datos:
   - Para MongoDB: Asegúrate de que MongoDB esté corriendo
   - Para MySQL: Crea una base de datos llamada `productdb` y configura las tablas si es necesario

## Uso

### Iniciar el servidor

Para MongoDB:
```
npm run start:mongodb
```

Para MySQL:
```
npm run start:mysql
```

Para sistema de archivos local:
```
npm run start:local
```

El servidor se iniciará en `http://localhost:1212`

## Endpoints de la API

### Autenticación

- `POST /user/register` - Registrar un nuevo usuario
- `POST /user/login` - Iniciar sesión
- `POST /user/logout` - Cerrar sesión
- `GET /user/profile` - Obtener perfil del usuario

### Productos

- `GET /products` - Obtener todos los productos (opcional: ?brand=marca)
- `GET /products/my-products` - Obtener productos del usuario (solo vendedores/admin)
- `POST /products` - Crear un nuevo producto (solo vendedores/admin)
- `GET /products/:id` - Obtener producto por ID
- `PATCH /products/:id` - Actualizar producto (solo propietario/admin)
- `DELETE /products/:id` - Eliminar producto (solo propietario/admin)

### Pedidos

- `POST /orders` - Crear un nuevo pedido
- `GET /orders/my` - Obtener pedidos del usuario
- `GET /orders/seller` - Obtener pedidos de productos del vendedor (solo vendedores)
- `GET /orders` - Obtener todos los pedidos (solo admin)
- `PUT /orders/:id/status` - Actualizar estado del pedido
- `DELETE /orders/:id` - Eliminar pedido (solo comprador)

## Estructura del Proyecto

```
backend-products/
├── controllers/          # Controladores de la aplicación
├── database/             # Configuración de bases de datos
├── middlewares/          # Middlewares personalizados
├── models/               # Modelos de datos
├── routes/               # Definición de rutas
├── schemas/              # Validaciones con Zod
├── utils/                # Utilidades (JWT)
├── web/                  # Archivos estáticos del frontend
├── index.js              # Punto de entrada
├── package.json          # Dependencias y scripts
└── README.md             # Este archivo
```

## Validación de Datos

Se utiliza Zod para validar los datos de entrada. Los esquemas están definidos en la carpeta `schemas/`.

## Autenticación

La autenticación se maneja con JWT. Los tokens se almacenan en cookies.

## Roles de Usuario

- **Usuario**: Puede crear pedidos y ver sus propios pedidos
- **Vendedor**: Puede crear productos, ver pedidos de sus productos y actualizar estados
- **Administrador**: Tiene acceso completo a todas las funcionalidades

## Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC.