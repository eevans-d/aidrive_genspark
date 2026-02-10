#!/usr/bin/env node
/**
 * Seed a test product + stock in staging DB for smoke-reservas.
 * Uses service_role key via REST API.
 * Safe to run multiple times (checks for existing SEED-CC-225 first).
 */

import fs from 'node:fs';
import path from 'node:path';

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadDotEnvFile(path.resolve(process.cwd(), '.env.test'));

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('MISSING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(2);
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  // Check if seed product already exists
  const checkRes = await fetch(`${url}/rest/v1/productos?sku=eq.SEED-CC-225&select=id,nombre`, { headers });
  const existing = await checkRes.json();

  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`PRODUCT_EXISTS: ${existing[0].nombre} (${existing[0].id})`);

    // Check stock
    const stockCheck = await fetch(`${url}/rest/v1/stock_deposito?producto_id=eq.${existing[0].id}&select=id,cantidad_actual`, { headers });
    const stockData = await stockCheck.json();
    if (Array.isArray(stockData) && stockData.length > 0) {
      console.log(`STOCK_EXISTS: cantidad=${stockData[0].cantidad_actual}`);
      console.log('SEED: already done, skipping');
      return;
    }

    // Add stock if missing
    const stockRes = await fetch(`${url}/rest/v1/stock_deposito`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        producto_id: existing[0].id,
        cantidad_actual: 50,
        stock_minimo: 5,
        stock_maximo: 100,
        ubicacion: 'Principal',
      }),
    });
    const stock = await stockRes.json();
    console.log(`STOCK_CREATED: cantidad=${stock[0]?.cantidad_actual}`);
    console.log('SEED: stock added');
    return;
  }

  // Create product
  const prodRes = await fetch(`${url}/rest/v1/productos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nombre: 'Coca Cola 2.25L',
      sku: 'SEED-CC-225',
      marca: 'Coca Cola',
      categoria: 'Bebidas',
      precio_actual: 1850.00,
      precio_costo: 1200.00,
      activo: true,
    }),
  });

  if (!prodRes.ok) {
    const err = await prodRes.text();
    console.error(`PRODUCT_CREATE_FAILED: ${prodRes.status} ${err}`);
    process.exit(1);
  }

  const prodData = await prodRes.json();
  const prod = Array.isArray(prodData) ? prodData[0] : prodData;
  console.log(`PRODUCT_CREATED: ${prod.nombre} (${prod.id})`);

  // Create stock
  const stockRes = await fetch(`${url}/rest/v1/stock_deposito`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      producto_id: prod.id,
      cantidad_actual: 50,
      stock_minimo: 5,
      stock_maximo: 100,
      ubicacion: 'Principal',
    }),
  });

  if (!stockRes.ok) {
    const err = await stockRes.text();
    console.error(`STOCK_CREATE_FAILED: ${stockRes.status} ${err}`);
    process.exit(1);
  }

  const stockData = await stockRes.json();
  const stock = Array.isArray(stockData) ? stockData[0] : stockData;
  console.log(`STOCK_CREATED: cantidad=${stock.cantidad_actual} ubicacion=${stock.ubicacion}`);
  console.log('SEED: complete');
}

main().catch((err) => {
  console.error('ERROR: ' + (err?.message || String(err)));
  process.exit(1);
});
