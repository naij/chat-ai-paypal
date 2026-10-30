import { useEffect, useRef } from 'react';
export default function PayoutDialog({ amount, onClose, onConfirm }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => { if (dialog.open) dialog.close(); }; }, []);
  return <dialog ref={ref} className="payout-dialog" aria-labelledby="payout-title" onCancel={onClose}>
    <button className="dialog-close" aria-label="Cancel PayPal payment" onClick={onClose}>×</button>
    <div className="paypal-wordmark">PayPal</div><h2 id="payout-title">Receive your payment</h2>
    <p>Demo checkout · No real PayPal account is connected and no funds are transferred.</p>
    <div className="payment-amount"><span>Task payment</span><strong>${amount.toFixed(2)} <small>USD</small></strong><span>Fee <b>$0.00</b></span></div>
    <button id="confirm-payout" className="primary wide" onClick={onConfirm}>Confirm demo receipt</button>
    <button className="text-button" onClick={onClose}>Cancel</button>
  </dialog>;
}
