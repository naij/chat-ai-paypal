import { bossCandidates } from './bossCandidates.js';
import { hireTasks } from './hireTasks.js';

export const activeActions = { 'boss-candidates': ['boss-candidate'], 'boss-selected': ['boss-paypal', 'boss-pyusd'], 'boss-paid': ['boss-profile', 'boss-reject', 'boss-approve'], 'boss-approved': ['boss-profile', 'dashboard'], 'boss-refunded': [], 'hire-opportunities': ['hire-task'], 'hire-selected': ['proof'], 'hire-submitted': ['payout-paypal', 'payout-pyusd'], 'hire-paid': ['dashboard'] };
const text = (html, className = '', extra = {}) => ({ type: 'text', html, className, ...extra });
const action = (label, action, className = 'primary step-action') => ({ type: 'action', label, action, className });
export function stageMessages(stage, payload = {}) {
  switch (stage) {
    case 'boss-candidates': return [text('I have filtered a few South American users who specialize in grassroots promotion for you:', 'intro'), ...bossCandidates.map(candidate => text(`<strong>${candidate.id}: ${candidate.name}</strong> (${candidate.country}) – ${candidate.description} <strong>Quote: $${candidate.quote}</strong> (${candidate.details}).`, 'card hire-task', { candidate }))];
    case 'boss-selected': return [text(`You have selected <strong>${payload.candidate.name}</strong>. Pay via <strong>PayPal or PYUSD</strong> to lock in the funds. <strong>Total: $${payload.candidate.quote}</strong>.`, 'card assistant-reply'), { type: 'boss-payment-options' }];
    case 'boss-paid': return [text('<strong>Payment successful.</strong>', 'card boss-payment-success'), text("You have successfully placed the order, and you can chat with the other party about the progress of your task at any time. Click the user's profile and tap the green chat button to start chatting.", 'card assistant-reply'), action(`View ${payload.candidate.name}’s profile`, 'boss-profile'), text('The user you selected has completed the task and submitted proof. Please review:', 'card assistant-reply'), { type: 'boss-proof', person: payload.candidate }, { type: 'boss-review-options' }];
    case 'boss-refunded': return [text('Your funds/prepayment are refunded.', 'card assistant-reply')];
    case 'boss-approved': return [text('<strong>Payment completed.</strong>', 'card boss-payment-success'), text('A smart invoice has been generated for this transaction (API-integrated image), and your <strong>Credit Score +200</strong>!', 'card assistant-reply'), { type: 'boss-invoice', person: payload.candidate, orderId: payload.orderId }, action('View dashboard', 'dashboard')];
    case 'hire-opportunities': return [text('Great! I have matched you with a few suitable opportunities:', 'intro'), ...hireTasks.map(task => text(`<strong>${task.id}:</strong> ${task.description}<br><strong>Budget: $${task.budget}, Expires in ${task.hours} hours</strong>`, 'card hire-task', { task }))];
    case 'hire-selected': return [text(`Great, you have selected Task ${payload.task.id}, which needs to be completed within ${payload.task.hours} hours. Once you are done, please submit your proof through here.`, 'card assistant-reply'), action('Submit proof', 'proof')];
    case 'hire-submitted': return [{ type: 'proof', task: payload.task, proof: payload.proof }, text('The Boss has approved your submission. Please bind your payout method to receive funds.', 'card assistant-reply'), { type: 'payout-options' }];
    case 'hire-paid': return [text(payload.payment.method === 'pyusd' ? `The ${payload.payment.amount} PYUSD has been transferred to your wallet in Rosen, and you can withdraw it to your private wallet at any time.` : `The $${payload.payment.amount} payment has been received in your PayPal account.`, 'card assistant-reply'), { type: 'payment-success', payment: payload.payment }, ...(payload.payment.method === 'paypal' ? [{ type: 'external-link', label: 'View in PayPal', href: 'https://www.sandbox.paypal.com/' }, action('View dashboard', 'dashboard')] : [text('Congratulations! Your credit level has been upgraded. You are now eligible to apply for a Mastercard—please check your dashboard.', 'card assistant-reply'), action('View dashboard', 'dashboard')])];
    default: return [];
  }
}

// The local script supports only bold text and line breaks. User messages never enter this parser.
export function richTokens(html) {
  let bold = false;
  return html.split(/(<strong>|<\/strong>|<br\s*\/?\s*>)/i).flatMap(part => {
    if (part === '<strong>') { bold = true; return []; }
    if (part === '</strong>') { bold = false; return []; }
    if (/^<br/i.test(part)) return [{ br: true }];
    return part ? [{ text: part, bold }] : [];
  });
}
export function textLength(html) { return richTokens(html).reduce((length, token) => length + (token.text?.length || 0), 0); }
