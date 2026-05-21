'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LivePrice from '@/components/ui/LivePrice'
import PriceChart from '@/components/charts/PriceChart'
import TradeModal from '@/components/modals/TradeModal'
import BottomNav from '@/components/ui/BottomNav'
import { useMarketData, usePriceHistory } from '@/hooks/useMarketData'
import { usePortfolio } from '@/hooks/usePortfolio'

const TIMEFRAMES = [
  { label: '1J', resolution: '1', days: 1 },
  { label: '1S', resolution: '5', days: 5 },
  { label: '1M', resolution: '60', days: 30 },
  { label: '3M', resolution: 'D', days: 90 },
  { label: '1A', resolution: 'D', days: 365 },
  { label: 'Max', resolution: 'W', days: 1825 },
]

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const router = useRouter()
  const { stocks, loading: stockLoading } = useMarketData([ticker])
  const { getPosition } = usePortfolio()
  const [tf, setTf] = useState(0)
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell' | null>(null)
  const [faved, setFaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { history, loading: histLoading } = usePriceHistory(ticker, TIMEFRAMES[tf].resolution)
  const stock = stocks[ticker]
  const position = getPosition(ticker)

  const positionValue = useMemo(() => {
    if (!position || !stock) return null
    const value = position.shares * stock.price
    const cost = position.shares * position.avgPrice
    const pnl = value - cost
    const pnlPct = (pnl / cost) * 100
    return { value, cost, pnl, pnlPct }
  }, [position, stock])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  if (!stockLoading && !stock) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4">
        <p className="text-[#666]">Action introuvable : {ticker}</p>
        <button onClick={() => router.back()} className="text-[#5b8def] text-sm">← Retour</button>
      </div>
    )
  }

  const isUp = stock ? stock.changePct >= 0 : true
  const changeColor = isUp ? '#00c87a' : '#ff3b5c'

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-32">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1e1e1e] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/6 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="flex-1">
          {stock ? (
            <>
              <p className="text-[15px] font-black text-white leading-tight">{stock.ticker}</p>
              <p className="text-[11px] text-[#666]">{stock.name}</p>
            </>
          ) : (
            <div className="h-8 w-28 bg-white/5 rounded-lg animate-pulse"/>
          )}
        </div>
        <button
          onClick={() => setFaved(f => !f)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${faved ? 'bg-[#f0a500]/15' : 'bg-white/8'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={faved ? '#f0a500' : 'none'} stroke={faved ? '#f0a500' : '#888'} strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </header>

      {/* Prix */}
      <div className="px-5 pt-5 pb-3">
        {stock ? (
          <>
            <p className="text-[36px] font-black text-white tracking-tighter leading-none mb-2" style={{ color: changeColor }}>
              ${stock.price >= 1000
                ? stock.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : stock.price.toFixed(2)}
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold border ${
                isUp
                  ? 'bg-[#00c87a]/10 text-[#00c87a] border-[#00c87a]/25'
                  : 'bg-[#ff3b5c]/10 text-[#ff3b5c] border-[#ff3b5c]/25'
              }`}>
                {isUp ? '+' : ''}${Math.abs(stock.change).toFixed(2)} · {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
              </span>
              <span className="text-[12px] text-[#555]">aujourd'hui</span>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="h-10 w-36 bg-white/5 rounded-xl animate-pulse"/>
            <div className="h-6 w-28 bg-white/5 rounded-full animate-pulse"/>
          </div>
        )}
      </div>

      {/* Timeframes */}
      <div className="flex gap-1 px-4 mb-2">
        {TIMEFRAMES.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setTf(i)}
            className={`flex-1 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
              tf === i
                ? 'bg-white/10 text-white border-white/15'
                : 'text-[#555] border-transparent hover:text-[#888]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Graphique */}
      <div className="px-4">
        {histLoading || history.length === 0 ? (
          <div className="h-[180px] bg-white/3 rounded-2xl animate-pulse"/>
        ) : (
          <PriceChart
            data={history}
            color="auto"
            height={180}
            fill
            showAxes
            label={ticker}
          />
        )}
      </div>

      {/* Ma position */}
      {position && positionValue && (
        <div className="mx-4 mt-4 bg-[#1a1a1a] border border-white/6 rounded-2xl p-4">
          <p className="text-[11px] text-[#666] uppercase tracking-wider mb-3">Ma position</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-[#555] mb-1">Quantité</p>
              <p className="text-[13px] font-bold text-white">{position.shares} {ticker}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#555] mb-1">Valeur</p>
              <p className="text-[13px] font-bold text-white">
                €{positionValue.value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#555] mb-1">+/- value</p>
              <p className={`text-[13px] font-bold ${positionValue.pnl >= 0 ? 'text-[#00c87a]' : 'text-[#ff3b5c]'}`}>
                {positionValue.pnl >= 0 ? '+' : ''}€{positionValue.pnl.toFixed(2)} ({positionValue.pnl >= 0 ? '+' : ''}{positionValue.pnlPct.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      {stock && (
        <div className="grid grid-cols-2 gap-2 mx-4 mt-4">
          {[
            { label: 'Ouverture', value: `$${stock.open.toFixed(2)}` },
            { label: 'Clôture préc.', value: `$${stock.prevClose.toFixed(2)}` },
            { label: 'Plus haut (j.)', value: `$${stock.high.toFixed(2)}` },
            { label: 'Plus bas (j.)', value: `$${stock.low.toFixed(2)}` },
            { label: 'Plus haut 52S', value: stock.high52 ? `$${stock.high52.toLocaleString('fr-FR')}` : 'N/A' },
            { label: 'Plus bas 52S', value: stock.low52 ? `$${stock.low52.toLocaleString('fr-FR')}` : 'N/A' },
            { label: 'Capitalisation', value: stock.marketCap ?? 'N/A' },
            { label: 'P/E Ratio', value: stock.pe ?? 'N/A' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-3">
              <p className="text-[10px] text-[#555] mb-1.5 font-medium">{stat.label}</p>
              <p className="text-[14px] font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* À propos */}
      {stock?.about && (
        <div className="mx-4 mt-3 bg-[#1a1a1a] border border-white/6 rounded-2xl p-4">
          <p className="text-[11px] text-[#666] uppercase tracking-wider mb-2">À propos</p>
          <p className="text-[13px] text-[#888] leading-relaxed">{stock.about}</p>
        </div>
      )}

      {/* Barre Acheter / Vendre */}
      {stock && (
        <div className="fixed bottom-[70px] left-0 right-0 z-30 px-4 py-3 bg-[#0f0f0f]/95 backdrop-blur border-t border-white/6">
          <div className="max-w-md mx-auto flex gap-3">
            <button
              onClick={() => setTradeMode('sell')}
              disabled={!position}
              className="flex-1 py-4 rounded-2xl bg-[#1e1e1e] border border-white/10 text-white font-bold text-[15px] disabled:opacity-30 hover:bg-[#252525] active:scale-[.97] transition-all"
            >
              Vendre
            </button>
            <button
              onClick={() => setTradeMode('buy')}
              className="flex-[2] py-4 rounded-2xl bg-[#00c87a] text-white font-bold text-[15px] hover:bg-[#00b36b] active:scale-[.97] transition-all"
            >
              Acheter
            </button>
          </div>
        </div>
      )}

      <BottomNav />

      {/* Trade Modal */}
      {tradeMode && stock && (
        <TradeModal
          stock={stock}
          mode={tradeMode}
          onClose={() => setTradeMode(null)}
          onSuccess={(type, shares, price) => {
            const total = (shares * price).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            showToast(type === 'buy'
              ? `✓ Achat de ${shares} ${ticker} pour $${total}`
              : `✓ Vente de ${shares} ${ticker} pour $${total}`)
          }}
        />
      )}
    </div>
  )
}
