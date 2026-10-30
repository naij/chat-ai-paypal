import { useEffect } from 'react';

export function useMobileViewport(appRef, inputRef, conversationRef) {
  useEffect(() => {
    const app = appRef.current, input = inputRef.current, conversation = conversationRef.current;
let viewportFrame = 0;
let restingViewportHeight = window.visualViewport?.height ?? window.innerHeight;
let previousViewportWidth = window.innerWidth;
function viewportHeight() {
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  const mobile = window.innerWidth < 600;
  const focused = document.activeElement === input;
  if (Math.abs(previousViewportWidth - window.innerWidth) > 80) restingViewportHeight = height;
  previousViewportWidth = window.innerWidth;
  if (!focused && !app.classList.contains('keyboard-open')) restingViewportHeight = height;
  restingViewportHeight = Math.max(restingViewportHeight, height);
  const keyboardOpen = mobile && restingViewportHeight - height > 120;
  const bottomGap = Math.max(0, conversation.scrollHeight - conversation.scrollTop - conversation.clientHeight);
  app.classList.toggle('keyboard-open', keyboardOpen);
  if (mobile) {
    app.style.height = `${height}px`;
    app.style.setProperty('--viewport-top', `${viewport?.offsetTop ?? 0}px`);
  } else {
    app.style.removeProperty('height');
    app.style.removeProperty('--viewport-top');
  }
  // Preserve the reader's position; keep the newest message above the input when at the bottom.
  if (!conversation.hidden) conversation.scrollTo({
    top: conversation.scrollHeight - conversation.clientHeight - (bottomGap < 100 ? 0 : bottomGap),
    behavior: 'instant'
  });
}
function scheduleViewport() {
  cancelAnimationFrame(viewportFrame);
  viewportFrame = requestAnimationFrame(viewportHeight);
}
window.visualViewport?.addEventListener('resize', scheduleViewport);
window.visualViewport?.addEventListener('scroll', scheduleViewport);
window.addEventListener('resize', scheduleViewport);
const onFocus = () => {
  if (!conversation.hidden) conversation.scrollTo({ top: conversation.scrollHeight, behavior: 'instant' });
  scheduleViewport();
};
input.addEventListener('focus', onFocus);
input.addEventListener('blur', scheduleViewport);
// Safari gesture events and multi-touch fallback complement the viewport / touch-action rules.
const preventGesture = event => event.preventDefault();
for (const name of ['gesturestart', 'gesturechange']) document.addEventListener(name, preventGesture, { passive: false });
const preventMultiTouch = event => { if (event.touches.length > 1) event.preventDefault(); };
document.addEventListener('touchmove', preventMultiTouch, { passive: false });
viewportHeight();
return () => {
  cancelAnimationFrame(viewportFrame);
  window.visualViewport?.removeEventListener('resize', scheduleViewport);
  window.visualViewport?.removeEventListener('scroll', scheduleViewport);
  window.removeEventListener('resize', scheduleViewport);
  input.removeEventListener('focus', onFocus);
  input.removeEventListener('blur', scheduleViewport);
  for (const name of ['gesturestart', 'gesturechange']) document.removeEventListener(name, preventGesture);
  document.removeEventListener('touchmove', preventMultiTouch);
};

  }, [appRef, inputRef, conversationRef]);
}
