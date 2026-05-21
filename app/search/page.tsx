'use client'

import { useState, useMemo } from 'react'
import StockRow from '@/components/ui/StockRow'
import BottomNav from '@/components/ui/BottomNav'
import { useMarketData } from '@/hooks/useMarketData'

const TRENDING = [
  { label: 'NVDA 🔥', q: 'NVDA' },
  { label: 'BTC 🔥', q: 'BTC' },
  { label: 'AAPL', q: 'AAPL' },
  { label: 'TSLA', q: 'TSLA' },
  { label: 'ETF', q: 'etf' },
  { label: 'META', q: 'META' },
  { label: 'ETH', q: 'ETH' },
  { label: 'Crypto', q: 'crypto' },
]

export default function SearchPage() {
  const { stocks, loading } = useMarketData()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return Object.values(stocks).slice(0, 8)
    return Object.values(stocks).filter(s =>
      s.ticker.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    )
  }, [stocks, query])

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/6 px-5 py-3">
        <span className="text-[17px] font-black text-white tracking-tight">
          Track<span className="text-[#00c87a]">folio</span>
        </span>
      </header>

      {/* Barre de recherche */}
      <div className="mx-4 mt-4 relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Action, ETF, crypto…"
          className="w-full bg-[#1a1a1a] border border-white/8 rounded-2xl py-3.5 pl-11 pr-4 text-[14px] text-white placeholder-[#444] outline-none focus:border-[#5b8def]/50 transition-colors"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Tendances */}
      {!query && (
        <>
          <div className="px-5 mt-4 mb-3">
            <h2 className="text-[14px] font-bold text-white">Tendances</h2>
          </div>
          <div className="flex flex-wrap gap-2 px-4 mb-4">
            {TRENDING.map(t => (
              <button
                key={t.q}
                onClick={() => setQuery(t.q)}
                className="px-3.5 py-1.5 bg-[#1a1a1a] border border-white/8 rounded-full text-[12px] text-[#888] font-semibold hover:text-white hover:border-white/16 transition-all"
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Résultats */}
      <div className="px-5 mb-3">
        <h2 className="text-[14px] font-bold text-white">
          {query ? `Résultats pour "${query}"` : 'Suggestions'}
        </h2>
      </div>

      <div className="px-4 flex flex-col gap-2">
        {loading
          ? Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-[#1a1a1a] rounded-2xl animate-pulse"/>
            ))
          : results.length > 0
            ? results.map(s => <StockRow key={s.ticker} stock={s} />)
            : (
              <div className="text-center py-12 text-[#555]">
                <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p className="text-sm">Aucun résultat pour « {query} »</p>
              </div>
            )
        }
      </div>

      <BottomNav />
    </div>
  )
}
