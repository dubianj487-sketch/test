// Cloudflare Worker — SILDE Web Push relay
// VAPID keys generated for dubianj487@gmail.com (P-256)
const VAPID_PUBLIC_KEY  = 'BOrgMpK6DpVKY9xwHbogrjQNfbL0p8D25qH_3pz0KJOR0lyqgefO0qI0kaC17P1NlgtvrszRZPbPpJX6hnBtsEs';
const VAPID_PRIVATE_KEY = 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQga-T0yg5atgz4cVwQnEL5dXOIHHzlz5uvMw2xVAmZjq6hRANCAATq4DKSug6VSmPccB26IK40DX2y9KfA9uah_96c9CiTkdJcqoHnztKiNJGgtez9TZYLb67M0WT2z6SV-oZwbbBL';
const VAPID_SUBJECT     = 'mailto:dubianj487@gmail.com';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST')   return new Response('Method Not Allowed', { status: 405 });

    let body;
    try { body = await request.json(); }
    catch(e) { return new Response('Bad Request', { status: 400, headers: CORS }); }

    const { subscription, title, body: msgBody } = body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return new Response('Bad Request: invalid subscription', { status: 400, headers: CORS });
    }

    try {
      await sendWebPush(subscription, JSON.stringify({ title: title || 'SILDE', body: msgBody || '' }));
      return new Response('OK', { headers: CORS });
    } catch(e) {
      console.error('Push failed:', e);
      return new Response('Push failed: ' + e.message, { status: 500, headers: CORS });
    }
  }
};

// ─── helpers ───────────────────────────────────────────────────────────────

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

const enc = str => new TextEncoder().encode(str);

function concat(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

async function hkdf(salt, ikm, info, len) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8)
  );
}

// ─── VAPID JWT (RFC 8292) ──────────────────────────────────────────────────

async function makeVapidJwt(endpoint) {
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 43200;
  const hdr  = b64url(enc(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const pay  = b64url(enc(JSON.stringify({ aud, exp, sub: VAPID_SUBJECT })));
  const unsigned = hdr + '.' + pay;

  const pk = await crypto.subtle.importKey(
    'pkcs8', fromB64url(VAPID_PRIVATE_KEY),
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pk, enc(unsigned));
  return unsigned + '.' + b64url(sig);
}

// ─── RFC 8291 payload encryption (aes128gcm) ──────────────────────────────

async function encryptPayload(subscription, plaintext) {
  const recipientPub = fromB64url(subscription.keys.p256dh);
  const authSecret   = fromB64url(subscription.keys.auth);

  // Ephemeral sender key pair
  const ephemeral = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const ephPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', ephemeral.publicKey));

  // ECDH shared secret
  const recipientKey = await crypto.subtle.importKey(
    'raw', recipientPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: recipientKey }, ephemeral.privateKey, 256)
  );

  // PRK = HKDF(salt=auth, ikm=ecdh, info="WebPush: info\0" | recipientPub | ephPub)
  const prk = await hkdf(
    authSecret, sharedSecret,
    concat(enc('WebPush: info\x00'), recipientPub, ephPubRaw),
    32
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek   = await hkdf(salt, prk, enc('Content-Encoding: aes128gcm\x00'), 16);
  const nonce = await hkdf(salt, prk, enc('Content-Encoding: nonce\x00'), 12);

  // Encrypt plaintext + 0x02 delimiter
  const pt = concat(enc(plaintext), new Uint8Array([2]));
  const cekKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, pt)
  );

  // aes128gcm body: salt(16) | rs(4 BE uint32) | idlen(1) | id(65) | ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  return concat(salt, rs, new Uint8Array([65]), ephPubRaw, ct);
}

// ─── send ──────────────────────────────────────────────────────────────────

async function sendWebPush(subscription, payload) {
  const jwt  = await makeVapidJwt(subscription.endpoint);
  const body = await encryptPayload(subscription, payload);

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization':    'vapid t=' + jwt + ',k=' + VAPID_PUBLIC_KEY,
      'Content-Type':     'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL':              '86400',
    },
    body,
  });

  if (!res.ok) throw new Error(res.status + ' ' + (await res.text()));
}
