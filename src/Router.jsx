import { readPending } from './api/paypal';
import PayPalCallback from './pages/PayPalCallback.jsx';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import App from './App.jsx';
import Profile from './pages/Profile.jsx';
import ChatIntentDialog from './components/ChatIntentDialog.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));

export default function Router() {
  const ledger = useRef(new Map());
  const [payments, setPayments] = useState([]);
  function recordPayment(payment) {
    if (ledger.current.has(payment.id)) return ledger.current.get(payment.id);
    ledger.current.set(payment.id, payment);
    setPayments(Array.from(ledger.current.values()));
    return payment;
  }
  const [intentDialogKey, setIntentDialogKey] = useState(0);
  function chooseRole() { setIntent(null); setIntentDialogKey(key => key + 1); }
  const [intent, setIntent] = useState(null);
  const [intentRequest, setIntentRequest] = useState(0);
  function selectIntent(value) { setIntent(value); setIntentRequest(previous => previous + 1); }
  const [route, setRoute] = useState(() => location.hash);
  useEffect(() => {
    const update = () => setRoute(location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const callbackPath = location.pathname.replace(/\/$/, '') || route.split('?')[0].replace(/^#/, '');
  const callback = ['/paypal/success', '/paypal/cancel'].includes(callbackPath);
  const dashboard = route === '#/dashboard';
  const profile = route !== '#/chat';
  useEffect(() => { if (callback) return; document.title = dashboard ? 'Dashboard · Rosen' : profile ? 'Profile · Rosen' : 'Chat AI · Rosen'; }, [profile, callback, dashboard]);
  if (callback) return <PayPalCallback cancelled={callbackPath === '/paypal/cancel'}/>;
  return <><div className="route-view" hidden={profile}><App intent={intent} intentRequest={intentRequest} recordPayment={recordPayment} onChooseRole={chooseRole}/></div>{dashboard ? <Suspense fallback={<p role="status">Loading dashboard…</p>}><Dashboard/></Suspense> : profile ? <Profile payments={payments}/> : (intentDialogKey > 0 || !readPending()) && <ChatIntentDialog key={intentDialogKey} onSelect={selectIntent}/>}</>;
}
