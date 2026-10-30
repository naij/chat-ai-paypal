import { useEffect, useRef, useState } from 'react';

export default function ChatIntentDialog({ onSelect }) {
  const dialogRef = useRef(null);
  const [chosen, setChosen] = useState(false);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  function select(intent) {
    onSelect(intent);
    dialogRef.current.close();
    setChosen(true);
  }
  if (chosen) return null;
  return <dialog ref={dialogRef} id="chat-intent-dialog" className="chat-intent-dialog" aria-labelledby="chat-intent-title" onCancel={() => { location.hash = '/profile'; }}>
    <button type="button" className="dialog-close" aria-label="Back to profile" onClick={() => { location.hash = '/profile'; }}>×</button>
    <img className="intent-frog" src="/assets/frog.png" alt=""/>
    <h2 id="chat-intent-title">What would you like to do?</h2>
    <div className="intent-options">
      <button type="button" className="intent-option" onClick={() => select('hire')}>
        <span className="intent-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a22 22 0 0 0 18 0m-9 1v3"/></svg></span>
        <span>I want to earn money</span><svg className="intent-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
      </button>
      <button type="button" className="intent-option" onClick={() => select('earn')}>
        <span className="intent-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m4-14v8m-4-4h8"/></svg></span>
        <span>I want to hire someone</span><svg className="intent-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
      </button>
    </div>
  </dialog>;
}
