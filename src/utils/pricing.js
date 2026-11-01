import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';
import { Product } from '../models/Product.js';
import { Addon } from '../models/Addon.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Setting } from '../models/Setting.js';
import { computeOrderShippingWeightKg } from './shippingWeight.js';
import { checkServiceability, ShiprocketUnavailableError } from '../services/shiprocket.js';

// Must stay in sync with WEIGHTS_DEF in BigBakeBatter/src/data/products.js.
const WEIGHTS_DEF = [
  { w: '0.5 KG', mult: 1 },
  { w: '1 KG', mult: 1.7 },
  { w: '1.5 KG', mult: 2.39 },
  { w: '2 KG', mult: 3.08 },
];

export function priceForWeight(product, weight) {
  const override = (product.weights || []).find((w) => w.w === weight);
  if (override) return override.price;
  const def = WEIGHTS_DEF.find((o) => o.w === weight) || WEIGHTS_DEF[0];
  return Math.round((product.base * def.mult) / 10) * 10;
}

/** Returns a usable coupon or throws a 400 explaining why it can't be applied. */
export async function resolveCoupon(code, { subtotal, email, userId }) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), active: true });
  if (!coupon || (coupon.expiresAt && coupon.expiresAt < new Date())) throw ApiError.badRequest('This promo code is not valid');
  if (subtotal < coupon.minSubtotal) throw ApiError.badRequest(`This code needs a minimum order of ₹${coupon.minSubtotal}`);
  if (coupon.firstOrderOnly) {
    const or = [];
    if (userId) or.push({ user: userId });
    if (email) or.push({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (or.length && (await Order.exists({ $or: or, status: { $ne: 'Cancelled' } }))) {
      throw ApiError.badRequest('This code is only valid on your first order');
    }
  }
  return coupon;
}

/**
 * Recomputes the cart from the database so the client can never set its own
 * prices. items: [{ pid, weight, qty, isAddon }]. Returns priced line items
 * plus subtotal / discount / delivery / total in rupees.
 */
export async function priceCart(items, { promoCode, email, userId, pincode } = {}) {
  if (!Array.isArray(items) || items.length === 0) throw ApiError.badRequest('Your cart is empty');

  const ids = items.map((i) => i.pid).filter((id) => mongoose.isValidObjectId(id));
  const [products, addons] = await Promise.all([Product.find({ _id: { $in: ids } }), Addon.find({ _id: { $in: ids } })]);
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const addonMap = new Map(addons.map((a) => [a._id.toString(), a]));

  const lines = items.map((item) => {
    const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
    const product = productMap.get(String(item.pid));
    if (product && !item.isAddon) {
      if (product.stock === 'Out of stock') throw ApiError.badRequest(`${product.name} is out of stock`);
      const unit = priceForWeight(product, item.weight);
      return { pid: product._id, name: product.name, weight: item.weight || '', qty, unit, line: unit * qty };
    }
    const addon = addonMap.get(String(item.pid));
    if (addon) return { pid: addon._id, name: addon.name, weight: '', qty, unit: addon.price, line: addon.price * qty };
    throw ApiError.badRequest(`"${item.name || 'An item'}" is no longer available. Please remove it from your cart.`);
  });

  const subtotal = lines.reduce((sum, l) => sum + l.line, 0);
  const coupon = await resolveCoupon(promoCode, { subtotal, email, userId });
  const discount = coupon ? Math.round(subtotal * (coupon.pct / 100)) : 0;

  const settings = await Setting.findOne({ key: 'business' });
  const fee = settings?.deliveryFee ?? 49;
  const freeAbove = settings?.freeDeliveryAbove ?? 1500;
  const shippingWeightKg = computeOrderShippingWeightKg(lines);
  const flatDelivery = () => (subtotal >= freeAbove ? 0 : fee);

  let delivery, deliveryMeta;
  if (subtotal === 0) {
    delivery = 0;
    deliveryMeta = { source: 'flat' };
  } else if (pincode && /^\d{6}$/.test(pincode)) {
    try {
      const { serviceable, couriers } = await checkServiceability({ deliveryPincode: pincode, weightKg: shippingWeightKg });
      if (!serviceable) {
        throw ApiError.badRequest(`Sorry, we can't deliver to pincode ${pincode} yet. Please try a different address or call us.`);
      }
      const cheapest = couriers.reduce((a, b) => (b.rate < a.rate ? b : a));
      delivery = Math.round(cheapest.rate);
      deliveryMeta = { source: 'shiprocket', courierName: cheapest.courierName, etaDays: cheapest.etaDays };
    } catch (err) {
      if (err instanceof ApiError) throw err; // genuine "unserviceable" — block checkout
      // Shiprocket unreachable/erroring — never let a third-party outage break checkout.
      if (!(err instanceof ShiprocketUnavailableError)) console.warn('[shiprocket] unexpected error, falling back to flat fee:', err);
      else console.warn('[shiprocket] rate lookup failed, falling back to flat delivery fee:', err.message);
      delivery = flatDelivery();
      deliveryMeta = { source: 'flat-fallback' };
    }
  } else {
    // No pincode yet (e.g. quote fetched before the address step is filled in).
    delivery = flatDelivery();
    deliveryMeta = { source: 'flat-estimate' };
  }

  return {
    lines,
    subtotal,
    discount,
    delivery,
    deliveryMeta,
    shippingWeightKg,
    promoCode: coupon?.code || '',
    total: Math.max(0, subtotal - discount) + delivery,
  };
}
