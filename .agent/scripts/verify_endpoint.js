
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile =
  process.env.ENV_FILE ||
  (fs.existsSync('.env.test')
    ? '.env.test'
    : fs.existsSync('.env.local')
      ? '.env.local'
      : '.env');

require('dotenv').config({ path: envFile });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL =
  process.env.TEST_USER_ADMIN ||
  process.env.TEST_USER_DEPOSITO ||
  process.env.TEST_USER_VENTAS ||
  process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing env vars: SUPABASE_URL / SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Missing credentials: TEST_USER_* / TEST_PASSWORD');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const defaultDesde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const fechaDesde = process.env.REPORTES_FECHA_DESDE || defaultDesde;

async function run() {
  console.log(`Using env file: ${envFile}`);
  console.log('Authenticating...');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError) {
    console.error('Auth failed:', authError.message || authError);
    process.exit(1);
  }

  const token = authData.session?.access_token;
  if (!token) {
    console.error('Auth succeeded but no access_token present.');
    process.exit(1);
  }

  const url = new URL(`${SUPABASE_URL}/functions/v1/api-minimarket/reportes/efectividad-tareas`);
  url.searchParams.set('fecha_desde', fechaDesde);

  console.log('Got JWT. Testing endpoint...');
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      Accept: 'application/json',
    },
  });

  const bodyText = await response.text();
  let bodyPreview = bodyText;
  let parsed = null;
  try {
    parsed = JSON.parse(bodyText);
    const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed || {}).length;
    bodyPreview = `JSON(${count})`;
  } catch {
    if (bodyText.length > 200) {
      bodyPreview = `${bodyText.slice(0, 200)}...`;
    }
  }

  console.log(`Status: ${response.status}`);
  console.log(`Body preview: ${bodyPreview}`);

  if (!response.ok && parsed && typeof parsed === 'object') {
    const code = parsed.code || parsed.error || null;
    const message = parsed.message || parsed.error_description || null;
    if (code || message) {
      console.log(`Error details: code=${code || 'n/a'} message=${message || 'n/a'}`);
    }
  }
}

run().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
