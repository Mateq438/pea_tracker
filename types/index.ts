export interface Stock {
  ticker: string
  name: string
  price: number
  prevClose: number
  change: number
  changePct: number
  high: number
  low: number
  open: number
  volume: number
  marketCap?: string
  pe?: string
  high52?: number
  low52?: number
  about?: string
  category: 'actions' | 'etf' | 'crypto' | 'matieres'
  color: string
}

export interface Position {
  ticker: string
  name: string
  shares: number
  avgPrice: number
  category: Stock['category']
  color: string
}

export interface Trade {
  id: string
  ticker: string
  name: string
  type: 'buy' | 'sell'
  shares: number
  price: number
  total: number
  date: string
}

export interface Portfolio {
  positions: Position[]
  cash: number
  trades: Trade[]
}

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
}
