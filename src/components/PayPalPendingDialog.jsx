import { useEffect, useRef } from 'react';
export default function PayPalPendingDialog({ pending, busy, error, onCheck, onUnpaid }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="payout-dialog" aria-labelledby="pending-payment-title" onCancel={event => event.preventDefault()}>
    <div className="paypal-wordmark">PayPal</div><h2 id="pending-payment-title">Complete your sandbox payment</h2>
    <p>PayPal checkout opened in a new tab. Once you have paid, click “I’ve completed payment” to continue your task.</p>
    <p style={{ overflowWrap: 'anywhere', fontSize: 12 }}>Order ID: {pending.orderId}</p>
    <a className="paypal-reopen-link" href={pending.payUrl} target="_blank" rel="noreferrer">Reopen PayPal checkout</a>
    {error && <p role="alert">{error}</p>}
    <button className="primary wide" disabled={busy} onClick={onCheck}>{busy ? 'Processing…' : 'I’ve completed payment'}</button>
    <button className="text-button" disabled={busy} onClick={onUnpaid}>I haven’t paid</button>
  </dialog>;
}
