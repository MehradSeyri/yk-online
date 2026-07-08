const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const envFile = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envFile)) {
  console.error('.env not found');
  process.exit(1);
}
for (const raw of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [key, ...rest] = line.split('=');
  process.env[key.trim()] = rest.join('=').trim();
}
const baseToken = process.env.VIVA_ENV === 'demo' ? 'https://demo-accounts.vivapayments.com' : 'https://accounts.vivapayments.com';
const baseCreate = process.env.VIVA_ENV === 'demo' ? 'https://demo.vivapayments.com' : 'https://www.vivapayments.com';
if (!process.env.VIVA_CLIENT_ID || !process.env.VIVA_CLIENT_SECRET) {
  console.error('Missing VIVA_CLIENT_ID or VIVA_CLIENT_SECRET');
  process.exit(1);
}
const basic = Buffer.from(`${process.env.VIVA_CLIENT_ID}:${process.env.VIVA_CLIENT_SECRET}`).toString('base64');
(async () => {
  const tokenRes = await fetch(`${baseToken}/connect/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const tokenText = await tokenRes.text();
  console.log('TOKEN STATUS', tokenRes.status, tokenRes.statusText);
  console.log(tokenText);
  if (!tokenRes.ok) {
    return;
  }
  const token = JSON.parse(tokenText).access_token;
  const payloads = [
    {
      amount: 23600,
      customerTrns: 'Test Order',
      customer: {
        email: 'test@example.com',
        fullName: 'Test User',
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
      sourceCode: process.env.VIVA_SOURCE_CODE,
      merchantTrns: 'test-x1',
      currencyCode: 203,
    },
    {
      amount: 23600,
      customerTrns: 'Test Order',
      requestLang: 'cs-CZ',
      customer: {
        email: 'test@example.com',
        fullName: 'Test User',
        countryCode: 'CZ',
      },
      paymentTimeout: 1800,
      preauth: false,
      allowRecurring: false,
      maxInstallments: 0,
      paymentNotification: true,
      disableExactAmount: false,
      disableCash: true,
      disableWallet: false,
      sourceCode: process.env.VIVA_SOURCE_CODE,
      merchantTrns: 'test-x2',
      currencyCode: 203,
    },
    {
      amount: 23600,
      customerTrns: 'Test Order',
      requestLang: 'cs-CZ',
      customer: {
        email: 'test@example.com',
        fullName: 'Test User',
        countryCode: 'CZ',
      },
      paymentTimeout: 1800,
      preauth: false,
      allowRecurring: false,
      maxInstallments: 0,
      paymentNotification: true,
      disableExactAmount: false,
      disableCash: true,
      disableWallet: false,
      sourceCode: process.env.VIVA_SOURCE_CODE,
      merchantTrns: 'test-x3',
      currencyCode: 203,
      currency: 'CZK',
    },
  ];
  for (let i = 0; i < payloads.length; i++) {
    const p = payloads[i];
    const res = await fetch(`${baseCreate}/checkout/v2/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(p),
    });
    const text = await res.text();
    console.log('=== PAYLOAD', i+1, 'STATUS', res.status, res.statusText);
    console.log(text);
  }
})();
