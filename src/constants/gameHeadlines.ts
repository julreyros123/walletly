export interface StockHeadline {
  id: string;
  ticker: string;
  companyName: string;
  sector: 'Tech' | 'Fashion' | 'Beverage' | 'Gaming' | 'Clean Energy' | 'Food' | 'Entertainment' | 'Streetwear';
  categoryIcon: string;
  logoBg: string;
  headline: string;
  detail: string;
  actualImpact: number; // Positive = Stock goes UP (e.g. +18%), Negative = Stock goes DOWN (e.g. -15%)
  correctAction: 'BUY' | 'SELL';
  explanation: string;
  virtualBaseBet: number;
}

export const GAME_HEADLINES_POOL: StockHeadline[] = [
  // --- FASHION & SNEAKERS ---
  {
    id: 'h1',
    ticker: 'SNKR',
    companyName: 'SneakrDrop',
    sector: 'Fashion',
    categoryIcon: '👟',
    logoBg: '#EC4899',
    headline: 'Viral K-Pop Collab Sells Out in 90 Seconds Worldwide!',
    detail: 'SneakrDrop announced record pre-orders for their limited-edition glow sneaker collection endorsed by top global idols.',
    actualImpact: 18.5,
    correctAction: 'BUY',
    explanation: 'Massive unexpected consumer demand and instant sellouts boost quarterly revenue forecasts.',
    virtualBaseBet: 500,
  },
  {
    id: 'h2',
    ticker: 'AERO',
    companyName: 'AeroKicks Streetwear',
    sector: 'Streetwear',
    categoryIcon: '🧢',
    logoBg: '#6366F1',
    headline: 'Counterfeit Controversy: Fake Jackets Found in Official Stores',
    detail: 'Social media watchdog videos expose authentic stores accidentally stocking knock-off winter hoodies.',
    actualImpact: -16.8,
    correctAction: 'SELL',
    explanation: 'Brand trust and prestige are critical for streetwear; authenticity scandals trigger immediate stock downgrades.',
    virtualBaseBet: 450,
  },

  // --- BEVERAGES & FOOD ---
  {
    id: 'h3',
    ticker: 'BYTE',
    companyName: 'ByteCoffee',
    sector: 'Beverage',
    categoryIcon: '☕',
    logoBg: '#F59E0B',
    headline: 'Oat Milk Supply Chain Disrupted Ahead of Midterms Week',
    detail: 'ByteCoffee warns investors that ingredient shortages will temporarily close 30% of campus kiosks.',
    actualImpact: -14.2,
    correctAction: 'SELL',
    explanation: 'Supply bottlenecks during peak sales season directly lower expected earnings and foot traffic.',
    virtualBaseBet: 500,
  },
  {
    id: 'h4',
    ticker: 'BOBA',
    companyName: 'BobaRush Global',
    sector: 'Beverage',
    categoryIcon: '🧋',
    logoBg: '#10B981',
    headline: 'Zero-Sugar Brown Sugar Pearls Approved as Healthy Snack',
    detail: 'BobaRush secures exclusive health certification, signing a 500-store expansion deal across university campuses.',
    actualImpact: 21.4,
    correctAction: 'BUY',
    explanation: 'Health-conscious menu innovations open up massive new recurring demographics.',
    virtualBaseBet: 550,
  },
  {
    id: 'h5',
    ticker: 'BURGR',
    companyName: 'CrispyBite FastFood',
    sector: 'Food',
    categoryIcon: '🍔',
    logoBg: '#EF4444',
    headline: 'Secret Spicy Sauce Recipe Goes Viral with 50M TikTok Views',
    detail: 'Store foot traffic surged 45% over the weekend as teenagers queued up for the viral challenge.',
    actualImpact: 15.8,
    correctAction: 'BUY',
    explanation: 'Organic viral marketing provides free customer acquisition and explosive short-term sales growth.',
    virtualBaseBet: 400,
  },

  // --- GAMING & ESPORTS ---
  {
    id: 'h6',
    ticker: 'PLAY',
    companyName: 'GameVerse Studios',
    sector: 'Gaming',
    categoryIcon: '🎮',
    logoBg: '#8B5CF6',
    headline: 'Flagship Multiplayer Battle Royale Delayed by 6 Months',
    detail: 'Developers cite performance bugs on older phones, pushing the holiday launch into next year.',
    actualImpact: -19.0,
    correctAction: 'SELL',
    explanation: 'Delays in major product releases hurt holiday revenue expectations and shake investor confidence.',
    virtualBaseBet: 500,
  },
  {
    id: 'h7',
    ticker: 'PIXEL',
    companyName: 'PixelCraft MMO',
    sector: 'Gaming',
    categoryIcon: '🕹️',
    logoBg: '#D946EF',
    headline: 'Monthly Active Players Surpass 100 Million Milestone',
    detail: 'In-game virtual concert event breaks all-time digital microtransaction revenue records.',
    actualImpact: 24.5,
    correctAction: 'BUY',
    explanation: 'User base network effects and high in-game purchase retention create high-margin profits.',
    virtualBaseBet: 600,
  },

  // --- TECH & AI GADGETS ---
  {
    id: 'h8',
    ticker: 'ROBO',
    companyName: 'RoboTutor AI',
    sector: 'Tech',
    categoryIcon: '🤖',
    logoBg: '#3B82F6',
    headline: 'Data Privacy Audit Cleared with Top 5-Star Rating',
    detail: 'School districts approve RoboTutor AI for nationwide high school homework assistance integration.',
    actualImpact: 17.2,
    correctAction: 'BUY',
    explanation: 'Regulatory approval opens up multi-million institutional contracts and eliminates legal risks.',
    virtualBaseBet: 500,
  },
  {
    id: 'h9',
    ticker: 'DRONE',
    companyName: 'Dronely Air Delivery',
    sector: 'Tech',
    categoryIcon: '🛸',
    logoBg: '#0EA5E9',
    headline: 'GPS Signal Jamming Glitch Causes 50 Pizza Drops in Rivers',
    detail: 'City councils temporarily ground commercial delivery drones after multiple lunch delivery crashes.',
    actualImpact: -18.2,
    correctAction: 'SELL',
    explanation: 'Safety investigations and operational grounding halt daily cash flow immediately.',
    virtualBaseBet: 450,
  },
  {
    id: 'h10',
    ticker: 'LENS',
    companyName: 'SmartLens AR',
    sector: 'Tech',
    categoryIcon: '👓',
    logoBg: '#06B6D4',
    headline: 'Lightweight Smart Glasses Unveiled at Tokyo Tech Expo',
    detail: 'Tech reviewers praise all-day battery life and built-in live language translation for student travelers.',
    actualImpact: 20.1,
    correctAction: 'BUY',
    explanation: 'Superior product reviews versus competitors establish category leadership.',
    virtualBaseBet: 500,
  },

  // --- CLEAN ENERGY & MOBILITY ---
  {
    id: 'h11',
    ticker: 'SOLR',
    companyName: 'SolarJuice Energy',
    sector: 'Clean Energy',
    categoryIcon: '⚡',
    logoBg: '#10B981',
    headline: 'Breakthrough: New Backpack Solar Panels Charge Laptops 2x Faster',
    detail: 'Government awards SolarJuice a nationwide clean tech innovation grant for student campus rollout.',
    actualImpact: 22.0,
    correctAction: 'BUY',
    explanation: 'Patented technology breakthroughs combined with government grants drastically increase company valuation.',
    virtualBaseBet: 600,
  },
  {
    id: 'h12',
    ticker: 'VOLT',
    companyName: 'VoltRider E-Bikes',
    sector: 'Clean Energy',
    categoryIcon: '🚲',
    logoBg: '#14B8A6',
    headline: 'Battery Safety Recall Initiated for 15,000 Electric Scooters',
    detail: 'City regulators suspend dockless rental permits pending thorough safety inspections.',
    actualImpact: -21.4,
    correctAction: 'SELL',
    explanation: 'Product recalls create immediate warranty liabilities and halt rental subscription revenue.',
    virtualBaseBet: 550,
  },

  // --- ENTERTAINMENT & SOCIAL MEDIA ---
  {
    id: 'h13',
    ticker: 'STREAM',
    companyName: 'SoundWave Music',
    sector: 'Entertainment',
    categoryIcon: '🎧',
    logoBg: '#F43F5E',
    headline: 'Unexpected Server Outage During Grammy Livestream',
    detail: 'Millions of premium listeners experienced 4 hours of silence during the biggest concert of the year.',
    actualImpact: -12.5,
    correctAction: 'SELL',
    explanation: 'Service outages during high-profile events damage brand reputation and increase subscription cancellations.',
    virtualBaseBet: 450,
  },
  {
    id: 'h14',
    ticker: 'VIBE',
    companyName: 'VibeTok Social',
    sector: 'Entertainment',
    categoryIcon: '📱',
    logoBg: '#A855F7',
    headline: 'New Creator Monetization Program Attracts Top 500 Streamers',
    detail: 'Competitor platform creators migrate en masse, boosting daily video uploads by 80%.',
    actualImpact: 23.8,
    correctAction: 'BUY',
    explanation: 'Creator network migration increases platform engagement and ad revenue per user.',
    virtualBaseBet: 550,
  },
];

export function getRandomHeadlineRound(count = 5): StockHeadline[] {
  const shuffled = [...GAME_HEADLINES_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
