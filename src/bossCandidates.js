export const bossPrompt = 'I want to expand into the South American market and acquire customers for my product through grassroots marketing (ground promotion). Any good suggestions?';
export const bossCandidates = [
  { id: 'A', name: 'Ruti Avalos', photo: 'https://static.gorosen.xyz/member/1c0844de-9d36-11f0-b148-0242ac140008.png', country: 'Argentina', quote: 350, description: 'Can host local street-team promotions and post on social media. Estimated acquisition: 100 users.', details: 'Includes material production, venue fees, and all-inclusive costs' },
  { id: 'B', name: 'David Lucio', photo: 'https://static.gorosen.xyz/member/dce8149f-acbd-11f0-b738-0242ac140008.png', country: 'Chile', quote: 150, description: 'Can represent you at local events and distribute flyers inside the venue.', details: 'Includes banner and flyer production' },
  { id: 'C', name: 'Hiago Vicente', photo: 'https://rosen-dev-pub.oss-accelerate.aliyuncs.com/member/945b3521-f505-11f0-97fc-0242ac140007.jpg', country: 'Brazil', quote: 400, description: 'Owns a skateboarding community of over 1,000 members. Can host a community event and promote your product directly to your target audience.', details: 'Estimated acquisition: 100 users' }
];
export const bossProofs = {
  A: { image: '/assets/proofs/a.jpg', text: 'This is an event site screenshot. Check out more onsite photos on my Instagram.' },
  B: { image: '/assets/proofs/b.png', text: 'Completed, I have sent an email to you for more proof.' },
  C: { image: '/assets/proofs/c.png', text: '100 users acquired. I will send the customer acquisition list shortly. Thank you.' }
};

// Local demo invoice image. Replace this adapter with the invoice API when available.
export function invoiceImage(candidate, orderId) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="510" viewBox="0 0 680 510"><rect width="680" height="510" rx="24" fill="#f8f8ff"/><rect x="0" y="0" width="680" height="90" rx="24" fill="#6255ed"/><text x="36" y="57" font-family="Arial" font-size="27" font-weight="bold" fill="white">ROSEN · SMART INVOICE</text><g font-family="Arial" fill="#252339"><text x="36" y="138" font-size="16">DEMO INVOICE · ${orderId}</text><text x="36" y="192" font-size="22" font-weight="bold">${candidate.name} · ${candidate.country}</text><text x="36" y="235" font-size="18">Grassroots marketing / ground promotion</text><path d="M36 266H644" stroke="#d9daeb"/><text x="36" y="313" font-size="20">Total paid</text><text x="480" y="313" font-size="28" font-weight="bold">$${candidate.quote}.00</text><text x="36" y="365" font-size="20" fill="#13835e">PAYMENT COMPLETED</text><text x="36" y="429" font-size="15">Generated locally for this demo. No invoice API connected.</text><text x="36" y="459" font-size="15">Not a tax invoice. No real funds were transferred.</text></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
