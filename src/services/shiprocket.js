import { ShiprocketConfig } from '../models/ShiprocketConfig.js';
import { decryptSecret } from '../utils/secretBox.js';

/** Thrown for network/auth/5xx failures — callers should fall back to the flat delivery fee.
 * Never thrown for a successful "no couriers for this pincode" response — that's a real answer. */
export class ShiprocketUnavailableError extends Error {}

/** Resolves the active (test or live) credential set, password decrypted. */
export async function loadShiprocketConfig() {
  const doc = await ShiprocketConfig.findOne({ key: 'shiprocket' });
  if (!doc) return null;
  const active = doc.mode === 'live' ? doc.live : doc.test;
  return {
    mode: doc.mode,
    apiBaseUrl: doc.apiBaseUrl || 'https://apiv2.shiprocket.in/v1/external',
    email: active?.email || '',
    password: decryptSecret(active?.passwordEnc),
    pickupLocation: active?.pickupLocation || '',
    pickupPincode: active?.pickupPincode || '',
  };
}

let cached = { fp: null, token: null, expiresAt: 0 };

async function getToken(cfg) {
  const fp = `${cfg.mode}:${cfg.email}`;
  if (cached.fp === fp && cached.token && Date.now() < cached.expiresAt) return cached.token;
  let res;
  try {
    res = await fetch(`${cfg.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cfg.email, password: cfg.password }),
    });
  } catch (err) {
    throw new ShiprocketUnavailableError(`Could not reach Shiprocket: ${err.message}`);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.token) {
    throw new ShiprocketUnavailableError(body.message || `Shiprocket login failed (${res.status})`);
  }
  // Tokens are documented as ~10-day lived; cache a little under that so we refresh before expiry.
  cached = { fp, token: body.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return cached.token;
}

/** Calls a Shiprocket endpoint, retrying once on 401 with a fresh token. */
async function call(path, { method = 'GET', params, body } = {}) {
  const cfg = await loadShiprocketConfig();
  if (!cfg || !cfg.email || !cfg.password) {
    throw new ShiprocketUnavailableError('Shiprocket is not configured yet.');
  }

  const url = new URL(`${cfg.apiBaseUrl}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) url.searchParams.set(k, v); });

  const doFetch = async (token) => {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new ShiprocketUnavailableError(`Could not reach Shiprocket: ${err.message}`);
    }
    return res;
  };

  let token = await getToken(cfg);
  let res = await doFetch(token);
  if (res.status === 401) {
    cached = { fp: null, token: null, expiresAt: 0 };
    token = await getToken(cfg);
    res = await doFetch(token);
  }

  const data = await res.json().catch(() => ({}));
  if (res.status >= 500 || res.status === 0) {
    throw new ShiprocketUnavailableError(data.message || `Shiprocket server error (${res.status})`);
  }
  return { ok: res.ok, status: res.status, data };
}

/**
 * Checks whether any courier can deliver to `deliveryPincode` and at what rate.
 * Pickup pincode is read from the active config automatically.
 * Response field names are per Shiprocket's documented serviceability shape —
 * flagged in the implementation plan as worth a live verification call.
 */
export async function checkServiceability({ deliveryPincode, weightKg, cod = false }) {
  const cfg = await loadShiprocketConfig();
  if (!cfg?.pickupPincode) throw new ShiprocketUnavailableError('No Shiprocket pickup pincode configured.');

  const { data } = await call('/courier/serviceability/', {
    params: {
      pickup_postcode: cfg.pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: weightKg,
      cod: cod ? 1 : 0,
    },
  });
  const couriers = data?.data?.available_courier_companies || [];
  return {
    serviceable: couriers.length > 0,
    couriers: couriers.map((c) => ({
      courierId: c.courier_company_id,
      courierName: c.courier_name,
      rate: Number(c.rate ?? c.freight_charge ?? 0),
      etaDays: c.estimated_delivery_days ?? c.etd ?? null,
    })),
  };
}

export async function createAdhocOrder(payload) {
  const { data } = await call('/orders/create/adhoc', { method: 'POST', body: payload });
  return data;
}

export async function assignAwb({ shipmentId, courierId }) {
  const { data } = await call('/courier/assign/awb', {
    method: 'POST',
    body: courierId ? { shipment_id: shipmentId, courier_id: courierId } : { shipment_id: shipmentId },
  });
  return data;
}

export async function trackByAwb(awbCode) {
  const { data } = await call(`/courier/track/awb/${awbCode}`);
  return data;
}

export async function cancelOrder(shiprocketOrderIds) {
  const { data } = await call('/orders/cancel', { method: 'POST', body: { ids: shiprocketOrderIds } });
  return data;
}

/** Clears the cached token — called after saving new/changed credentials. */
export function invalidateTokenCache() {
  cached = { fp: null, token: null, expiresAt: 0 };
}
