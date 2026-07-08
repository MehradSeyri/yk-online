const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('No .env file found at', envPath);
  process.exit(1);
}
const env = {};
for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
}
const has = key => !!env[key];
console.log('\n=== Environment Check ===');
console.log('Keys present:', {
  VIVA_ENV: has('VIVA_ENV'),
  VIVA_CLIENT_ID: has('VIVA_CLIENT_ID'),
  VIVA_CLIENT_SECRET: has('VIVA_CLIENT_SECRET'),
  VIVA_SOURCE_CODE: has('VIVA_SOURCE_CODE'),
});

async function getVivaToken() {
  if (!has('VIVA_CLIENT_ID') || !has('VIVA_CLIENT_SECRET')) {
    console.log('\n⚠️  Viva token test skipped: missing credentials');
    return null;
  }
  console.log('\n=== Viva Token Request ===');
  const base = env.VIVA_ENV === 'demo' ? 'https://demo-accounts.vivapayments.com' : 'https://accounts.vivapayments.com';
  console.log('Target:', base);
  const basic = Buffer.from(`${env.VIVA_CLIENT_ID}:${env.VIVA_CLIENT_SECRET}`).toString('base64');
  console.log('Auth: Basic ' + basic.slice(0, 20) + '...');
  
  try {
    const res = await fetch(`${base}/connect/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    });
    const text = await res.text();
    console.log(`Status: ${res.status} ${res.statusText}`);
    if (res.ok) {
      const parsed = JSON.parse(text);
      console.log(`Token acquired (expires in ${parsed.expires_in}s), first 50 chars:`, parsed.access_token.slice(0, 50) + '...');
      return parsed.access_token;
    } else {
      console.log('Error response (first 500 chars):', text.slice(0, 500).replace(/\n/g, ' '));
      return null;
    }
  } catch (err) {
    console.log('Fetch error:', err.message);
    return null;
  }
}

async function testVivaCreateOrder(token) {
  if (!token || !has('VIVA_SOURCE_CODE')) {
    console.log('\n⚠️  Viva create-order test skipped: missing token or VIVA_SOURCE_CODE');
    return;
  }
  
  console.log('\n=== Viva Create Order Test ===');
  const base = env.VIVA_ENV === 'demo' ? 'https://demo.vivapayments.com' : 'https://www.vivapayments.com';
  console.log('Target:', base + '/checkout/v2/orders');
  
  const payload = {
    amount: 23600, // 236.00 CZK in minor units
    customerTrns: 'Test Order',
    customer: {
      email: 'test@example.com',
      fullName: 'Test User',
      phone: undefined,
      countryCode: 'CZ',
      requestLang: 'cs-CZ',
    },
    paymentTimeout: 1800,
    preauth: false,
    allowRecurring: false,
    maxInstallments: 0,
    paymentNotification: true,
    disableExactAmount: false,
    disableCash: true,
    disableWallet: false,
    sourceCode: env.VIVA_SOURCE_CODE,
    merchantTrns: 'test-' + Math.random().toString(36).slice(2, 8),
    currencyCode: 203, // CZK
  };
  
  // Strip undefined
  const cleanPayload = JSON.parse(JSON.stringify(payload));
  console.log('Payload:', JSON.stringify(cleanPayload, null, 2).slice(0, 400) + '...');
  
  try {
    const res = await fetch(`${base}/checkout/v2/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(cleanPayload),
    });
    const text = await res.text();
    console.log(`Status: ${res.status} ${res.statusText}`);
    if (res.ok) {
      const parsed = JSON.parse(text);
      console.log('✅ Success! orderCode:', parsed.orderCode);
      console.log('Response (first 500 chars):', JSON.stringify(parsed).slice(0, 500));
    } else {
      console.log('Error response (first 800 chars):', text.slice(0, 800).replace(/\n/g, ' '));
    }
  } catch (err) {
    console.log('Fetch error:', err.message);
  }
}

(async () => {
  const token = await getVivaToken();
  if (token) {
    await testVivaCreateOrder(token);
  }
  console.log('\n=== Done ===\n');
})();
