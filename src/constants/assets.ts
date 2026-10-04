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
  eps: number; // Earnings Per Share — stable fundamental; P/E = price / eps (computed dynamically)
  history1D: number[];
  history1W: number[];
  history1M: number[];
}

/**
 * Computes the live P/E ratio from the current price and static EPS.
 * In real life, P/E = Stock Price ÷ Earnings Per Share.
 * EPS stays relatively stable (updated quarterly), while price moves constantly.
 */
export function getLivePE(price: number, eps: number): number {
  if (eps <= 0) return 0;
  return parseFloat((price / eps).toFixed(1));
}

/**
 * Returns a valuation label based on the live P/E ratio.
 * Thresholds are simplified for educational purposes.
 */
export function getValuationLabel(pe: number): { label: string; color: string } {
  if (pe <= 0) return { label: 'N/A', color: '#64748B' };
  if (pe < 15) return { label: 'Undervalued', color: '#10B981' };
  if (pe <= 25) return { label: 'Fair Value', color: '#F59E0B' };
  return { label: 'Overvalued', color: '#EF4444' };
}

export interface TeenGuide {
  analogy: string;
  riskExplanation: string;
}

export interface AssetThesis {
  businessModel: string;
  catalysts: string;
  riskExplanation: string;
}

export const ASSET_THESIS: Record<string, AssetThesis> = {
  NOVA: {
    businessModel: "Designs high-bandwidth GPU architectures and tensor accelerator silicon for hyperscale artificial intelligence models and high-performance computing clusters.",
    catalysts: "Surging global enterprise demand for LLM training infrastructure, sovereign data center initiatives, and high gross margin silicon IP.",
    riskExplanation: "Aggressive Growth Profile: High beta asset sensitive to cyclical semiconductor capital expenditure cycles and rapid competitor architecture advancements."
  },
  VOLT: {
    businessModel: "Engineers advanced electric powertrains, structural lithium battery cells, and integrated renewable commercial storage networks.",
    catalysts: "Accelerating global EV market transition, megawatt commercial grid deployments, and recurring autonomous software licensing revenue.",
    riskExplanation: "Aggressive Growth Profile: Substantial capital intensity for gigafactory scaling and commodity supply chain exposure (lithium & nickel)."
  },
  BREW: {
    businessModel: "Operates an international network of premium automated roasteries and rapid-order specialty beverage kiosks with high customer repeat frequency.",
    catalysts: "High gross margins, predictable daily cash conversion, and rapid franchise footprint expansion across high-density commercial hubs.",
    riskExplanation: "Moderate Defensive Profile: Resilient daily demand, but exposed to green coffee commodity price inflation and discretionary spending trends."
  },
  APEX: {
    businessModel: "Dominant omnichannel e-commerce retail infrastructure, automated logistics sorting facilities, and merchant cloud fulfillment services.",
    catalysts: "Essential consumer staples retail dominance, high-margin marketplace services, and high customer retention via membership subscriptions.",
    riskExplanation: "Conservative Core Profile: Stable free cash flow generator, though sensitive to regional freight shipping costs and warehouse operating overhead."
  },
  SOLR: {
    businessModel: "Generates utility-scale solar and clean energy secured by multi-decade power purchase agreements (PPAs) with tier-1 utilities.",
    catalysts: "Guaranteed contract cash flows, long-term regulatory clean energy credits, and burgeoning industrial base-load demand from data facilities.",
    riskExplanation: "Conservative Income Profile: Highly defensive with consistent dividend distributions, sensitive primarily to macro interest rate shifts."
  },
  PEAR: {
    businessModel: "Premier consumer technology ecosystem integrating proprietary hardware, custom silicon, and high-margin recurring digital services.",
    catalysts: "Massive global active device base, virtually frictionless ecosystem lock-in, and aggressive capital return through dividend growth and share repurchases.",
    riskExplanation: "Conservative Core Profile: Generates unmatched cash flow, but subject to consumer upgrade cycles and global supply chain concentration."
  },
  NEXS: {
    businessModel: "Global digital advertising distribution network, enterprise search infrastructure, and high-performance cloud server hosting.",
    catalysts: "Pervasive global reach with billions of daily active queries, strong enterprise cloud migrations, and generative AI search monetization.",
    riskExplanation: "Moderate Growth Profile: Dominant competitive moat with high operating margins, but navigates digital ad spending cycles and regulatory oversight."
  }
};

export const TEEN_GUIDES: Record<string, TeenGuide> = {
  NOVA: {
    analogy: "Think of NOVA as the foundational engine of the modern AI revolution. Leading technology companies and research labs require NOVA's specialized silicon to run generative AI and deep learning workloads.",
    riskExplanation: "⚡ High Growth / Volatile: Fast growth with massive potential, but chip demand moves in cycles. Recommended for long-term growth horizons."
  },
  VOLT: {
    analogy: "VOLT captures the transition from traditional combustion vehicles to smart electric mobility and grid-scale solar battery networks.",
    riskExplanation: "⚡ High Growth / Volatile: Building high-tech factories requires heavy capital. High upside as clean energy adoption expands worldwide."
  },
  BREW: {
    analogy: "BREW is a cash-generative consumer staples powerhouse. Thousands of customers purchase high-margin daily beverages every morning, delivering steady, compounding cash flow.",
    riskExplanation: "📈 Moderate Risk: Coffee has exceptionally steady demand year-round. Profit margins remain stable even during broader market slowdowns."
  },
  APEX: {
    analogy: "APEX is the digital backbone of consumer trade. Whether buying groceries or essentials, APEX captures revenue from online ordering, automated fulfillment, and delivery.",
    riskExplanation: "🛡️ Conservative / Defensive: E-commerce essentials provide recession-resistant revenue and steady fundamental growth."
  },
  SOLR: {
    analogy: "SOLR generates clean solar power for cities and industrial data hubs through long-term contracts, functioning as a defensive, dividend-yielding utility.",
    riskExplanation: "🛡️ Conservative / Defensive: Electricity is a non-negotiable everyday necessity, producing dependable income and capital preservation."
  },
  PEAR: {
    analogy: "PEAR combines premium consumer hardware with recurring subscription services (cloud, app ecosystem, media). High customer loyalty gives it exceptional pricing power.",
    riskExplanation: "🛡️ Conservative Core: Extremely strong balance sheet with massive cash reserves, making it a portfolio anchor."
  },
  NEXS: {
    analogy: "NEXS commands global digital discovery. Every web search and video view monetizes through targeted advertising, supplemented by enterprise cloud infrastructure.",
    riskExplanation: "📈 Moderate Risk: Unmatched digital network effects and market leadership with consistent double-digit operating margins."
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
    eps: 15.83, // EPS derived from base: 512.80 / 32.4
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
    eps: 13.93, // EPS derived from base: 345.50 / 24.8
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
    eps: 8.82, // EPS derived from base: 125.30 / 14.2
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
    eps: 9.70, // EPS derived from base: 185.20 / 19.1
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
    eps: 8.10, // EPS derived from base: 95.60 / 11.8
    history1D: [94.80, 95.00, 95.20, 95.10, 95.40, 95.60],
    history1W: [93.00, 93.80, 94.20, 94.00, 94.80, 95.20, 95.60],
    history1M: [88.00, 89.50, 90.00, 91.20, 92.50, 93.00, 93.80, 94.50, 95.00, 95.60],
  },
  PEAR: {
    ticker: 'PEAR',
    name: 'Pear Electronics',
    price: 220.40,
    change: 1.25,
    icon: 'DeviceMobile',
    color: '#94A3B8',
    sparkline: [7, 8, 8, 9, 10, 9, 11],
    riskProfile: 'Conservative',
    partner: 'Consumer Tech',
    description: 'Premium smartphones, wearables, and personal computing ecosystem.',
    marketCap: '₱2.5 Million',
    volume: '₱38,000',
    high52: 235.00,
    low52: 165.00,
    eps: 7.60, // P/E ~ 29.0
    history1D: [218.00, 219.50, 220.00, 219.80, 220.10, 220.40],
    history1W: [215.00, 216.50, 218.00, 219.00, 218.50, 220.00, 220.40],
    history1M: [200.00, 205.00, 208.50, 212.00, 210.00, 215.00, 218.00, 219.00, 220.00, 220.40],
  },
  NEXS: {
    ticker: 'NEXS',
    name: 'Nexus Web',
    price: 165.80,
    change: 0.95,
    icon: 'Globe',
    color: '#3B82F6',
    sparkline: [6, 7, 7, 8, 8, 9, 10],
    riskProfile: 'Moderate',
    partner: 'Internet Services',
    description: 'Global search engine dominance and digital advertising network.',
    marketCap: '₱1.9 Million',
    volume: '₱29,000',
    high52: 180.00,
    low52: 130.00,
    eps: 6.90, // P/E ~ 24.0
    history1D: [164.00, 164.50, 165.00, 164.80, 165.20, 165.80],
    history1W: [160.00, 162.50, 163.00, 164.00, 165.00, 164.50, 165.80],
    history1M: [150.00, 152.00, 155.50, 158.00, 159.00, 160.00, 162.00, 164.00, 165.00, 165.80],
  }
};

export const ASSETS_LIST: Asset[] = Object.values(ASSET_DATA);
