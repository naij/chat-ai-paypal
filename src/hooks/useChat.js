import { readPending } from '../api/paypal';
import { useEffect, useRef, useState } from 'react';
import { stageMessages, textLength } from '../chat.js';

export function useChat() {
  const [chat, setChat] = useState(() => readPending()?.snapshot || { stage: 'home', messages: [], candidate: null, task: null });
  const [busy, setBusy] = useState(false);
  const [animate, setAnimate] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const current = useRef(chat), generation = useRef(0), locked = useRef(false), history = useRef([]), skip = useRef(false), animation = useRef(animate), ids = useRef(Math.max(0, ...chat.messages.map(message => message.id)));
  animation.current = animate;
  function update(updater) { current.current = updater(current.current); setChat(current.current); }
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  useEffect(() => () => { generation.current++; }, []);
  async function run(stage, text, scroll = 0, payload = {}) {
    if (locked.current) return;
    history.current.push({ ...current.current, scroll });
    const token = ++generation.current;
    locked.current = true; skip.current = false; setBusy(true);
    const typingId = ++ids.current;
    update(previous => ({ ...previous, stage, task: payload.task || previous.task, candidate: payload.candidate || previous.candidate, messages: [...previous.messages,
      ...(text ? [{ id: ++ids.current, type: 'user', text, finance: false }] : []),
      { id: typingId, type: 'typing' }] }));
    await pause(animation.current ? 400 : 0);
    if (token !== generation.current) return;
    update(previous => ({ ...previous, messages: previous.messages.filter(message => message.id !== typingId) }));
    for (const item of stageMessages(stage, payload)) {
      if (token !== generation.current) return;
      const id = ++ids.current;
      const length = item.html ? textLength(item.html) : 0;
      update(previous => ({ ...previous, messages: [...previous.messages, { ...item, id, visible: 0, done: !length }] }));
      let visible = 0;
      while (visible < length) {
        if (token !== generation.current) return;
        visible = !animation.current || skip.current ? length : Math.min(visible + 4, length);
        const count = visible;
        update(previous => ({ ...previous, messages: previous.messages.map(message => message.id === id ? { ...message, visible: count, done: count === length } : message) }));
        if (visible < length) await pause(16);
      }
    }
    if (token === generation.current) { locked.current = false; setBusy(false); }
  }
  function cancel() { generation.current++; locked.current = false; setBusy(false); }
  function restart() { cancel(); history.current = []; update(() => ({ stage: 'home', messages: [], candidate: null, task: null })); }
  function back() {
    cancel();
    const previous = history.current.pop();
    if (!previous) { restart(); return 0; }
    const { scroll, ...rest } = previous;
    update(() => rest); return scroll;
  }
  return { ...chat, busy, animate, setAnimate, run, restart, back,
    startBoss: () => {
      cancel();
      history.current.push({ ...current.current, scroll: 0 });
      update(previous => ({ ...previous, stage: 'boss-ready', candidate: null, messages: previous.messages.filter(message => message.type !== 'typing').map(message => message.html ? { ...message, done: true, visible: textLength(message.html) } : message) }));
    },
    startHire: () => {
      cancel();
      update(previous => ({ ...previous, messages: previous.messages.filter(message => message.type !== 'typing').map(message => message.html ? { ...message, done: true, visible: textLength(message.html) } : message) }));
      run('hire-opportunities');
    },
    skip: () => { skip.current = true; } };
}
