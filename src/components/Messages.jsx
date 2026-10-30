import { bossProofs, invoiceImage } from '../bossCandidates.js';
import { activeActions, richTokens } from '../chat.js';

function RichText({ html, visible }) {
  let remaining = visible;
  return richTokens(html).map((token, index) => {
    if (token.br) return remaining > 0 ? <br key={index}/> : null;
    const value = token.text.slice(0, Math.max(0, remaining)); remaining -= token.text.length;
    return token.bold ? <strong key={index}>{value}</strong> : value;
  });
}
export default function Messages({ messages, stage, busy, onAction }) {
  const disabled = name => busy || !(activeActions[stage] || []).includes(name);
  function button(name, label, className, project) {
    return <button type="button" className={className} data-action={name} data-project={project} aria-label={project === undefined ? undefined : `Take project ${project + 1}`} disabled={disabled(name)} onClick={() => onAction(name, project)}>{label}</button>;
  }
  return <div id="messages" aria-busy={busy}>{messages.map(message => {
    const { id, type } = message;
    if (type === 'typing') return <div key={id} className="typing" aria-hidden="true"><span/><span/><span/></div>;
    if (type === 'user') return <div key={id} className="user-row message"><div className="user-message">{message.text}</div><span className={`user-avatar ${message.finance ? 'finance-avatar' : ''}`} aria-hidden="true"/></div>;
    if (type === 'external-link') return <div key={id} className="action-slot"><a className="primary step-action external-action" href={message.href} target="_blank" rel="noopener noreferrer">{message.label}</a></div>;
    if (type === 'action') return <div key={id} className="action-slot">{button(message.action, message.label, message.className)}</div>;
    if (type === 'proof') return <section key={id} className="message card proof-receipt" aria-label={`Submitted proof for Task ${message.task.id}`}><strong>Task {message.task.id} · Proof submitted</strong>{message.proof.text && <p className="proof-text">{message.proof.text}</p>}{message.proof.images.length > 0 && <div className="proof-images">{message.proof.images.map((image, index) => <a key={index} href={image.url} download={image.name}><img src={image.url} alt={image.name}/></a>)}</div>}<small>Saved in this demo only. No files were uploaded to a server.</small></section>;
    if (type === 'boss-proof') { const proof = bossProofs[message.person.id]; return <figure key={id} className="message card boss-proof"><strong>{message.person.name} · Submitted proof</strong><a href={proof.image} target="_blank" rel="noreferrer" aria-label={`Open proof from ${message.person.name}`}><img src={proof.image} alt={`Task completion proof from ${message.person.name}`}/></a><figcaption>{proof.text}</figcaption></figure>; }
    if (type === 'boss-review-options') return <div key={id} className="payout-options message">{button('boss-reject', 'Reject', 'review-reject')}{button('boss-approve', 'Approve', 'review-approve')}</div>;
    if (type === 'boss-invoice') { const source = invoiceImage(message.person, message.orderId); return <figure key={id} className="message card boss-invoice"><img src={source} alt={`Demo smart invoice for ${message.person.name}, total $${message.person.quote}, payment completed`}/><figcaption>Demo invoice · Generated locally, no API connected.</figcaption><a href={source} download={`rosen-invoice-${message.orderId}.svg`}>Download invoice</a></figure>; }
    if (type === 'boss-payment-options') return <div className="payout-options message" key={id}>{button('boss-paypal', 'PayPal', 'payout-choice paypal-choice')}{button('boss-pyusd', 'PYUSD', 'payout-choice pyusd-choice')}</div>;
    if (message.candidate) return <button key={id} type="button" className={`message ${message.className}`} aria-label={`Select ${message.candidate.name}`} disabled={!message.done || disabled('boss-candidate')} onClick={() => onAction('boss-candidate', message.candidate.id)}><span className={message.done ? undefined : 'streaming'}><RichText html={message.html} visible={message.visible}/></span><span className="hire-task-cta">Select {message.candidate.name} →</span></button>;
    if (type === 'payout-options') return <div className="payout-options message" key={id}>{button('payout-paypal', 'PayPal', 'payout-choice paypal-choice')}{button('payout-pyusd', 'PYUSD', 'payout-choice pyusd-choice')}</div>;
    if (type === 'payment-success') return <section key={id} className="payment-success message" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/></svg><strong>Payment Received Successfully and your Credit Score +100</strong><small>Demo payment · {message.payment.method === 'pyusd' ? `${message.payment.amount} PYUSD · Rosen wallet` : `$${message.payment.amount} USD · PayPal`}</small></section>;
    if (message.task) return <button key={id} type="button" className={`message ${message.className}`} data-task={message.task.id} aria-label={`Select Task ${message.task.id}`} disabled={!message.done || disabled('hire-task')} onClick={() => onAction('hire-task', message.task.id)}><span className={message.done ? undefined : 'streaming'}><RichText html={message.html} visible={message.visible}/></span><span className="hire-task-cta">Select Task {message.task.id}<span aria-hidden="true"> →</span></span></button>;
    return <div key={id} className={`message ${message.className}`}><span className={message.done ? undefined : 'streaming'}><RichText html={message.html} visible={message.visible}/></span></div>;
  })}</div>;
}
