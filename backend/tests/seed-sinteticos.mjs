#!/usr/bin/env node
/**
 * Seed de datos sintéticos para la API de SweetCode (backend 4000:4000).
 *
 * Requisitos: Node 18+ (usa fetch global). Cero dependencias.
 * Uso:
 *   node seed-sinteticos.mjs
 *   node seed-sinteticos.mjs --usuarios 30 --pedidos-min 1 --pedidos-max 4
 *   node seed-sinteticos.mjs --base http://localhost:4000 --dominio sintetico.test
 *
 * Flujo (respeta los esquemas reales de los endpoints):
 *   1) POST /api/auth/registro  {nombre, apellidos, email, password} -> token (rol cliente)
 *      - Si el email ya existe (409), fallback a POST /api/auth/login
 *   2) GET  /api/auth/perfil    (Bearer) -> id_usuario
 *   3) POST /api/direcciones    {calle, ciudad, codigo_postal, pais, principal} -> id_direccion
 *      (el pedido exige una dirección propiedad del usuario)
 *   4) POST /api/pedidos        {id_direccion, observaciones?, lineas:[{id_producto, cantidad}]}
 *      - El backend valida stock/producto activo y calcula importe_total
 *      - El stock se decrementa en servidor: el script lo refleja en local
 *   5) PUT  /api/pedidos/:id/estado  (staff) -> reparte estados realistas
 *      - Opcional: --estados 0 para desactivarlo, o cambia --staff-email/--staff-pass
 *
 * Genera un reporte JSON (reporte-sinteticos.json) con usuarios, contraseñas y pedidos.
 */

import fs from 'node:fs';
import path from 'node:path';

// ─────────────────────────────────────────────────────────────
// Configuración por línea de comandos (con defaults sensatos)
// ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const arg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : def;
};
const num = (flag, def) => Number(arg(flag, def));

const CONFIG = {
  base: arg('--base', 'http://localhost:4000').replace(/\/$/, ''),
  usuarios: num('--usuarios', 15),
  pedidosMin: num('--pedidos-min', 1),
  pedidosMax: num('--pedidos-max', 3),
  prefijo: arg('--prefijo', 'cliente'),
  dominio: arg('--dominio', 'sintetico.test'),
  password: arg('--password', 'Sintetico123!'),
  // Reparto de estados (suma 1). Solo aplica si el login de staff funciona.
  repartirEstados: arg('--estados', '1') !== '0',
  staffEmail: arg('--staff-email', 'pastelero@testing.com'),
  staffPass: arg('--staff-pass', 'pastelero123'),
};

if (CONFIG.pedidosMin > CONFIG.pedidosMax) {
  console.error('✗ --pedidos-min no puede ser mayor que --pedidos-max');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// Pool de datos sintéticos (campos <= 45 chars, como los modelos)
// ─────────────────────────────────────────────────────────────
const NOMBRES = ['Lucía', 'Martín', 'Sofía', 'Hugo', 'Valeria', 'Mateo', 'Carmen', 'Diego', 'Emma', 'Álvaro', 'Inés', 'Pablo', 'Noa', 'Iker'];
const APELLIDOS = ['García', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Díaz', 'Torres'];
const CALLES = ['Calle de la Amargura', 'Avenida de la Vainilla', 'Calle Canela', 'Paseo del Caramelo', 'Calle Hojaldre', 'Avenida Chocolate', 'Calle Massapà', 'Plaza Turrón'];
const CIUDADES = [
  ['Oviedo', '33001'], ['Madrid', '28001'], ['Barcelona', '08001'], ['Valencia', '46001'],
  ['Sevilla', '41001'], ['Zaragoza', '50001'], ['Bilbao', '48001'], ['Gijón', '33201'],
];
const OBSERVACIONES = [
  'Sin gluten si es posible', 'Entregar por la tarde', 'Para el sábado',
  'Con vela de cumpleaños', 'Sin frutos secos', 'Regalo envuelto', null, null,
];
// Estados de /api/pedidos + pesos para que el panel tenga pinta real
const ESTADOS = [
  ['pendiente', 0.30], ['en_preparacion', 0.20], ['enviado', 0.15],
  ['entregado', 0.25], ['cancelado', 0.10],
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function estadoAleatorio() {
  const dado = Math.random();
  let acc = 0;
  for (const [estado, peso] of ESTADOS) {
    acc += peso;
    if (dado <= acc) return estado;
  }
  return 'pendiente';
}

// ─────────────────────────────────────────────────────────────
// Cliente HTTP contra la API
// ─────────────────────────────────────────────────────────────
async function api(metodo, ruta, { token, body } = {}) {
  const cabeceras = { 'Content-Type': 'application/json' };
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  const res = await fetch(`${CONFIG.base}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let datos = null;
  try { datos = await res.json(); } catch { /* respuesta sin JSON */ }
  return { ok: res.ok, status: res.status, datos };
}

// ─────────────────────────────────────────────────────────────
// Pasos del flujo
// ─────────────────────────────────────────────────────────────
async function comprobarApi() {
  const r = await api('GET', '/');
  if (!r.ok) {
    console.error(`✗ La API no responde en ${CONFIG.base}: ${r.status} ${JSON.stringify(r.datos)}`);
    process.exit(1);
  }
  console.log(`✔ API viva en ${CONFIG.base}`);
}

async function cargarProductos() {
  const r = await api('GET', '/api/productos');
  if (!r.ok || !Array.isArray(r.datos)) {
    console.error(`✗ No puedo leer /api/productos: ${r.status} ${JSON.stringify(r.datos)}`);
    process.exit(1);
  }
  const activos = r.datos.map((p) => ({ id_producto: p.id_producto, nombre: p.nombre, precio: Number(p.precio), stock: p.stock }));
  console.log(`✔ ${activos.length} producto(s) activo(s): ${activos.map((p) => `${p.nombre} (stock ${p.stock})`).join(', ')}`);
  return activos;
}

// Registro con fallback a login si el email ya existe (re-ejecuciones)
async function crearUsuario(i) {
  const nombre = rand(NOMBRES);
  const apellidos = `${rand(APELLIDOS)} ${rand(APELLIDOS)}`;
  const email = `${CONFIG.prefijo}${i}@${CONFIG.dominio}`;
  const password = CONFIG.password;

  let r = await api('POST', '/api/auth/registro', { body: { nombre, apellidos, email, password } });
  if (r.status === 409) {
    console.log(`  ↻ ${email} ya existía, hago login`);
    r = await api('POST', '/api/auth/login', { body: { email, password } });
  }
  if (!r.ok || !r.datos?.token) {
    throw new Error(`registro/login de ${email}: ${r.status} ${JSON.stringify(r.datos)}`);
  }
  const token = r.datos.token;

  const perfil = await api('GET', '/api/auth/perfil', { token });
  if (!perfil.ok) throw new Error(`perfil de ${email}: ${perfil.status} ${JSON.stringify(perfil.datos)}`);

  return { email, password, token, id_usuario: perfil.datos.id_usuario, nombre, apellidos };
}

async function crearDireccion(token) {
  const [ciudad, cp] = rand(CIUDADES);
  const calle = `${rand(CALLES)} ${randInt(1, 120)}`;
  const r = await api('POST', '/api/direcciones', {
    token,
    body: { calle, ciudad, codigo_postal: cp, pais: 'España', principal: 1 },
  });
  if (!r.ok || !r.datos?.id_direccion) {
    throw new Error(`dirección: ${r.status} ${JSON.stringify(r.datos)}`);
  }
  return r.datos;
}

// Líneas respetando el stock local (que refleja los decrementos del servidor)
function montarLineas(productos) {
  const disponibles = productos.filter((p) => p.stock > 0);
  if (disponibles.length === 0) return null;

  const nLineas = Math.min(disponibles.length, randInt(1, 3));
  const elegidos = [...disponibles].sort(() => Math.random() - 0.5).slice(0, nLineas);
  const lineas = [];
  for (const p of elegidos) {
    const cantidad = randInt(1, Math.min(5, p.stock));
    p.stock -= cantidad; // el backend también lo resta; mantenemos el espejo
    lineas.push({ id_producto: p.id_producto, cantidad });
  }
  return lineas;
}

async function crearPedido(token, id_direccion, productos) {
  const lineas = montarLineas(productos);
  if (!lineas) return { sinStock: true };

  const observaciones = rand(OBSERVACIONES);
  const r = await api('POST', '/api/pedidos', {
    token,
    body: { id_direccion, ...(observaciones && { observaciones }), lineas },
  });
  if (!r.ok) {
    // Si el stock cambió por otro lado, devolvemos el error sin romper el script
    console.error(`    ✗ pedido rechazado: ${r.status} ${r.datos?.error ?? JSON.stringify(r.datos)}`);
    return { error: r.datos };
  }
  return { pedido: r.datos };
}

async function loginStaff() {
  const r = await api('POST', '/api/auth/login', { body: { email: CONFIG.staffEmail, password: CONFIG.staffPass } });
  return r.ok && r.datos?.token ? r.datos.token : null;
}

async function cambiarEstado(tokenStaff, id_pedido, estado) {
  const r = await api('PUT', `/api/pedidos/${id_pedido}/estado`, { token: tokenStaff, body: { estado } });
  if (!r.ok) console.error(`    ✗ estado "${estado}" no aplicado a #${id_pedido}: ${r.status} ${JSON.stringify(r.datos)}`);
  return r.ok;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('=== SweetCode · seed de usuarios y pedidos sintéticos ===\n');
  await comprobarApi();
  const productos = await cargarProductos();

  let tokenStaff = null;
  if (CONFIG.repartirEstados) {
    tokenStaff = await loginStaff();
    console.log(tokenStaff
      ? `✔ Login staff OK (${CONFIG.staffEmail}): repartiré estados de pedidos`
      : `⚠ Sin staff (${CONFIG.staffEmail}): los pedidos quedan todos "pendiente". Usa --staff-email/--staff-pass`);
  }

  const reporte = { base: CONFIG.base, fecha: new Date().toISOString(), usuarios: [], resumen: { usuarios: 0, pedidos: 0, importeTotal: 0 } };
  let sinStockGlobal = false;

  for (let i = 1; i <= CONFIG.usuarios; i++) {
    try {
      const usuario = await crearUsuario(i);
      console.log(`\n[${i}/${CONFIG.usuarios}] ${usuario.nombre} ${usuario.apellidos} <${usuario.email}> (id ${usuario.id_usuario})`);

      const direccion = await crearDireccion(usuario.token);
      console.log(`  ✔ dirección #${direccion.id_direccion}: ${direccion.calle}, ${direccion.ciudad} ${direccion.codigo_postal}`);

      const usuarioReporte = { ...usuario, token: undefined, id_direccion: direccion.id_direccion, pedidos: [] };
      const nPedidos = randInt(CONFIG.pedidosMin, CONFIG.pedidosMax);

      for (let j = 1; j <= nPedidos; j++) {
        if (productos.every((p) => p.stock <= 0)) { sinStockGlobal = true; break; }
        const { pedido, sinStock, error } = await crearPedido(usuario.token, direccion.id_direccion, productos);
        if (sinStock) { sinStockGlobal = true; break; }
        if (error) continue;

        let estadoFinal = pedido.estado; // "pendiente" al crearse
        if (tokenStaff) {
          const estado = estadoAleatorio();
          if (await cambiarEstado(tokenStaff, pedido.id_pedido, estado)) estadoFinal = estado;
        }
        const importe = Number(pedido.importe_total);
        usuarioReporte.pedidos.push({ id_pedido: pedido.id_pedido, estado: estadoFinal, importe_total: importe, lineas: pedido.lineas_pedido?.length ?? 0 });
        reporte.resumen.pedidos++;
        reporte.resumen.importeTotal = +(reporte.resumen.importeTotal + importe).toFixed(2);
        console.log(`  ✔ pedido #${pedido.id_pedido} · ${estadoFinal} · ${importe.toFixed(2)} € · ${pedido.lineas_pedido?.length ?? '?'} línea(s)`);
        await sleep(120); // respiro entre peticiones
      }

      reporte.usuarios.push(usuarioReporte);
      reporte.resumen.usuarios++;
      await sleep(200);
    } catch (err) {
      console.error(`  ✗ usuario ${CONFIG.prefijo}${i}@${CONFIG.dominio} descartado: ${err.message}`);
    }
  }

  const fichero = path.join(process.cwd(), 'reporte-sinteticos.json');
  fs.writeFileSync(fichero, JSON.stringify(reporte, null, 2), 'utf8');

  console.log('\n=== Resumen ===');
  console.log(`Usuarios creados/reutilizados: ${reporte.resumen.usuarios}`);
  console.log(`Pedidos creados:              ${reporte.resumen.pedidos}`);
  console.log(`Importe total acumulado:      ${reporte.resumen.importeTotal} €`);
  if (sinStockGlobal) console.log('⚠ Se agotó el stock de algún producto: repón stock (PUT /api/productos/:id) o re-seedea antes de volver a lanzar más pedidos.');
  console.log(`Reporte detallado en: ${fichero}`);
}

main().catch((err) => {
  console.error('✗ Error fatal:', err.message);
  process.exit(1);
});