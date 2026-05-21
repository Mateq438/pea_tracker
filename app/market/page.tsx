'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import StockRow from '@/components/ui/StockRow'
import BottomNav from '@/components/ui/BottomNav'
import { useMarketData } from '@/hooks/useMarketData'

const CATEGORIES = [
  { key: 'all', label: 'Tout' },
  { key: 'actions', label: 'Actions' },
  { key: 'etf', label: 'ETF' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'matieres', label: 'Matières' },
]

const INDICES = [
  { label: 'S&P 500', value: '5 304', pct: '+0,42', up: true },
  { label: 'CAC 40', value: '8 012', pct: '-0,31', up: false },
  { label: 'NASDAQ', value: '16 881', pct: '+1,14', up: true },
  { label: 'DAX', value: '18 492', pct: '+0,28', up: true },
]

export default function MarketPage() {
  const { stocks, loading } = useMarketData()
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState<'pct' | 'price' | 'name'>('pct')

  const filtered = useMemo(() => {
    let list = Object.values(stocks)
    if (cat !== 'all') list = list.filter(s => s.category === cat)
    if (sort === 'pct') list = list.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    if (sort === 'price') list = list.sort((a, b) => b.price - a.price)
    if (sort === 'name') list = list.sort((a, b) => a.ticker.localeCompare(b.ticker))
    return list
  }, [stocks, cat, sort])

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/6 px-5 py-3 flex justify-between items-center">
        <span className="text-[17px] font-black text-white tracking-tight">
          Track<span className="text-[#00c87a]">folio</span>
        </span>
        <div className="flex items-center gap-1.5 bg-[#00c87a]/10 border border-[#00c87a]/25 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00c87a] animate-pulse"/>
          <span className="text-[10px] font-bold text-[#00c87a] tracking-wider">LIVE</span>
        </div>
      </header>

      {/* Indices */}
      <div className="grid grid-cols-2 gap-2 mx-4 mt-4">
        {INDICES.map(idx => (
          <div key={idx.label} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-3">
            <p className="text-[10px] text-[#666] font-semibold uppercase tracking-wider mb-1">{idx.label}</p>
            <p className="text-[16px] font-black text-white">{idx.value}</p>
            <span className={`text-[11px] font-bold ${idx.up ? 'text-[#00c87a]' : 'text-[#ff3b5c]'}`}>
              {idx.up ? '+' : ''}{idx.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Catégories */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto scrollbar-none pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
              cat === c.key
                ? 'bg-[#5b8def]/15 text-[#5b8def] border-[#5b8def]/30'
                : 'text-[#666] border-white/8 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Tri */}
      <div className="flex gap-2 px-4 mt-2 mb-3">
        <span className="text-[11px] text-[#555] self-center mr-1">Trier :</span>
        {([['pct', 'Performance'], ['price', 'Prix'], ['name', 'Nom']] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              sort === k ? 'bg-white/10 text-white border-white/15' : 'text-[#555] border-white/6'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="px-4 flex flex-col gap-2">
        {loading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-[#1a1a1a] rounded-2xl animate-pulse"/>
            ))
          : filtered.map(s => <StockRow key={s.ticker} stock={s} />)
        }
      </div>

      <BottomNav />
    </div>
  )
}
