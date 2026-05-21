'use client'

import { useState, useEffect, useCallback } from 'react'
import { Portfolio, Trade, Position } from '@/types'
import { DEFAULT_PORTFOLIO } from '@/lib/constants'

const STORAGE_KEY = 'trackfolio_portfolio_v2'

function loadPortfolio(): Portfolio {
  if (typeof window === 'undefined') return DEFAULT_PORTFOLIO
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
    // Migration depuis v1
    const old = localStorage.getItem('trackfolio_portfolio')
    if (old) return JSON.parse(old)
    return DEFAULT_PORTFOLIO
  } catch {
    return DEFAULT_PORTFOLIO
  }
}

function savePortfolio(p: Portfolio) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio>(DEFAULT_PORTFOLIO)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setPortfolio(loadPortfolio())
    setMounted(true)
  }, [])

  const buyStock = useCallback((
    ticker: string, name: string, category: Position['category'],
    color: string, shares: number, price: number
  ) => {
    setPortfolio(prev => {
      const total = shares * price
      if (prev.cash < total) throw new Error('Fonds insuffisants')

      const positions = [...prev.positions]
      const idx = positions.findIndex(p => p.ticker === ticker)
      if (idx >= 0) {
        const ex = positions[idx]
        const totalShares = ex.shares + shares
        // PRU = prix de revient unitaire (moyenne pondérée)
        const avgPrice = (ex.shares * ex.avgPrice + shares * price) / totalShares
        positions[idx] = { ...ex, shares: parseFloat(totalShares.toFixed(8)), avgPrice: parseFloat(avgPrice.toFixed(4)) }
      } else {
        positions.push({ ticker, name, shares: parseFloat(shares.toFixed(8)), avgPrice: parseFloat(price.toFixed(4)), category, color })
      }

      const trade: Trade = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ticker, name, type: 'buy', shares, price,
        total: parseFloat(total.toFixed(2)),
        date: new Date().toISOString(),
      }

      const next: Portfolio = {
        positions,
        cash: parseFloat((prev.cash - total).toFixed(2)),
        trades: [trade, ...prev.trades].slice(0, 200),
      }
      savePortfolio(next)
      return next
    })
  }, [])

  const sellStock = useCallback((ticker: string, shares: number, price: number) => {
    setPortfolio(prev => {
      const positions = [...prev.positions]
      const idx = positions.findIndex(p => p.ticker === ticker)
      if (idx < 0) throw new Error('Position introuvable')
      const pos = positions[idx]
      if (pos.shares < shares - 0.000001) throw new Error(`Quantité insuffisante (${pos.shares} dispo)`)

      const total = shares * price
      const remaining = parseFloat((pos.shares - shares).toFixed(8))
      if (remaining < 0.000001) {
        positions.splice(idx, 1)
      } else {
        positions[idx] = { ...pos, shares: remaining }
      }

      const trade: Trade = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ticker, name: pos.name, type: 'sell', shares, price,
        total: parseFloat(total.toFixed(2)),
        date: new Date().toISOString(),
      }

      const next: Portfolio = {
        positions,
        cash: parseFloat((prev.cash + total).toFixed(2)),
        trades: [trade, ...prev.trades].slice(0, 200),
      }
      savePortfolio(next)
      return next
    })
  }, [])

  const resetPortfolio = useCallback(() => {
    savePortfolio(DEFAULT_PORTFOLIO)
    setPortfolio(DEFAULT_PORTFOLIO)
  }, [])

  const depositCash = useCallback((amount: number) => {
    setPortfolio(prev => {
      const next = { ...prev, cash: parseFloat((prev.cash + amount).toFixed(2)) }
      savePortfolio(next)
      return next
    })
  }, [])

  const getPosition = useCallback((ticker: string) =>
    portfolio.positions.find(p => p.ticker === ticker) ?? null,
  [portfolio.positions])

  const getPortfolioValue = useCallback((prices: Record<string, number>) => {
    const invested = portfolio.positions.reduce((sum, pos) => {
      return sum + pos.shares * (prices[pos.ticker] ?? pos.avgPrice)
    }, 0)
    return invested + portfolio.cash
  }, [portfolio])

  const getInvestedValue = useCallback(() =>
    portfolio.positions.reduce((sum, pos) => sum + pos.shares * pos.avgPrice, 0),
  [portfolio])

  const getTotalPnL = useCallback((prices: Record<string, number>) =>
    portfolio.positions.reduce((sum, pos) => {
      const current = prices[pos.ticker] ?? pos.avgPrice
      return sum + (current - pos.avgPrice) * pos.shares
    }, 0),
  [portfolio])

  const getPositionPnL = useCallback((ticker: string, currentPrice: number) => {
    const pos = portfolio.positions.find(p => p.ticker === ticker)
    if (!pos) return null
    const value = pos.shares * currentPrice
    const cost = pos.shares * pos.avgPrice
    const pnl = value - cost
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
    return { value, cost, pnl, pnlPct, shares: pos.shares, avgPrice: pos.avgPrice }
  }, [portfolio])

  return {
    portfolio, mounted,
    buyStock, sellStock,
    resetPortfolio, depositCash,
    getPosition, getPortfolioValue,
    getInvestedValue, getTotalPnL, getPositionPnL,
  }
}
