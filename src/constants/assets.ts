import type { PhosphorIconName } from '@/components/ui/PhosphorIcon';

export interface Asset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  icon: PhosphorIconName;
  color: string;
  sparkline: number[];
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  partner: string;
  description: string;
}

export interface AssetDetails extends Asset {
  marketCap: string;
  volume: string;
  high52: number;
  low52: number;
  peRatio: string;
  history1D: number[];
  history1W: number[];
  history1M: number[];
}

export interface TeenGuide {
  analogy: string;
  riskExplanation: string;
}

export const TEEN_GUIDES: Record<string, TeenGuide> = {
  NOVA: {
    analogy: "🎮 Think of NOVA like buying a piece of the factory that makes the ultimate graphics cards (GPUs) for playing GTA 6 or running AI tools like ChatGPT. Since AI is blowing up, NOVA grows super fast!",
    riskExplanation: "⚡ Aggressive Risk: It's like riding a roller coaster. If gamers find a cooler chip brand tomorrow, the price could drop fast. High risk, high reward!"
  },
  VOLT: {
    analogy: "⚡ Imagine VOLT like owning a piece of a high-tech electric car company. They build supercars and smart solar batteries. It's clean energy, which is super popular with your generation.",
    riskExplanation: "🚗 Aggressive Risk: Car companies spend billions building factories. If they have a delay launching a new car, the stock drops. Only allocate cash you don't need soon!"
  },
  BREW: {
    analogy: "☕ Think of BREW like owning your favorite local coffee shop right outside school. Students will always buy caffeinated iced lattes and bubble tea to stay awake during tests. It's super stable.",
    riskExplanation: "📈 Moderate Risk: Coffee is always popular, but if coffee bean prices rise globally, their profit dips slightly. It grows steadily whenever they open new outlets."
  },
  APEX: {
    analogy: "📦 Think of APEX like the drone-delivery service that drops off your online shopping orders at your doorstep 15 minutes after you tap buy. They run the biggest shopping warehouses.",
    riskExplanation: "🛡️ Conservative Risk: Everyone shops online constantly, making APEX very safe. It doesn't double overnight, but it is a solid safe-haven for your savings."
  },
  SOLR: {
    analogy: "☀️ Imagine SOLR like the power company, but they harvest orbital space beams. Everyone has to charge their phones, laptops, and consoles, so they pay SOLR for power every single month.",
    riskExplanation: "🛡️ Conservative Risk: Since electricity is a basic need, SOLR is extremely safe. It is like putting money in a premium piggy bank with a guaranteed slow climb."
  }
};

export const ASSET_DATA: Record<string, AssetDetails> = {
  NOVA: {
    ticker: 'NOVA',
    name: 'NovaChip AI Corp',
    price: 512.80,
    change: 2.45,
    icon: 'Cpu',
    color: '#A855F7',
    sparkline: [8, 9, 7, 10, 11, 9, 12],
    riskProfile: 'Aggressive',
    partner: 'Semiconductors',
    description: 'Neural core processors and AI accelerators for deep learning clusters.',
    marketCap: '₱1.8 Million',
    volume: '₱42,100',
    high52: 545.00,
    low52: 380.00,
    peRatio: '32.4',
    history1D: [502.10, 505.00, 498.50, 510.30, 507.00, 512.80],
    history1W: [480.00, 495.20, 510.50, 490.10, 505.30, 515.00, 512.80],
    history1M: [420.00, 435.00, 440.00, 430.00, 455.00, 470.00, 465.00, 490.00, 505.00, 512.80],
  },
  VOLT: {
    ticker: 'VOLT',
    name: 'Volt Motors',
    price: 345.50,
    change: -1.85,
    icon: 'Lightning',
    color: '#22C55E',
    sparkline: [12, 13, 11, 14, 13, 10, 9],
    riskProfile: 'Aggressive',
    partner: 'Clean Energy & EV',
    description: 'Electric mobility, structural battery packs, and smart solar grids.',
    marketCap: '₱1.2 Million',
    volume: '₱28,500',
    high52: 395.00,
    low52: 290.00,
    peRatio: '24.8',
    history1D: [352.00, 350.50, 348.00, 349.50, 346.00, 345.50],
    history1W: [365.00, 360.00, 358.00, 352.00, 350.00, 344.00, 345.50],
    history1M: [330.00, 335.00, 340.00, 352.00, 368.00, 370.00, 362.00, 355.00, 349.00, 345.50],
  },
  BREW: {
    ticker: 'BREW',
    name: 'StarBrew Café',
    price: 125.30,
    change: 0.35,
    icon: 'Coffee',
    color: '#F59E0B',
    sparkline: [8, 8, 9, 9, 10, 10, 11],
    riskProfile: 'Moderate',
    partner: 'Consumer Retail',
    description: 'Global chain of automated barista cafes and specialty beans.',
    marketCap: '₱450,000',
    volume: '₱8,200',
    high52: 135.00,
    low52: 110.00,
    peRatio: '14.2',
    history1D: [124.90, 125.00, 125.10, 124.80, 125.20, 125.30],
    history1W: [122.00, 123.50, 123.00, 124.10, 124.50, 125.00, 125.30],
    history1M: [118.00, 119.50, 120.00, 120.50, 122.00, 122.50, 123.00, 124.00, 124.80, 125.30],
  },
  APEX: {
    ticker: 'APEX',
    name: 'Apex Logi-Retail',
    price: 185.20,
    change: 0.12,
    icon: 'ShoppingCart',
    color: '#EF4444',
    sparkline: [5, 6, 6, 7, 7, 7, 8],
    riskProfile: 'Conservative',
    partner: 'E-Commerce',
    description: 'Global e-commerce marketplace and autonomous drone delivery operations.',
    marketCap: '₱890,000',
    volume: '₱14,800',
    high52: 195.00,
    low52: 165.00,
    peRatio: '19.1',
    history1D: [184.80, 185.00, 185.10, 184.90, 185.00, 185.20],
    history1W: [183.50, 184.00, 183.80, 184.50, 184.80, 185.00, 185.20],
    history1M: [175.00, 177.00, 178.50, 180.00, 182.00, 181.50, 183.00, 184.00, 184.80, 185.20],
  },
  SOLR: {
    ticker: 'SOLR',
    name: 'Solaris Power',
    price: 95.60,
    change: 0.78,
    icon: 'Sun',
    color: '#0EA5E9',
    sparkline: [6, 6, 7, 7, 8, 8, 9],
    riskProfile: 'Conservative',
    partner: 'Utility Provider',
    description: 'Orbital energy solar reflector grids distributing wireless clean power.',
    marketCap: '₱320,000',
    volume: '₱5,400',
    high52: 102.00,
    low52: 84.00,
    peRatio: '11.8',
    history1D: [94.80, 95.00, 95.20, 95.10, 95.40, 95.60],
    history1W: [93.00, 93.80, 94.20, 94.00, 94.80, 95.20, 95.60],
    history1M: [88.00, 89.50, 90.00, 91.20, 92.50, 93.00, 93.80, 94.50, 95.00, 95.60],
  }
};

export const ASSETS_LIST: Asset[] = Object.values(ASSET_DATA);
