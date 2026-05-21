'use client'

import { useState, useMemo } from 'react'
import PositionCard from '@/components/ui/PositionCard'
import TradeModal from '@/components/modals/TradeModal'
import BottomNav from '@/components/ui/BottomNav'
import { useMarketData } from '@/hooks/useMarketData'
import { usePortfolio } from '@/hooks/usePortfolio'
import { Stock } from '@/types'

type Tab = 'positions' | 'history' | 'alloc'

export default function PortfolioPage() {
  const { stocks, loading } = useMarketData()
  const { portfolio, getPortfolioValue, getInvestedValue, getTotalPnL, depositCash } = usePortfolio()
  const [tab, setTab] = useState<Tab>('positions')
  const [tradeModal, setTradeModal] = useState<{ ticker: string; mode: 'buy' | 'sell' } | null>(null)
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmt, setDepositAmt] = useState('')

  const prices = useMemo(() =>
    Object.fromEntries(Object.entries(stocks).map(([k, v]) => [k, v.price])),
    [stocks]
  )

  const totalValue = getPortfolioValue(prices)
  const investedValue = getInvestedValue()
  const totalPnL = getTotalPnL(prices)
  const totalPnLPct = investedValue > 0 ? (totalPnL / investedValue) * 100 : 0
  const isUp = totalPnL >= 0

  const fmt = (n: number, d = 2) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })

  // Allocation par catégorie
  const allocation = useMemo(() => {
    const cats: Record<string, { value: number; color: string; label: string }> = {
      actions: { value: 0, color: '#5b8def', label: 'Actions' },
      etf: { value: 0, color: '#f0a500', label: 'ETF' },
      crypto: { value: 0, color: '#f7931a', label: 'Crypto' },
      matieres: { value: 0, color: '#9945ff', label: 'Matières' },
      cash: { value: portfolio.cash, color: '#555', label: 'Cash' },
    }
    portfolio.positions.forEach(pos => {
      const price = prices[pos.ticker] ?? pos.avgPrice
      cats[pos.category].value += pos.shares * price
    })
    const total = Object.values(cats).reduce((s, c) => s + c.value, 0) || 1
    return Object.entries(cats)
      .filter(([, c]) => c.value > 0)
      .map(([key, c]) => ({ ...c, key, pct: (c.value / total) * 100 }))
  }, [portfolio, prices])

  const activeStock = tradeModal ? stocks[tradeModal.ticker] : null

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/6 px-5 py-3 flex justify-between items-center">
        <span className="text-[17px] font-black text-white tracking-tight">
          Track<span className="text-[#00c87a]">folio</span>
        </span>
        <button
          onClick={() => setShowDeposit(true)}
          className="flex items-center gap-1.5 bg-[#5b8def]/12 border border-[#5b8def]/25 rounded-full px-3 py-1.5"
        >
          <span className="text-[11px] font-bold text-[#5b8def]">+ Dépôt</span>
        </button>
      </header>

      {/* Hero résumé */}
      <div className="mx-4 mt-4 bg-[#1a1a1a] rounded-3xl p-5 border border-white/6">
        <p className="text-[10px] text-[#555] uppercase tracking-widest mb-1">Valeur totale</p>
        <p className="text-[34px] font-black text-white tracking-tighter leading-none mb-2">
          €{fmt(totalValue)}
        </p>

        {/* PnL global */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold border ${
            isUp
              ? 'bg-[#00c87a]/10 text-[#00c87a] border-[#00c87a]/25'
              : 'bg-[#ff3b5c]/10 text-[#ff3b5c] border-[#ff3b5c]/25'
          }`}>
            {isUp ? '+' : ''}€{fmt(Math.abs(totalPnL))} ({isUp ? '+' : ''}{fmt(totalPnLPct)}%)
          </span>
          <span className="text-[11px] text-[#444]">sur investissement</span>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
          <div className="bg-[#1a1a1a] p-3">
            <div className="text-[9px] text-[#555] uppercase tracking-wider mb-1">Investi</div>
            <div className="text-[13px] font-bold text-white">€{fmt(investedValue)}</div>
          </div>
          <div className="bg-[#1a1a1a] p-3">
            <div className="text-[9px] text-[#555] uppercase tracking-wider mb-1">Cash</div>
            <div className="text-[13px] font-bold text-white">€{fmt(portfolio.cash)}</div>
          </div>
          <div className="bg-[#1a1a1a] p-3">
            <div className="text-[9px] text-[#555] uppercase tracking-wider mb-1">Positions</div>
            <div className="text-[13px] font-bold text-white">{portfolio.positions.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mt-3 bg-white/4 rounded-2xl p-1">
        {([['positions', 'Positions'], ['alloc', 'Allocation'], ['history', 'Historique']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all ${
              tab === key ? 'bg-[#1e1e1e] text-white shadow' : 'text-[#555]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── POSITIONS ─── */}
      {tab === 'positions' && (
        <div className="px-4 mt-3 flex flex-col gap-3">
          {loading
            ? Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-[#1a1a1a] rounded-2xl animate-pulse skeleton"/>
              ))
            : portfolio.positions.length === 0
              ? (
                <div className="text-center py-16 text-[#555]">
                  <svg className="mx-auto mb-3 opacity-20" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                  </svg>
                  <p className="text-sm font-semibold">Aucune position</p>
                  <p className="text-xs mt-1">Commencez à investir depuis le marché</p>
                </div>
              )
              : portfolio.positions.map(pos => (
                  <PositionCard
                    key={pos.ticker}
                    position={pos}
                    stock={stocks[pos.ticker]}
                    onTrade={(ticker, mode) => setTradeModal({ ticker, mode })}
                  />
                ))
          }
        </div>
      )}

      {/* ─── ALLOCATION ─── */}
      {tab === 'alloc' && (
        <div className="px-4 mt-3">
          {/* Barre d'allocation */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/6 mb-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-3">Répartition du portefeuille</p>
            <div className="flex h-4 rounded-full overflow-hidden gap-px mb-4">
              {allocation.map(a => (
                <div
                  key={a.key}
                  style={{ width: `${a.pct}%`, background: a.color }}
                  title={`${a.label} ${a.pct.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              {allocation.map(a => (
                <div key={a.key} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }}/>
                  <span className="text-[12px] text-white flex-1 font-semibold">{a.label}</span>
                  <span className="text-[12px] text-[#666]">€{fmt(a.value)}</span>
                  <span className="text-[12px] font-bold text-white w-12 text-right">{a.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Détail par position */}
          <div className="flex flex-col gap-2">
            {portfolio.positions.map(pos => {
              const price = prices[pos.ticker] ?? pos.avgPrice
              const value = pos.shares * price
              const pct = totalValue > 0 ? (value / totalValue) * 100 : 0
              const pnl = (price - pos.avgPrice) * pos.shares
              const isP = pnl >= 0
              return (
                <div key={pos.ticker} className="bg-[#1a1a1a] border border-white/6 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                    style={{ background: pos.color + '22', color: pos.color }}
                  >
                    {pos.ticker.slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[13px] font-black text-white">{pos.ticker}</span>
                      <span className="text-[13px] font-bold text-white">€{fmt(value)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pos.color }}/>
                      </div>
                      <span className="text-[10px] text-[#555] w-8 text-right">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[10px] text-[#555]">PRU ${fmt(pos.avgPrice)}</span>
                      <span className={`text-[10px] font-semibold ${isP ? 'text-[#00c87a]' : 'text-[#ff3b5c]'}`}>
                        {isP ? '+' : ''}€{fmt(pnl)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── HISTORIQUE ─── */}
      {tab === 'history' && (
        <div className="px-4 mt-3">
          {portfolio.trades.length === 0 ? (
            <div className="text-center py-16 text-[#555]">
              <p className="text-sm font-semibold">Aucune transaction</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {portfolio.trades.map(trade => {
                const isBuy = trade.type === 'buy'
                const date = new Date(trade.date)
                const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={trade.id} className="bg-[#1a1a1a] border border-white/6 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isBuy ? 'bg-[#00c87a]/12' : 'bg-[#ff3b5c]/12'
                    }`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke={isBuy ? '#00c87a' : '#ff3b5c'} strokeWidth="2.5" strokeLinecap="round">
                        {isBuy
                          ? <><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></>
                          : <><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></>
                        }
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-[13px] font-black text-white">
                          {isBuy ? 'Achat' : 'Vente'} {trade.ticker}
                        </span>
                        <span className={`text-[13px] font-bold ${isBuy ? 'text-[#ff3b5c]' : 'text-[#00c87a]'}`}>
                          {isBuy ? '-' : '+'}€{fmt(trade.total)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[11px] text-[#555]">
                          {fmt(trade.shares, trade.shares < 1 ? 6 : 2)} parts · ${fmt(trade.price)}
                        </span>
                        <span className="text-[10px] text-[#444]">{dateStr} {timeStr}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal dépôt */}
      {showDeposit && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={e => e.target === e.currentTarget && setShowDeposit(false)}
        >
          <div className="w-full max-w-md bg-[#161616] rounded-t-3xl p-6 border border-white/10">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-white/15"/>
            </div>
            <h2 className="text-white font-black text-lg mb-5">Déposer des fonds</h2>
            <div className="flex gap-2 mb-4">
              {[100, 500, 1000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setDepositAmt(amt.toString())}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${
                    depositAmt === amt.toString()
                      ? 'bg-[#5b8def]/15 text-[#5b8def] border-[#5b8def]/30'
                      : 'bg-white/5 text-[#666] border-white/8'
                  }`}
                >
                  €{amt}
                </button>
              ))}
            </div>
            <div className="bg-white/5 rounded-2xl px-4 py-3 mb-4 border border-white/8 focus-within:border-white/15 transition-colors">
              <div className="text-[10px] text-[#555] mb-1">Montant personnalisé</div>
              <div className="flex items-center gap-2">
                <span className="text-[#555] font-bold">€</span>
                <input
                  type="number"
                  value={depositAmt}
                  onChange={e => setDepositAmt(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-white text-[24px] font-black outline-none placeholder-white/15 w-0"
                />
              </div>
            </div>
            <button
              onClick={() => {
                const amt = parseFloat(depositAmt)
                if (amt > 0) { depositCash(amt); setShowDeposit(false); setDepositAmt('') }
              }}
              disabled={!parseFloat(depositAmt)}
              className="w-full py-4 rounded-2xl bg-[#5b8def] text-white font-black text-[15px] hover:bg-[#4a7de0] disabled:opacity-25 active:scale-[.97] transition-all"
            >
              {parseFloat(depositAmt) > 0 ? `Déposer €${parseFloat(depositAmt).toLocaleString('fr-FR')}` : 'Déposer'}
            </button>
          </div>
        </div>
      )}

      {/* Trade Modal */}
      {tradeModal && activeStock && (
        <TradeModal
          stock={activeStock}
          mode={tradeModal.mode}
          onClose={() => setTradeModal(null)}
        />
      )}

      <BottomNav />
    </div>
  )
}
