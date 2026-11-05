import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../app.js';

let tokenAdmin;
let tokenCliente;
let idProductoTest;

before(async () => {
  // Login de los usuarios del seed
  const loginAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'nataliasuer@gmail.com', password: 'admin123' });
  tokenAdmin = loginAdmin.body.token;
  const loginCliente = await request(app)
    .post('/api/auth/login')
    .send({ email: 'cliente@testing.com', password: 'cliente123' });
  tokenCliente = loginCliente.body.token;
});

test('GET / responde ok', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('GET /api/productos es público y devuelve un array', async () => {
  const res = await request(app).get('/api/productos');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length > 0);
});

test('GET /api/categorias es público', async () => {
  const res = await request(app).get('/api/categorias');
  assert.equal(res.status, 200);
  assert.ok(res.body.length >= 3);
});

test('login con credenciales correctas devuelve token', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'cliente@testing.com', password: 'cliente123' });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test('login con password incorrecta da 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'cliente@testing.com', password: 'mal' });
  assert.equal(res.status, 401);
});

test('GET /api/pedidos sin token da 401', async () => {
  const res = await request(app).get('/api/pedidos');
  assert.equal(res.status, 401);
});

test('POST /api/productos sin token da 401', async () => {
  const res = await request(app).post('/api/productos').send({ nombre: 'X' });
  assert.equal(res.status, 401);
});

test('POST /api/productos con rol cliente da 403', async () => {
  const res = await request(app)
    .post('/api/productos')
    .set('Authorization', `Bearer ${tokenCliente}`)
    .send({ nombre: 'X', descripcion: 'Y', precio: 1, iva: 10, id_categoria: 1 });
  assert.equal(res.status, 403);
});

test('POST /api/productos con admin crea (201) y DELETE admin lo borra (200)', async () => {
  const creado = await request(app)
    .post('/api/productos')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      nombre: 'Producto test Jest',
      descripcion: 'Creado por el test',
      precio: 2.50,
      iva: 10,
      stock: 1,
      id_categoria: 1,
    });
  assert.equal(creado.status, 201);
  idProductoTest = creado.body.id_producto;
  assert.ok(idProductoTest);

  const borrado = await request(app)
    .delete(`/api/productos/${idProductoTest}`)
    .set('Authorization', `Bearer ${tokenAdmin}`);
  assert.equal(borrado.status, 200);

  const GET = await request(app).get(`/api/productos/${idProductoTest}`);
  assert.equal(GET.status, 404);
});

test('POST /api/productos con admin y categoría inexistente da 400', async () => {
  const res = await request(app)
    .post('/api/productos')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ nombre: 'X', descripcion: 'Y', precio: 1, iva: 10, id_categoria: 9999 });
  assert.equal(res.status, 400);
});

test('GET /api/usuarios con cliente da 403 y con admin 200 sin password_hash', async () => {
  const forb = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${tokenCliente}`);
  assert.equal(forb.status, 403);

  const ok = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${tokenAdmin}`);
  assert.equal(ok.status, 200);
  assert.ok(!JSON.stringify(ok.body).includes('password_hash'));
});

test('el endpoint viejo /usuarios ya no existe (404)', async () => {
  const res = await request(app).get('/usuarios');
  assert.equal(res.status, 404);
});
