// Demo data only. This page does not call the member, wallet, post or plot APIs.
export const mockProfile = {
  displayName: 'Aria Chen', country: 'Singapore', bio: 'Connecting people and ideas across Southeast Asia. Event planner, curious traveler, and a believer in meaningful collaborations.',
  avatar: 'https://static-gorosen-xyz.oss-accelerate.aliyuncs.com/images/76e287b3863485f4ac2ecb3f3636efb7.jpg', platform: 'Google', constellation: 'Virgo', gender: 'Female', mbti: 'INFJ',
  followings: 218, followers: 188,
  balances: [{ label: 'GEM', amount: 60000, icon: 'gem' }, { label: 'ENGY', amount: 6980999, icon: 'energy' }, { label: 'COIN', amount: 130000, icon: 'gold_coin' }],
  properties: [{ name: 'Creative Studio', location: 'Singapore', image: '/assets/profile/plot_style_2.png' }, { name: 'Community House', location: 'Kuala Lumpur', image: '/assets/profile/plot_style_3.png' }, { name: 'Coastal Retreat', location: 'Bali', image: '/assets/profile/plot_style_4.png' }],
  posts: [{ title: 'A new space for new ideas', body: 'Opening my creative studio to local makers and collaborators. Let’s build something together.', image: '/assets/profile/plot_style_2.png', date: 'Oct 18, 2026' }, { title: 'Small moments, great connections', body: 'A weekend of conversations, shared ideas, and planning our next community event.', image: '/assets/frog.png', date: 'Oct 15, 2026' }, { title: 'Next stop: Bali', body: 'Exploring new places and gathering inspiration for our next regional meetup.', image: '/assets/profile/plot_style_4.png', date: 'Oct 12, 2026' }],
  wants: [{ label: 'Business partners', icon: 'want' }, { label: 'Event venues', icon: 'cell_property' }, { label: 'Travel tips', icon: 'location' }],
  offers: [{ label: 'Event planning', icon: 'offer' }, { label: 'Market insights', icon: 'cell_assets' }, { label: 'Community building', icon: 'want' }],
  people: [{ name: 'Emma', location: 'Singapore', initials: 'EM' }, { name: 'Alex', location: 'Malaysia', initials: 'AL' }, { name: 'Maya', location: 'Indonesia', initials: 'MA' }],
  polls: [{ title: 'Where should we meet next?', detail: '3 options · 24 responses' }, { title: 'Choose our next workshop', detail: '4 options · 16 responses' }],
  tasks: [{ title: 'Plan a regional community meetup', detail: 'In progress · Kuala Lumpur' }, { title: 'Review the Singapore market brief', detail: 'Completed · Singapore' }]
};
