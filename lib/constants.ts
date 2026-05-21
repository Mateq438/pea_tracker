import { Stock } from '@/types'

export const STOCK_UNIVERSE: Omit<Stock, 'price' | 'prevClose' | 'change' | 'changePct' | 'high' | 'low' | 'open' | 'volume'>[] = [
  {
    ticker: 'AAPL', name: 'Apple Inc.', marketCap: '$2,94T', pe: '28,4',
    high52: 199.62, low52: 124.17, category: 'actions', color: '#a3a3a3',
    about: 'Apple conçoit et vend des smartphones, ordinateurs, tablettes et services. L\'iPhone, Mac, iPad et Apple Watch forment son écosystème.',
  },
  {
    ticker: 'NVDA', name: 'NVIDIA Corp.', marketCap: '$2,15T', pe: '65,2',
    high52: 974.00, low52: 394.57, category: 'actions', color: '#76b900',
    about: 'NVIDIA est le leader mondial des GPU et de l\'accélération IA. Ses puces équipent les data centers, le gaming et l\'intelligence artificielle.',
  },
  {
    ticker: 'MSFT', name: 'Microsoft', marketCap: '$3,08T', pe: '36,1',
    high52: 468.35, low52: 309.45, category: 'actions', color: '#00a3ee',
    about: 'Microsoft développe Windows, Azure, Office 365 et Xbox. Leader du cloud et de la productivité d\'entreprise.',
  },
  {
    ticker: 'TSLA', name: 'Tesla Inc.', marketCap: '$521B', pe: '43,2',
    high52: 299.29, low52: 138.80, category: 'actions', color: '#e82127',
    about: 'Tesla conçoit des véhicules électriques, des systèmes de stockage d\'énergie et des solutions solaires.',
  },
  {
    ticker: 'AMZN', name: 'Amazon', marketCap: '$2,09T', pe: '52,8',
    high52: 224.00, low52: 151.61, category: 'actions', color: '#ff9900',
    about: 'Amazon domine le e-commerce mondial et le cloud avec AWS. Prime Video, Alexa et AWS complètent son empire.',
  },
  {
    ticker: 'META', name: 'Meta Platforms', marketCap: '$1,29T', pe: '26,3',
    high52: 587.45, low52: 274.38, category: 'actions', color: '#0081fb',
    about: 'Meta exploite Facebook, Instagram et WhatsApp. Investit massivement dans la réalité virtuelle avec ses casques Quest.',
  },
  {
    ticker: 'GOOGL', name: 'Alphabet Inc.', marketCap: '$2,17T', pe: '24,8',
    high52: 193.31, low52: 130.67, category: 'actions', color: '#4285f4',
    about: 'Alphabet est la maison mère de Google, YouTube, Android et Google Cloud. Pionnier de l\'IA avec DeepMind et Gemini.',
  },
  {
    ticker: 'IWDA', name: 'iShares Core MSCI World', marketCap: 'ETF', pe: 'N/A',
    high52: 103.10, low52: 82.34, category: 'etf', color: '#5b8def',
    about: 'ETF répliquant l\'indice MSCI World. Exposition aux grandes et moyennes capitalisations mondiales. TER 0,20%.',
  },
  {
    ticker: 'CSPX', name: 'iShares Core S&P 500', marketCap: 'ETF', pe: 'N/A',
    high52: 556.20, low52: 422.10, category: 'etf', color: '#f0a500',
    about: 'ETF répliquant le S&P 500. Exposition aux 500 plus grandes entreprises américaines. TER 0,07%.',
  },
]

export const CRYPTO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
}

export const CRYPTO_META = [
  { ticker: 'BTC', name: 'Bitcoin', color: '#f7931a', category: 'crypto' as const, about: 'Bitcoin est la première cryptomonnaie décentralisée, créée en 2009. Utilisée comme réserve de valeur numérique mondiale.' },
  { ticker: 'ETH', name: 'Ethereum', color: '#627eea', category: 'crypto' as const, about: 'Ethereum est une plateforme blockchain pour les smart contracts et applications décentralisées (dApps).' },
  { ticker: 'SOL', name: 'Solana', color: '#9945ff', category: 'crypto' as const, about: 'Solana est une blockchain haute performance avec des transactions ultra-rapides et des frais quasi nuls.' },
]

export const DEFAULT_PORTFOLIO = {
  cash: 5000,
  positions: [
    { ticker: 'AAPL', name: 'Apple Inc.', shares: 10, avgPrice: 175.20, category: 'actions' as const, color: '#a3a3a3' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', shares: 3, avgPrice: 820.00, category: 'actions' as const, color: '#76b900' },
    { ticker: 'IWDA', name: 'iShares Core MSCI World', shares: 25, avgPrice: 90.50, category: 'etf' as const, color: '#5b8def' },
    { ticker: 'BTC', name: 'Bitcoin', shares: 0.05, avgPrice: 58000, category: 'crypto' as const, color: '#f7931a' },
    { ticker: 'ETH', name: 'Ethereum', shares: 0.8, avgPrice: 2900, category: 'crypto' as const, color: '#627eea' },
  ],
  trades: [] as import('@/types').Trade[],
}
