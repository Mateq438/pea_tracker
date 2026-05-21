'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import PriceChart from '@/components/charts/PriceChart'
import StockRow from '@/components/ui/StockRow'
import BottomNav from '@/components/ui/BottomNav'
import { useMarketData, generateHistory } from '@/hooks/useMarketData'
import { usePortfolio } from '@/hooks/usePortfolio'

export default function DashboardPage() {
  const { stocks, loading } = useMarketData()
  const { portfolio, getPortfolioValue, getTotalPnL } = usePortfolio()
  const [heroHistory] = useState(() => generateHistory(18000, 30, 0.01))

  const prices = useMemo(() =>
    Object.fromEntries(Object.entries(stocks).map(([k, v]) => [k, v.price])),
    [stocks]
  )

  const totalValue = getPortfolioValue(prices)
  const totalPnL = getTotalPnL(prices)
  const pnlPct = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0
  const isUp = totalPnL >= 0

  const topMovers = useMemo(() =>
    Object.values(stocks)
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
      .slice(0, 5),
    [stocks]
  )

  const myStocks = useMemo(() =>
    portfolio.positions
      .map(pos => stocks[pos.ticker])
      .filter(Boolean),
    [portfolio.positions, stocks]
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/6 px-5 py-3 flex justify-between items-center">
        <span className="text-[17px] font-black text-white tracking-tight">
          Track<span className="text-[#00c87a]">folio</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#00c87a]/10 border border-[#00c87a]/25 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00c87a] animate-pulse"/>
            <span className="text-[10px] font-bold text-[#00c87a] tracking-wider">LIVE</span>
          </div>
          <Link href="/dashboard" className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </Link>
        </div>
      </header>

      {/* Hero Portfolio Card */}
      <div className="mx-4 mt-4 bg-[#1a1a1a] rounded-3xl p-5 border border-white/6">
        <p className="text-[11px] text-[#666] uppercase tracking-widest mb-2">Portefeuille total</p>
        {loading ? (
          <div className="h-10 w-40 bg-white/5 rounded-xl animate-pulse mb-4"/>
        ) : (
          <>
            <p className="text-[34px] font-black text-white tracking-tighter leading-none mb-2">
              €{totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                isUp
                  ? 'bg-[#00c87a]/10 text-[#00c87a] border-[#00c87a]/25'
                  : 'bg-[#ff3b5c]/10 text-[#ff3b5c] border-[#ff3b5c]/25'
              }`}>
                {isUp ? '+' : ''}€{Math.abs(totalPnL).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isUp ? '+' : ''}{pnlPct.toFixed(2)}%)
              </span>
              <span className="text-[12px] text-[#555]">total</span>
            </div>
          </>
        )}
        <PriceChart data={heroHistory} color="auto" height={72} fill showAxes={false} />
        <div className="flex justify-between mt-3 text-xs text-[#444]">
          <span>Cash : €{portfolio.cash.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span>{portfolio.positions.length} positions</span>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-4 gap-2 mx-4 mt-3">
        {[
          { label: 'Dépôt', icon: '↓', color: '#5b8def' },
          { label: 'Retrait', icon: '↑', color: '#5b8def' },
          { label: 'Acheter', icon: '+', color: '#00c87a', href: '/market' },
          { label: 'Analyse', icon: '◎', color: '#f0a500' },
        ].map(a => (
          <Link
            key={a.label}
            href={a.href ?? '#'}
            className="bg-[#1a1a1a] border border-white/6 rounded-2xl py-3 flex flex-col items-center gap-1.5 hover:bg-[#222] active:scale-95 transition-all"
          >
            <span className="text-lg font-bold" style={{ color: a.color }}>{a.icon}</span>
            <span className="text-[10px] text-[#666] font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Top mouvements */}
      <div className="mt-5 mx-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[15px] font-bold text-white">Top mouvements</h2>
          <Link href="/market" className="text-[13px] text-[#5b8def] font-semibold">Voir tout</Link>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {loading
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="min-w-[110px] h-28 bg-[#1a1a1a] rounded-2xl animate-pulse flex-shrink-0"/>
              ))
            : topMovers.map(s => {
                const isUp = s.changePct >= 0
                const c = isUp ? '#00c87a' : '#ff3b5c'
                return (
                  <Link
                    key={s.ticker}
                    href={`/stock/${s.ticker}`}
                    className="min-w-[110px] flex-shrink-0 bg-[#1a1a1a] border border-white/6 rounded-2xl p-3 hover:bg-[#222] active:scale-95 transition-all"
                  >
                    <div className="text-[12px] font-black text-white">{s.ticker}</div>
                    <div className="text-[10px] text-[#555] mb-2 truncate">{s.name.split(' ')[0]}</div>
                    <div className="text-[13px] font-bold" style={{ color: c }}>
                      ${s.price >= 1000 ? Math.round(s.price).toLocaleString('fr-FR') : s.price.toFixed(2)}
                    </div>
                    <div className="text-[11px] font-bold mt-0.5" style={{ color: c }}>
                      {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
                    </div>
                  </Link>
                )
              })}
        </div>
      </div>

      {/* Mes positions */}
      <div className="mt-5 mx-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[15px] font-bold text-white">Mes positions</h2>
          <Link href="/market" className="text-[13px] text-[#5b8def] font-semibold">Explorer</Link>
        </div>
        {loading
          ? Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-[#1a1a1a] rounded-2xl animate-pulse mb-2"/>
            ))
          : myStocks.length > 0
            ? <div className="flex flex-col gap-2">
                {myStocks.map(s => <StockRow key={s.ticker} stock={s} />)}
              </div>
            : <div className="text-center py-10 text-[#555]">
                <p className="text-sm">Aucune position</p>
                <Link href="/market" className="text-[#5b8def] text-sm mt-2 block">Commencer à investir →</Link>
              </div>
        }
      </div>
    </div>
  )
}
