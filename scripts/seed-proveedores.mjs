#!/usr/bin/env node
/**
 * seed-proveedores.mjs — Seeds proveedores table from BRIEFING data.
 *
 * Usage:
 *   node scripts/seed-proveedores.mjs --dry-run     # Preview (default)
 *   node scripts/seed-proveedores.mjs --execute      # Insert into Supabase
 *
 * Env required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from .env.test)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function normalizeCuit(cuit) {
  if (!cuit) return null;
  const digits = String(cuit).replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  }
  return String(cuit).trim();
}

// Load .env.test
function loadEnv() {
  const envPath = resolve(ROOT, '.env.test');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim();
        process.env[key] = val;
      }
    }
  } catch {
    console.error('ERROR: No se encontró .env.test');
    process.exit(1);
  }
}

// Proveedores from briefing (section 9)
const PROVEEDORES = [
  {
    nombre: 'Logismar S.R.L. (La Galletera)',
    contacto: 'La Galletera',
    cuit: '30-70804363-6',
    productos_ofrecidos: ['Galletitas artesanales', 'Panadería', 'Panificación'],
    activo: true,
  },
  {
    nombre: 'CPV S.R.L.',
    contacto: 'CPV S.R.L.',
    cuit: '33-66641681-9',
    sitio_web: 'cpvsrl.com.ar',
    productos_ofrecidos: ['Fargo', 'Lucchetti', 'Matarazzo', 'Don Vicente', 'Manteca Paulina', 'Jet Food', 'Granja del Sol'],
    activo: true,
  },
  {
    nombre: 'AceituMar S.A.',
    contacto: 'AceituMar S.A. / La Delfina',
    cuit: '30715335197',
    direccion: 'Victoriano Montes 3664, Mar del Plata',
    productos_ofrecidos: ['Frutos secos', 'Chocolates confitados', 'Snacks', 'Condimentos'],
    activo: true,
  },
  {
    nombre: 'Terramare del Sur S.R.L.',
    contacto: 'Terramare del Sur S.R.L. (Mondelez/Terrabusi)',
    cuit: '30711368264',
    direccion: 'Calle 53 N° 1870, Necochea',
    telefono: '02262-428399',
    productos_ofrecidos: ['Milka', 'Oreo', 'Pepitos', 'Rhodesia', 'Tita', 'Tang', 'Clight'],
    activo: true,
  },
  {
    nombre: 'Urrestarazu y Cedeira S.R.L.',
    contacto: 'Bodega Cedeira S.A.',
    productos_ofrecidos: ['Vinos', 'Licores', 'Aperitivos', 'Fernet', 'Whisky'],
    activo: true,
  },
  {
    nombre: 'Coca-Cola FEMSA Argentina',
    contacto: 'Coca-Cola',
    productos_ofrecidos: ['Coca-Cola', 'Sprite', 'Fanta', 'Aquarius', 'Monster', 'Powerade'],
    activo: true,
  },
  {
    nombre: 'Cervecería y Maltería Quilmes',
    contacto: 'Quilmes',
    productos_ofrecidos: ['Quilmes', 'Brahma', 'Stella Artois', 'Pepsi', '7 Up', 'Gatorade'],
    activo: true,
  },
  {
    nombre: 'Mastellone Hnos. S.A. (La Serenísima)',
    contacto: 'La Serenísima',
    productos_ofrecidos: ['Leche', 'Manteca', 'Crema', 'Yogur', 'Queso'],
    activo: true,
  },
  {
    nombre: 'La Virginia S.A.',
    contacto: 'La Virginia',
    productos_ofrecidos: ['Café', 'Té', 'Yerba mate'],
    activo: true,
  },
  {
    nombre: 'Maxiconsumo S.A.',
    contacto: 'Maxiconsumo',
    productos_ofrecidos: ['Mayorista genérico'],
    activo: true,
  },
  {
    nombre: 'Frutas y Verduras Bicho',
    contacto: 'Bicho (proveedor local)',
    productos_ofrecidos: ['Frutas frescas', 'Verduras frescas', 'Hierbas frescas'],
    activo: true,
  },
  {
    nombre: 'Multienvase S.R.L.',
    contacto: 'Multienvases',
    productos_ofrecidos: ['Vasos descartables', 'Cubiertos', 'Bolsas', 'Film'],
    activo: true,
  },
];

async function main() {
  const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
  loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.test');
    process.exit(1);
  }

  console.log(`\n=== Seed Proveedores [${mode.toUpperCase()}] ===\n`);

  // Check existing proveedores
  const existRes = await fetch(`${supabaseUrl}/rest/v1/proveedores?select=id,nombre,cuit`, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
  });
  const existing = await existRes.json();
  console.log(`Proveedores existentes en BD: ${existing.length}`);

  const existingCuits = new Set(
    existing
      .map(p => normalizeCuit(p.cuit))
      .filter(Boolean),
  );
  const existingNames = new Set(existing.map(p => p.nombre));

  let toInsert = [];
  for (const prov of PROVEEDORES) {
    const normalizedCuit = normalizeCuit(prov.cuit);
    const skip = (normalizedCuit && existingCuits.has(normalizedCuit)) || existingNames.has(prov.nombre);
    if (skip) {
      console.log(`  SKIP: ${prov.nombre} (ya existe)`);
    } else {
      toInsert.push({ ...prov, cuit: normalizedCuit });
      console.log(`  INSERT: ${prov.nombre} ${normalizedCuit ? `(CUIT: ${normalizedCuit})` : '(sin CUIT)'}`);
    }
  }

  if (toInsert.length === 0) {
    console.log('\nNo hay proveedores nuevos para insertar.');
    return;
  }

  if (mode === 'dry-run') {
    console.log(`\n[DRY-RUN] Se insertarían ${toInsert.length} proveedores. Usar --execute para confirmar.`);
    return;
  }

  // Execute inserts (one by one to avoid key mismatch with PostgREST)
  const inserted = [];
  for (const prov of toInsert) {
    // Normalize: ensure all have the same keys
    const record = {
      nombre: prov.nombre,
      contacto: prov.contacto || null,
      cuit: prov.cuit || null,
      email: prov.email || null,
      telefono: prov.telefono || null,
      direccion: prov.direccion || null,
      sitio_web: prov.sitio_web || null,
      productos_ofrecidos: prov.productos_ofrecidos || null,
      activo: prov.activo ?? true,
    };

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/proveedores`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(record),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error(`  ERROR: ${prov.nombre} — ${insertRes.status}: ${err}`);
      continue;
    }

    const data = await insertRes.json();
    const p = Array.isArray(data) ? data[0] : data;
    inserted.push(p);
    console.log(`  ✓ ${p.nombre} → id: ${p.id}`);
  }

  console.log(`\nInsertados exitosamente: ${inserted.length} proveedores`);
}

main().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
