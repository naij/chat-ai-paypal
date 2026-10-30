import { useLayoutEffect } from 'react';

export default function Composer({ inputRef, value, setValue, busy, onSend, menu, toggleMenu }) {
  useLayoutEffect(() => {
    const input = inputRef.current;
    const form = input.closest('form');
    const app = form.closest('.app');
    function resize() {
      input.style.height = 'auto';
      const limit = Math.min(320, Math.max(100, (window.visualViewport?.height || window.innerHeight) * .45));
      const height = Math.min(input.scrollHeight, limit);
      input.style.height = `${height}px`;
      input.style.overflowY = input.scrollHeight > height + 1 ? 'auto' : 'hidden';
    }
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => {
      if (input.clientWidth !== width) { width = input.clientWidth; resize(); }
      app.style.setProperty('--composer-height', `${form.offsetHeight}px`);
    });
    observer.observe(form);
    resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => { observer.disconnect(); window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize); };
  }, [value, inputRef]);
  return <form id="composer" className="composer" autoComplete="off" onSubmit={event => { event.preventDefault(); onSend(); }}>
    <div className="input-pill"><label className="sr-only" htmlFor="message-input">Your message</label><textarea id="message-input" ref={inputRef} rows={1} maxLength={2000} placeholder="Meet New Friends" enterKeyHint="send" value={value} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); onSend(); } }}/><button id="send" type="submit" className="send" disabled={busy}>Send</button></div>
    <button id="more" type="button" className="more" aria-label="Open demo controls" aria-controls="tools-menu" aria-expanded={menu} onClick={toggleMenu}><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="16"/><path d="M22 12v20M12 22h20"/></svg></button>
  </form>;
}
