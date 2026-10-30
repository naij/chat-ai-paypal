import { checkPayPalOrder } from '../api/paypal';
import { useEffect, useState } from 'react';
import './paypalCallback.css';

export function callbackParams(location) {
  const params = new URLSearchParams(location.search);
  const hashQuery = location.hash.split('?')[1];
  if (hashQuery) for (const [key, value] of new URLSearchParams(hashQuery)) if (!params.has(key)) params.set(key, value);
  return { orderId: params.get('token') || '', payerId: params.get('PayerID') || '' };
}

export default function PayPalCallback({ cancelled }) {
  const { orderId, payerId } = callbackParams(window.location);
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (cancelled || !orderId) return;
    let active = true; setStatus('checking'); setError('');
    checkPayPalOrder(orderId).then(() => { if (active) setStatus('paid'); }).catch(error => { if (active) { setStatus('pending'); setError(error.message); } });
    return () => { active = false; };
  }, [cancelled, orderId, attempt]);
  const missingOrder = !cancelled && !orderId;
  useEffect(() => { document.title = cancelled ? 'Payment cancelled · Rosen' : 'PayPal return · Rosen'; }, [cancelled]);
  return <main className="paypal-callback">
    <header><a href="/#/profile" aria-label="Rosen profile">ROSEN</a><span>PayPal Sandbox</span></header>
    <section className="paypal-result" aria-labelledby="paypal-result-title">
      <div className={`paypal-result-icon ${cancelled || missingOrder ? 'neutral' : ''}`} aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21"/>{cancelled ? <path d="m17 17 14 14m0-14L17 31"/> : missingOrder ? <path d="M24 13v15m0 6v1"/> : <path d="m14 24 7 7 14-15"/>}</svg></div>
      <p className="paypal-result-label">{cancelled ? 'CHECKOUT CANCELLED' : missingOrder ? 'RETURN DETAILS MISSING' : 'RETURN RECEIVED'}</p>
      <h1 id="paypal-result-title">{cancelled ? 'Payment cancelled' : missingOrder ? 'Unable to identify your order' : status === 'paid' ? 'Payment successful' : status === 'checking' ? 'Verifying payment…' : 'Payment not confirmed'}</h1>
      <p className="paypal-result-description">{cancelled ? 'You cancelled the PayPal checkout. Return to the original Chat tab and click I haven’t paid to choose a payment method or retry.' : missingOrder ? 'No PayPal order token was included in this return URL. Please return to Chat and start checkout again.' : status === 'paid' ? 'Your sandbox payment has been confirmed. Return to the original Chat tab and click I’ve completed payment to continue your task.' : 'We are checking the payment with the server. Please do not create another order while the payment is being confirmed.'}</p>
      {orderId && <dl className="paypal-result-details"><div><dt>PayPal order ID</dt><dd>{orderId}</dd></div>{!cancelled && payerId && <div><dt>Payer ID</dt><dd>{payerId}</dd></div>}<div><dt>Status</dt><dd>{cancelled ? 'Checkout cancelled' : status === 'paid' ? 'Payment completed' : status === 'checking' ? 'Checking…' : 'Awaiting confirmation'}</dd></div></dl>}
      {error && <p role="alert">{error}</p>}
      {!cancelled && orderId && status === 'pending' && <button className="primary" onClick={() => setAttempt(value => value + 1)}>重新查询支付状态</button>}
      <div className="paypal-result-actions">{cancelled && <a className="paypal-return-chat" href="/#/chat">Return to Chat</a>}<a href="/#/profile">View profile</a></div>
      <p className="paypal-result-note">Sandbox environment · No live payment.<br/>This callback page does not capture or refund funds.</p>
    </section>
  </main>;
}
