import { createPayPalOrder, readPending, PENDING_KEY } from './api/paypal';
import PayPalPendingDialog from './components/PayPalPendingDialog.jsx';
import BossDialog from './components/BossDialog.jsx';
import { bossCandidates, bossPrompt } from './bossCandidates.js';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Messages from './components/Messages.jsx';
import Composer from './components/Composer.jsx';
import PayoutDialog from './components/PayoutDialog.jsx';
import ProofDialog from './components/ProofDialog.jsx';
import { getHireTask } from './hireTasks.js';
import { useChat } from './hooks/useChat.js';
import { useMobileViewport } from './hooks/useMobileViewport.js';
import { activeActions } from './chat.js';

export default function App({ intent = null, intentRequest = 0, recordPayment, onChooseRole }) {
  const chat = useChat();
  const appRef = useRef(null), inputRef = useRef(null), conversationRef = useRef(null);
  const [draft, setDraft] = useState(''), [menu, setMenu] = useState(false), [toast, setToast] = useState('');
  const [bossDialog, setBossDialog] = useState(null);
  const [bossChats, setBossChats] = useState({});
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [pending, setPending] = useState(readPending);
  const [showPending, setShowPending] = useState(() => !!readPending());
  const [payBusy, setPayBusy] = useState(false), [payError, setPayError] = useState('');
  const paymentLock = useRef(false), paymentEpoch = useRef(0);
  function resetPayment() { paymentEpoch.current++; paymentLock.current = false; setPayBusy(false); setPayError(''); setPending(null); setShowPending(false); sessionStorage.removeItem(PENDING_KEY); }
  const handledIntent = useRef(0);
  const toastTimer = useRef(), follow = useRef(true), restore = useRef(null);
  useMobileViewport(appRef, inputRef, conversationRef);
  useEffect(() => {
    if (intentRequest === handledIntent.current) return;
    handledIntent.current = intentRequest;
    resetPayment();
    setProofOpen(false);
    setBossDialog(null);
    setPayoutOpen(false);
    follow.current = true;
    if (intent === 'hire') { setDraft(''); chat.startHire(); }
    else { chat.startBoss(); setDraft(bossPrompt); }
  }, [intentRequest]);
  function notify(text) { setToast(text); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4200); }
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape') setMenu(false); };
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('keydown', escape); clearTimeout(toastTimer.current); };
  }, []);
  useLayoutEffect(() => {
    const element = conversationRef.current;
    if (restore.current !== null) { element.scrollTo({ top: restore.current, behavior: 'instant' }); restore.current = null; }
    else if (follow.current) element.scrollTo({ top: element.scrollHeight, behavior: 'instant' });
  }, [chat.messages]);
  function run(stage, text, payload) { follow.current = true; chat.run(stage, text, conversationRef.current.scrollTop, payload); }
  function restart() {
    resetPayment(); chat.restart(); setBossDialog(null); setPayoutOpen(false); setProofOpen(false); setDraft(''); setMenu(false); setToast(''); setBossChats({}); restore.current = null; follow.current = true; onChooseRole();
  }
  function back() { resetPayment(); setBossDialog(null); setPayoutOpen(false); setProofOpen(false); restore.current = chat.back(); setDraft(''); }
  function send() {
    const text = draft.trim();
    if (chat.busy) return;
    if (!text) { inputRef.current.focus(); return; }
    if (chat.stage === 'boss-ready') { setDraft(''); run('boss-candidates', text); return; }
    if (chat.stage === 'boss-refunded') { notify('This flow has ended. Choose Restart demo to start again.'); return; }
    if (chat.stage.startsWith('boss-')) { notify(chat.stage === 'boss-candidates' ? 'Select a promoter from the cards above.' : chat.stage === 'boss-selected' ? 'Choose PayPal or PYUSD to place your order.' : 'Open the selected user’s profile to start chatting.'); return; }
    if (chat.stage.startsWith('hire-')) {
      notify(chat.stage === 'hire-opportunities' ? 'Choose Task A, B, or C from the cards above.' : chat.stage === 'hire-selected' ? 'Tap Submit proof to add your images and text.' : chat.stage === 'hire-submitted' ? 'Choose PayPal or PYUSD to receive your demo payment.' : chat.messages.findLast(message => message.type === 'payment-success')?.payment.method === 'paypal' ? 'Payment received. Please go to PayPal to view your received payment.' : 'Payment received. View your dashboard for the credit update.');
      return;
    }
    onChooseRole();
  }
  function receivePayment(method) {
    if (chat.busy || chat.stage !== 'hire-submitted' || !chat.task) return;
    const submission = chat.messages.findLast(message => message.type === 'proof');
    if (!submission) return;
    const payment = recordPayment({ id: submission.id, method, amount: chat.task.budget, taskId: chat.task.id });
    setPayoutOpen(false);
    run('hire-paid', undefined, { payment });
  }
  async function startPayPal() {
    if (paymentLock.current) return;
    if (pending) { setBossDialog(null); setShowPending(true); return; }
    const popup = window.open('about:blank', '_blank');
    if (!popup) { setPayError('浏览器阻止了支付窗口，请允许弹窗后重试。'); return; }
    popup.opener = null;
    paymentLock.current = true; setPayBusy(true); setPayError('');
    const epoch = paymentEpoch.current;
    try {
      const order = await createPayPalOrder(chat.candidate.quote);
      if (epoch !== paymentEpoch.current) { popup.close(); return; }
      const next = { ...order, candidate: chat.candidate, snapshot: { stage: chat.stage, messages: chat.messages, candidate: chat.candidate, task: chat.task } };
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(next));
      setPending(next); setShowPending(true); setBossDialog(null);
      popup.location.replace(order.payUrl);
    } catch (error) { popup.close(); if (epoch === paymentEpoch.current) setPayError(error.message); }
    finally { if (epoch === paymentEpoch.current) { paymentLock.current = false; setPayBusy(false); } }
  }
  function completePayPal() {
    if (!pending || paymentLock.current || chat.busy || chat.stage !== 'boss-selected') return;
    // Manual confirmation advances the demo; server verification lives on the return page.
    paymentLock.current = true;
    sessionStorage.removeItem(PENDING_KEY);
    setPending(null); setShowPending(false); setPayError('');
    run('boss-paid', undefined, { candidate: pending.candidate });
    paymentLock.current = false;
  }
  function confirmBoss() {
    if (chat.busy) return;
    if (chat.stage === 'boss-selected' && bossDialog === 'paypal') { startPayPal(); return; }
    if (chat.stage === 'boss-selected') { resetPayment(); setBossDialog(null); run('boss-paid', undefined, { candidate: chat.candidate }); return; }
    if (chat.stage !== 'boss-paid' || !['reject', 'approve'].includes(bossDialog)) return;
    const proof = chat.messages.findLast(message => message.type === 'boss-proof');
    if (!proof) return;
    const orderId = `BOSS-${proof.id}`;
    const decision = bossDialog;
    if (decision === 'approve') recordPayment({ id: orderId, method: 'boss', amount: 0, credit: 200 });
    setBossDialog(null);
    run(decision === 'approve' ? 'boss-approved' : 'boss-refunded', undefined, { candidate: chat.candidate, orderId });
  }
  function onAction(name, value) {
    if (chat.busy || !(activeActions[chat.stage] || []).includes(name)) return;
    if (name === 'boss-candidate') {
      const candidate = bossCandidates.find(candidate => candidate.id === value);
      if (candidate) run('boss-selected', undefined, { candidate });
    }
    else if (name === 'boss-paypal' || name === 'boss-pyusd') { setPayError(''); setBossDialog(name === 'boss-paypal' ? 'paypal' : 'pyusd'); }
    else if (name === 'boss-reject' || name === 'boss-approve') setBossDialog(name === 'boss-reject' ? 'reject' : 'approve');
    else if (name === 'boss-profile') setBossDialog('profile');
    else if (name === 'hire-task') {
      const task = getHireTask(value);
      if (task) run('hire-selected', undefined, { task });
    }
    else if (name === 'payout-paypal') setPayoutOpen(true);
    else if (name === 'payout-pyusd') receivePayment('pyusd');
    else if (name === 'dashboard') { location.hash = '/dashboard'; }
    else if (name === 'proof') setProofOpen(true);

  }
  // The keyboard hook owns only viewport classes/styles; React owns all conversation content.
  return <>
    <main ref={appRef} id="app" className="app" data-stage={chat.stage} data-intent={intent || undefined} aria-label="Rosen Chat AI demo">
      <Header home={['home', 'boss-ready'].includes(chat.stage)} onStart={() => chat.stage === 'boss-ready' ? inputRef.current.focus() : onChooseRole()} onTopic={onChooseRole} onBack={back}/>
      <section ref={conversationRef} id="conversation" className="conversation" aria-label="Conversation" tabIndex={0} hidden={['home', 'boss-ready'].includes(chat.stage)} onScroll={event => { const element = event.currentTarget; follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 130; }}>
        <Messages messages={chat.messages} stage={chat.stage} busy={chat.busy} onAction={onAction}/>
      </section>
      <div id="live-status" className="sr-only" role="status" aria-live="polite">{chat.busy ? 'Rosen Agentic AI is replying.' : chat.stage === 'home' ? '' : 'Reply complete. You can continue.'}</div>
      <div id="toast" className="toast" role="status" hidden={!toast}>{toast}</div>
      <div id="tools-menu" className="tools-menu" hidden={!menu}><p>Demo controls</p><a className="profile-menu-link" href="#/profile" onClick={() => setMenu(false)}>Profile</a><button id="skip-animation" onClick={() => { chat.skip(); setMenu(false); }}>Finish current reply</button><button id="restart" onClick={restart}>Restart demo</button><label><input id="animate" type="checkbox" checked={chat.animate} onChange={event => chat.setAnimate(event.target.checked)}/> Typewriter replies</label><small>Scripted demo · No real payments</small></div>
      <Composer inputRef={inputRef} value={draft} setValue={setDraft} busy={chat.busy} onSend={send} menu={menu} toggleMenu={() => setMenu(value => !value)}/>
    </main>
    {showPending && pending && <PayPalPendingDialog pending={pending} busy={payBusy} error={payError} onCheck={completePayPal} onUnpaid={() => { setShowPending(false); setPayError(''); notify('尚未确认支付。点击 PayPal 可重新打开该订单并查询。'); }}/>}
    {bossDialog && chat.candidate && <BossDialog mode={bossDialog} busy={payBusy} error={payError} candidate={chat.candidate} messages={bossChats[chat.candidate.id] || []} onSend={text => setBossChats(previous => ({ ...previous, [chat.candidate.id]: [...(previous[chat.candidate.id] || []), text] }))} onClose={() => { if (!payBusy) setBossDialog(null); }} onChat={() => setBossDialog('chat')} onConfirm={confirmBoss}/>}
    {payoutOpen && chat.task && <PayoutDialog amount={chat.task.budget} onClose={() => setPayoutOpen(false)} onConfirm={() => receivePayment('paypal')}/>}
    {proofOpen && chat.task && <ProofDialog task={chat.task} onClose={() => setProofOpen(false)} onSubmit={proof => { setProofOpen(false); run('hire-submitted', undefined, { task: chat.task, proof }); }}/>} 
  </>;
}
