import { useRef, useState } from 'react';
import { AgStudio, AgStudioProvider } from 'ag-studio-react';
import { data, initialState } from '../dashboard/data';
import './dashboard.css';

export default function Dashboard() {
  const studio = useRef(null);
  const [mode, setMode] = useState('view');
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState('overview');
  function selectPage(id) {
    const api = studio.current?.api;
    if (!api) return;
    api.setState({ ...api.getState(), selectedPageId: id });
    setPage(id);
  }
  return <main className="rosen-dashboard">
    <header className="dashboard-header"><a href="#/profile">ROSEN / Profile</a><span>Mock data · 01–26 Oct 2026</span></header>
    <section className="dashboard-heading"><div><h1>Business dashboard</h1><p>Orders, revenue and customer acquisition across your markets.</p></div><button onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}>{mode === 'view' ? 'Edit dashboard' : 'Done editing'}</button></section>
    <nav className="dashboard-toolbar" aria-label="Dashboard pages"><div>{[['overview', 'Overview'], ['transactions', 'Transactions']].map(([id, label]) => <button key={id} disabled={!ready} aria-pressed={page === id} onClick={() => selectPage(id)}>{label}</button>)}</div><span>72 sample orders · USD equivalent · No live payments</span></nav>
    <div className="dashboard-scroll"><div className="dashboard-studio"><AgStudioProvider licenseKey={import.meta.env.VITE_AG_STUDIO_LICENSE_KEY || undefined}><AgStudio ref={studio} data={data} initialState={initialState} mode={mode} onApiReady={() => setReady(true)}/></AgStudioProvider></div></div>
  </main>;
}
