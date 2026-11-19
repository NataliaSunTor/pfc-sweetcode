# SweetCode — Pastelería artesanal (PFC DAW)

Plataforma web completa: venta de productos, pedidos, presupuestos, blog y panel de gestión.

## Stack

- **Front**: React 19 + Bootstrap 5 + react-router (Vite) — build de producción servido por nginx en Docker — puerto **5173**
- **Back**: Node 20 + Express 5, módulos ES (`"type": "module"`) — puerto **4000**
- **BD**: MySQL 8.4 + Sequelize — database-first: el diseño vive en el EER de MySQL
  Workbench (`sweetcode_EER.mwb`) y en `sql/sweetcode_schema.sql`; los modelos en
  `backend/src/models/` SOLO mapean, jamás `sync()`
- **Auth**: bcrypt + JWT. Middleware `proteger` y `soloRoles(...roles)` en `backend/src/routes/auth.js`
- **Docs**: Swagger UI en http://localhost:4000/api-docs (swagger-jsdoc)
- **Tests**: `node:test` + Supertest → `docker compose exec backend npm test` (12 tests)
- **Dashboards**: Grafana (provisioning automático de datasource MySQL + 3 dashboards) — http://localhost:3001
- Todo dockerizado con `docker compose`

## Estructura

```
├── docker-compose.yml      # mysql, backend, frontend, grafana
├── .env                    # credenciales *(copiar de .env.example)
├── .env.example            # plantilla de variables de entorno
├── CONTEXT.md              # estado del proyecto y convenciones (importante leerlo)
├── sql/                    # diseño de la BD (database-first)
│   ├── sweetcode_schema.sql   # CREATE TABLE con FKs
│   └── sweetcode_EER.mwb      # diagrama EER de MySQL Workbench (fuente real)
├── backend/
│   ├── app.js              # crea y exporta la app Express (sin listen; para tests)
│   ├── index.js            # arranca el servidor (listen)
│   ├── src/config/         # db.js, auth.js (JWT), swagger.js
│   ├── src/models/         # MAYÚSCULAS: Usuario.js, Producto.js, Pedido.js, ... + relaciones.js
│   ├── src/routes/         # auth, productos, pedidos, direcciones, presupuestos, articulos,
│   │                       # categorias, usuarios, upload  (cada endpoint con @openapi)
│   ├── src/seed.js         # datos demo estáticos (vacía tablas y repuebla; re-ejecutable)
│   ├── tests/api.test.js   # 12 tests (node:test + Supertest)
│   └── uploads/            #  imágenes servidas en /uploads (las 7 de la demo SÍ se commitean; las subidas por usuarios, no)
└── frontend/
    ├── DockerFile          # build Vite + nginx
    ├── nginx/default.conf   # SPA fallback (try_files → /index.html)
    └── src/                # React: tienda, carrito, blog, cuenta, panel admin/staff
```

## Arranque

Windows/Powershell
```bash
Copy-Item .env.example .env
docker compose up -d

# crea las tablas (database-first: la estructura la manda el EER)
Get-Content sql/sweetcode_schema.sql | docker compose exec -T mysql mysql -usweetcode_user -psweetcode_pass sweetcode

# poblar la BD con los datos demo (siempre desde dentro del contenedor)
docker compose exec backend node src/seed.js

# (opcional) correr los tests
docker compose exec backend npm test
```

Linux/macOS
```bash
cp .env.example .env
docker compose up -d

docker compose exec -T mysql mysql -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < sql/sweetcode_schema.sql
docker compose exec backend node src/seed.js
docker compose exec backend npm test
```

- API: http://localhost:4000 
— Swagger: http://localhost:4000/api-docs
- Front (build nginx): http://localhost:5173
- MySQL Workbench: 127.0.0.1:3306 (user/pass en `.env`)
- Grafana: http://localhost:3001 (datasource y dashboards provisionados al arrancar)


### Cuentas demo (tras el seed)

| Rol | Email | Contraseña |
|---|---|---|
| admin | adming@testing.com | admin123 |
| pastelero | pastelero@testing.com | pastelero123 |
| cliente | cliente@testing.com | cliente123 |
| cliente | luis@testing.com | cliente123 |

> El seed debe ejecutarse **dentro del contenedor** (`docker compose exec backend ...`):
> el host `mysql` solo se resuelve en la red interna de Docker, nunca desde Windows.



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

## Frontend

App React 19 (Vite) con Bootstrap 5, contextos de `AuthContext` (sesión JWT) y `CartContext`
(carrito en localStorage), rutas públicas (inicio, tienda, detalle de producto, blog, carrito,
login, registro) y protegidas por rol:

- `/cuenta` — perfil, direcciones, pedidos y presupuestos del cliente (`RutaProtegida`)
- `/admin/*` — panel de gestión para admin/pastelero: productos, pedidos, presupuestos,
  usuarios (`RutaStaff` + `AdminLayout`)

El build de producción lo sirve nginx con **SPA fallback** (`try_files ... /index.html`),
así que las rutas de react-router sobreviven al refresco (F5) y al enlace directo.

## Decisiones técnicas

- **Database-first**: las tablas se crean desde el EER (Forward Engineer); Sequelize solo mapea.
  Todas las FK son `NO ACTION` → los borrados dependientes se hacen a mano en transacción.
- **Dinero** siempre `DECIMAL(10,2)`, nunca FLOAT. En el modelo Producto, getters convierten a number.
- **Booleanos** como `TINYINT` (0/1), estándar en MySQL.
- **Auth**: JWT 24h en header `Authorization: Bearer`, firmado con `JWT_SECRET` (`.env`).
  `password_hash` excluido del `defaultScope` (scope `conHash` solo para el login).
  `proteger` verifica además que el usuario siga activo; el login rechaza usuarios
  desactivados (baja lógica).
- **CORS** restringido al front: `origin: ['http://localhost:5173']`.
- **Imágenes**: subida real con `multer` a `backend/uploads/`, servidas con `express.static`
  en `/uploads`. El nombre generado (timestamp) cabe en `imagen VARCHAR(45)`.
- **Pedidos**: el servidor calcula `precio_unitario`, `subtotal` e `importe_total` (nunca se
  fía del cliente) y descuenta stock dentro de una transacción.
- **Tests**: `node:test` + Supertest en vez de Jest (Jest choca con los módulos ES).
- **Grafana**: datasource MySQL y 3 dashboards (pedidos, productos, usuarios) provisionados
  desde `grafana/provisioning/`, sin configurar nada a mano.

## Convenciones de código

- Modelos en `backend/src/models/` con archivo en MAYÚSCULAS (`Producto.js`); los imports
  deben coincidir exactamente.
- Las FK se declaran explícitas en el modelo Y en `relaciones.js` (con alias `as`).
- Cada endpoint lleva su comentario `@openapi` con su tag.
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
