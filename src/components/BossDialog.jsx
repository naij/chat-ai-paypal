import { bossCandidates } from '../bossCandidates';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function BossDialog({ mode, busy = false, error, candidate, messages, onSend, onClose, onChat, onConfirm }) {
  const ref = useRef(null), end = useRef(null), inputRef = useRef(null);
  const [draft, setDraft] = useState('');
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (mode !== 'chat' || !input) return;
    const resize = () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(144, Math.max(64, input.scrollHeight))}px`;
      input.style.overflowY = input.scrollHeight > 144 ? 'auto' : 'hidden';
    };
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => {
      if (input.clientWidth !== width) { width = input.clientWidth; resize(); }
    });
    observer.observe(input); resize();
    return () => observer.disconnect();
  }, [draft, mode]);
  const checkout = mode === 'paypal' || mode === 'pyusd';
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => { if (dialog.open) dialog.close(); }; }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages]);
  return <dialog ref={ref} className={`payout-dialog boss-dialog ${mode === 'chat' ? 'boss-chat-dialog' : mode === 'profile' ? 'boss-profile-dialog' : ''}`} aria-labelledby="boss-dialog-title" onCancel={onClose}>
    <button className="dialog-close" aria-label="Close dialog" onClick={onClose}>×</button>
    {mode === 'reject' || mode === 'approve' ? <>
      <h2 id="boss-dialog-title">{mode === 'reject' ? 'Reject submission?' : 'Approve and release payment?'}</h2>
      <p>{mode === 'reject' ? 'The other party has submitted proof. Are you sure you want to reject it? If you deliberately reject it, you may be reported and your credit score will be affected.' : `Confirm payment of $${candidate.quote} to ${candidate.name} for the completed task.`}</p>
      <p className="boss-demo-note">Demo only · No real funds will be transferred or refunded.</p>
      <button className="primary wide" onClick={onConfirm}>Confirm</button><button className="text-button" onClick={onClose}>Cancel</button>
    </> : checkout ? <>
      <div className={mode === 'paypal' ? 'paypal-wordmark' : 'boss-pyusd-wordmark'}>{mode === 'paypal' ? 'PayPal' : 'PYUSD'}</div>
      <h2 id="boss-dialog-title">Confirm your order</h2>
      <p>{candidate.name} · {candidate.country}</p>
      <div className="payment-amount"><span>Funds to lock in</span><strong>{mode === 'paypal' ? `$${candidate.quote.toFixed(2)}` : candidate.quote.toFixed(2)} <small>{mode === 'paypal' ? 'USD' : 'PYUSD'}</small></strong></div>
      <p className="boss-demo-note">{mode === 'paypal' ? 'PayPal Sandbox · Checkout opens in a new tab.' : 'Demo payment only. No real funds will be charged or locked.'}</p>{error && <p role="alert">{error}</p>}
      <button className="primary wide" disabled={busy} onClick={onConfirm}>{busy ? 'Creating order…' : 'Pay'} {mode === 'paypal' ? `$${candidate.quote}` : `${candidate.quote} PYUSD`} and place order</button>
      <button className="text-button" onClick={onClose}>Cancel</button>
    </> : <>
      <img className="boss-photo" src={bossCandidates.find(person => person.id === candidate.id)?.photo} alt={candidate.name} />
      <h2 id="boss-dialog-title">{candidate.name}</h2><p>{candidate.country} · Grassroots promotion</p>
      {mode === 'profile' ? <><p className="boss-bio">{candidate.description}</p><p><strong>Quote: ${candidate.quote}</strong><br/>{candidate.details}</p><button className="boss-chat-button" onClick={onChat}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H4l-1 2v-10a8 8 0 0 1 17 0Z"/></svg>Chat</button></> : <>
        <p className="boss-demo-note">Demo chat · Messages stay on this device until refresh.</p>
        <div className="boss-chat-messages" aria-label="Task conversation" aria-live="polite">{messages.length ? messages.map((text, index) => <p key={index}>{text}</p>) : <span>Start a conversation about your task.</span>}<div ref={end}/></div>
        <form className="boss-chat-form" onSubmit={event => { event.preventDefault(); if (draft.trim()) { onSend(draft.trim()); setDraft(''); } }}><label className="sr-only" htmlFor="boss-chat-input">Message to {candidate.name}</label><textarea ref={inputRef} rows={2} id="boss-chat-input" value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} placeholder="Ask about task progress"/><button type="submit" className="primary boss-chat-send" disabled={!draft.trim()}>Send</button></form>
      </>}
    </>}
  </dialog>;
}
