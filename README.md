# SweetCode — Resumen de decisiones de Base de Datos

Resumen de lo decidido hasta ahora para el diseño de la BD (EER en MySQL Workbench). Pensado como contexto para trabajar el código en VS Code con Vibe Code.

## Stack y entorno

- **BD**: MySQL (contenedor Docker ya levantado)
- **ORM previsto**: Sequelize (Node.js/Express)
- **Modelado**: diagrama EER en MySQL Workbench

## Tabla `usuarios`

| Columna | Tipo | Notas |
| --- | --- | --- |
| id_usuario | INT (PK, NN, AI) | Identificador |
| nombre | VARCHAR(45) NN | |
| apellidos | VARCHAR(45) NN | |
| email | VARCHAR(45) NN | Debería ser UNIQUE (pendiente marcar UQ) |
| telefono | VARCHAR(45) | |
| password_hash | VARCHAR(45) | **Revisar longitud**: un hash bcrypt necesita VARCHAR(60); argon2 aún más (VARCHAR(255) recomendado) |
| rol | VARCHAR(45) | Alternativa: ENUM('admin','cliente','pastelero') |
| fecha_alta | DATETIME/TIMESTAMP NN | Con DEFAULT CURRENT_TIMESTAMP si MySQL ≥ 5.6.5 |
| ultimo_acceso | DATETIME/TIMESTAMP | Con DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| activo | TINYINT(1) NN | Booleano: en MySQL `BOOLEAN` es alias de TINYINT(1) |

## Decisiones técnicas sobre tipos

- **Booleanos**: MySQL no tiene BOOLEAN real; `BOOLEAN`/`BOOL` se traducen a `TINYINT(1)`. Guarda 0/1. Es la forma estándar y portátil.
- **Fechas**: `TIMESTAMP` sí existe, pero el desplegable del editor de tablas del **diagrama EER no lo incluye**. Solución: escribir `TIMESTAMP` a mano en el combobox (es editable) o cambiarlo desde el editor de catálogo (Tabla → pestaña Columns).
- **Defaults**: solo una columna TIMESTAMP con `DEFAULT CURRENT_TIMESTAMP` por tabla si MySQL < 5.6.5 (comprobar con `SELECT VERSION();`).

## Relaciones / Foreign Keys

- En el EER las FK **se crean dibujando una relación**, no editando la columna.
- Relación existente: `usuarios` (padre, lado del rombo "1") → `direcciones_entre` (hija, lado "n").
- **Correcto**: rombo junto a `usuarios`; pies de gallo junto a `direcciones_entre`.
- Herramienta usada: *"Place a Relationship Using Existing Columns"* — clic primero en la columna FK de la tabla hija (`direcciones_entre.id_usuario`), después en la PK de la padre (`usuarios.id_usuario`).
- **Pendiente**: en `direcciones_entre` hay una columna duplicada `usuarios_id_usuario` creada automáticamente; hay que borrar una de las dos (dejar `id_usuario` como FK y eliminar `usuarios_id_usuario`, o viceversa).
- El tipo de la columna FK debe coincidir exactamente con la PK referenciada (mismo tipo, mismo UNSIGNED).

## Pendientes de la BD

- [ ] Eliminar columna duplicada `usuarios_id_usuario` en `direcciones_entre`
- [ ] Marcar `email` como UNIQUE
- [ ] Ampliar `password_hash` (mín. VARCHAR(60) para bcrypt; recomendado VARCHAR(255))
- [ ] Confirmar tipo final de `fecha_alta` y `ultimo_acceso` (DATETIME vs TIMESTAMP)
- [ ] Verificar versión de MySQL para defaults CURRENT_TIMESTAMP
- [ ] Definir el resto de entidades del modelo (productos, pedidos, presupuestos, blog, panel)
- [ ] Forward Engineer para generar el script SQL

## Para el código (fase actual)

Orden acordado (con David, tutor): primero toda la parte de código; los diagramas de análisis para el 3-nov saldrán del código ya funcionando.

1. **Conexión y modelos Sequelize**: replicar el EER; empezar por `usuarios` y las dependientes
2. **Autenticación + seeders**: JWT, registro/login, usuarios de prueba (admin, cliente, pastelero)
3. **API REST**: CRUD de productos/categorías → pedidos/presupuestos → blog y panel
4. **Front React + Bootstrap**: consumir la API, empezando por productos

Consejo Docker: montar el código como **volumen** (dependencias instaladas en el host, contenedor solo ejecuta) y red compartida en el `docker-compose` para que `db` y `api` se vean por nombre de servicio.