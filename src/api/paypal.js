import request from './request';
export const PENDING_KEY = 'rosen-paypal-pending';
export function readPending() {
  try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); } catch { return null; }
}
export async function createPayPalOrder(amount) {
  const { data } = await request.post('/api/paypal/order/create', { amount });
  let url;
  try { url = new URL(data?.payUrl); } catch { throw new Error('创建订单未返回有效的 PayPal 支付地址。'); }
  if (url.protocol !== 'https:' || !['www.sandbox.paypal.com', 'sandbox.paypal.com'].includes(url.hostname)) throw new Error('支付地址不是 PayPal 沙盒地址。');
  const orderId = url.searchParams.get('token') || data?.orderId;
  if (!orderId || !/^[a-zA-Z0-9-]+$/.test(orderId)) throw new Error('创建订单未返回 PayPal 订单 ID，无法查询支付状态。');
  return { orderId, payUrl: url.href };
}
export function checkPayPalOrder(orderId) {
  if (!orderId) return Promise.reject(new Error('缺少 PayPal 订单 ID。'));
  return request.get(`/api/open/paypal/order/check/${encodeURIComponent(orderId)}`, { params: { token: orderId } });
}
