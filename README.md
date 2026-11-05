# SweetCode — Pastelería artesanal (PFC DAW)

Plataforma web completa: venta de productos, pedidos, presupuestos, blog y panel de gestión.

## Stack

- **Front**: React + Bootstrap — puerto **3000** (build servido por nginx en Docker) — *pendiente*
- **Back**: Node 20 + Express 5, módulos ES (`"type": "module"`) — puerto **4000**
- **BD**: MySQL 8.4 + Sequelize — database-first: el diseño vive en el EER de MySQL
  Workbench (`sweetcode`); los modelos en `backend/src/models/` SOLO mapean, jamás `sync()`
- **Auth**: bcrypt + JWT. Middleware `proteger` y `soloRoles(...roles)` en `backend/src/routes/auth.js`
- **Docs**: Swagger UI en http://localhost:4000/api-docs (swagger-jsdoc)
- **Tests**: `node:test` + Supertest → `docker compose exec backend npm test` (12 tests)
- Todo dockerizado con `docker compose`

## Estructura

```
├── docker-compose.yml      # mysql, backend, frontend, grafana
├── .env                    # credenciales (no subir a repos públicos)
├── CONTEXT.md              # estado del proyecto y convenciones (léelo primero)
├── backend/
│   ├── app.js              # crea y exporta la app Express (sin listen; para tests)
│   ├── index.js            # arranca el servidor (listen)
│   ├── src/config/         # db.js, auth.js (JWT), swagger.js
│   ├── src/models/         # MAYÚSCULAS: Usuario.js, Producto.js, Pedido.js, ... + relaciones.js
│   ├── src/routes/         # auth, productos, pedidos, direcciones, presupuestos, articulos,
│   │                       # categorias, usuarios, upload  (cada endpoint con @openapi)
│   ├── src/seed.js         # datos de prueba (idempotente, findOrCreate)
│   ├── tests/api.test.js   # 12 tests
│   └── uploads/            # imágenes subidas (servidas en /uploads)
└── frontend/               # React (pendiente)
```

## Arranque

```bash
docker compose up -d                 # levantar todo
docker compose logs -f backend       # ver logs del API
docker compose exec backend node src/seed.js   # poblar BD (idempotente)
docker compose exec backend npm test            # correr los tests
```

- API: http://localhost:4000 — Swagger: http://localhost:4000/api-docs
- MySQL Workbench: 127.0.0.1:3306 (user/pass en `.env`)
- Grafana: http://localhost:3001



## API (resumen)

| Recurso | Ruta | Acceso |
|---|---|---|
| Auth | `/api/auth/registro`, `/login`, GET/PUT `/perfil` | registro/login públicos; perfil con token |
| Productos | `/api/productos` | GET público; POST/PUT admin+pastelero; DELETE admin |
| Categorías | `/api/categorias` | GET público; POST/PUT admin+pastelero; DELETE admin (409 si tiene productos/artículos) |
| Pedidos | `/api/pedidos`, `/:id`, `/:id/estado` | GET: dueño o staff; POST: autenticado (calcula importes y descuenta stock en transacción); PUT estado: staff; DELETE: admin |
| Direcciones | `/api/direcciones` | dueño o staff; DELETE 409 si tiene pedidos |
| Presupuestos | `/api/presupuestos`, `/:id/respuesta`, `/:id/estado` | GET: dueño o staff; POST: autenticado; respuesta/estado: staff (el dueño solo acepta/rechaza) |
| Blog | `/api/articulos` | GET público solo publicados (staff ven borradores); POST/PUT staff; DELETE admin |
| Usuarios | `/api/usuarios` | solo admin (listar, cambiar rol/activo, baja lógica) |
| Imágenes | `POST /api/upload` → `/uploads/<file>` | solo staff; máx 5 MB, solo imágenes |

## Decisiones técnicas (para la memoria)

- **Database-first**: 8 tablas creadas desde el EER (Forward Engineer); Sequelize solo mapea.
  Todas las FK son `NO ACTION` → los borrados dependientes se hacen a mano en transacción.
- **Dinero** siempre `DECIMAL(10,2)`, nunca FLOAT. En el modelo Producto, getters convierten a number.
- **Booleanos** como `TINYINT` (0/1), estándar en MySQL.
- **Auth**: JWT 24h en header `Authorization: Bearer`. `password_hash` excluido del
  `defaultScope` (scope `conHash` solo para el login). `proteger` verifica además que el
  usuario siga activo; el login rechaza usuarios desactivados (baja lógica).
- **CORS** restringido al front: `origin: ['http://localhost:3000', 'http://localhost:5173']`.
- **Imágenes**: subida real con `multer` a `backend/uploads/`, servidas con `express.static`
  en `/uploads`. El nombre generado (timestamp) cabe en `imagen VARCHAR(45)`.
- **Pedidos**: el servidor calcula `precio_unitario`, `subtotal` e `importe_total` (nunca se
  fía del cliente) y descuenta stock dentro de una transacción.
- **Tests**: `node:test` + Supertest en vez de Jest (Jest choca con los módulos ES).

## Convenciones de código

- Modelos en `backend/src/models/` con archivo en MAYÚSCULAS (`Producto.js`); los imports
  deben coincidir exactamente (Docker corre Linux).
- Las FK se declaran explícitas en el modelo Y en `relaciones.js` (con alias `as`).
- Cada endpoint nuevo lleva su comentario `@openapi` con su tag.
- Desarrollo con nodemon dentro del contenedor: `command: npm run dev` en el compose
  (`CHOKIDAR_USEPOLLING=true` necesario en Windows).

## OJO al instalar paquetes en el backend

El volumen `backend_node_modules` se crea copiando la imagen; tras `npm install <pkg>` en
`backend/` hay que reconstruir y resetear el volumen:

```bash
docker compose build --no-cache backend
docker rm -f sweetcode-backend
docker volume rm -f sweetcode_codigo_backend_node_modules
docker compose up -d backend
```

## Pendiente

- Front React + Bootstrap consumiendo la API (puerto 3000; CORS ya permite 3000 y 5173).

---
*Historial de diseño de la BD (EER, tipos, FKs) archivado: ver git/versiones anteriores de este README.*
