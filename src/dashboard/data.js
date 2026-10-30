// Fixed, reproducible mock orders; no production payment data is used.
const countries = ['Argentina', 'Chile', 'Brazil', 'Singapore', 'Malaysia'];
const services = ['Ground promotion', 'Product testing', 'Market research', 'Community event'];
export const orders = Array.from({ length: 72 }, (_, i) => {
  const amount = [350, 150, 400, 15, 200, 90, 120, 250][i % 8];
  const status = i % 11 === 0 ? 'Refunded' : i % 7 === 0 ? 'In progress' : 'Completed';
  return { id: `DEMO-${1001 + i}`, date: `2026-10-${String(1 + i % 26).padStart(2, '0')}`, country: countries[i % 5], service: services[i % 4], method: i % 3 === 0 ? 'PYUSD' : 'PayPal', status, amount, revenue: status === 'Completed' ? amount : 0, users: status === 'Completed' ? 20 + i % 90 : 0 };
});
export const data = { sources: [{ id: 'orders', name: 'Demo orders', data: orders, fields: [
  ...['id', 'date', 'country', 'service', 'method', 'status'].map(id => ({ id, name: ({ id: 'Order ID', date: 'Date', country: 'Country', service: 'Service', method: 'Payment method', status: 'Status' })[id], format: 'textFormat' })),
  ...['amount', 'revenue'].map(id => ({ id, name: id === 'amount' ? 'Order amount (USD)' : 'Received revenue (USD)', format: 'currencyFormat', formatOptions: { format: '$#,##0.00' } })),
  { id: 'users', name: 'Users acquired', format: 'integerFormat' }
] }] };
const field = (id, aggregation) => ({ id: `orders.${id}`, ...(aggregation ? { aggregation } : {}) });
const title = text => ({ title: { enabled: true, text } });
const value = (id, aggregation, caption) => ({ type: 'value', dataMapping: { value: [field(id, aggregation)] }, format: { caption: { enabled: true, text: caption } } });
const chart = (id, caption) => ({ type: 'bar-chart-grouped', dataMapping: { categoryKey: [field(id)], valueKey: [field('revenue', 'sum')] }, format: title(caption) });
export const initialState = {
  selectedPageId: 'overview', panels: { filters: { collapsed: true }, edit: { collapsed: true }, data: { collapsed: true } },
  pages: [{ id: 'overview', name: 'Overview', widgets: {
    revenue: value('revenue', 'sum', 'Received revenue · USD'), orders: value('id', 'countd', 'Orders'), countries: value('country', 'countd', 'Countries'), users: value('users', 'sum', 'Users acquired'),
    trend: { ...chart('date', 'Daily received revenue'), type: 'line-chart', sort: [{ field: field('date'), direction: 'asc' }] }, countriesChart: chart('country', 'Revenue by country'), channels: chart('method', 'Revenue by payment method'), services: chart('service', 'Revenue by service')
  }, widgetLayout: {
    revenue: { xTrack: 0, yTrack: 0, xSpan: 6, ySpan: 6 }, orders: { xTrack: 6, yTrack: 0, xSpan: 6, ySpan: 6 }, countries: { xTrack: 12, yTrack: 0, xSpan: 6, ySpan: 6 }, users: { xTrack: 18, yTrack: 0, xSpan: 6, ySpan: 6 },
    trend: { xTrack: 0, yTrack: 6, xSpan: 14, ySpan: 15 }, countriesChart: { xTrack: 14, yTrack: 6, xSpan: 10, ySpan: 15 }, channels: { xTrack: 0, yTrack: 21, xSpan: 12, ySpan: 14 }, services: { xTrack: 12, yTrack: 21, xSpan: 12, ySpan: 14 }
  } }, { id: 'transactions', name: 'Transactions', widgets: {
    status: { type: 'list-filter', dataMapping: { value: [field('status')] }, format: title('Order status') },
    details: { type: 'grid', dataMapping: { cols: ['id', 'date', 'country', 'service', 'method', 'status', 'amount', 'revenue', 'users'].map(id => field(id)) }, format: title('Mock transaction details') }
  }, widgetLayout: { status: { xTrack: 0, yTrack: 0, xSpan: 5, ySpan: 32 }, details: { xTrack: 5, yTrack: 0, xSpan: 19, ySpan: 32 } } }]
};
