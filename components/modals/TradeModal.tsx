'use client'

import { useState, useCallback, useEffect } from 'react'
import { Stock } from '@/types'
import { usePortfolio } from '@/hooks/usePortfolio'
import LivePrice from '@/components/ui/LivePrice'

interface TradeModalProps {
  stock: Stock
  mode: 'buy' | 'sell'
  onClose: () => void
  onSuccess?: (type: 'buy' | 'sell', shares: number, price: number) => void
}

export default function TradeModal({ stock, mode, onClose, onSuccess }: TradeModalProps) {
  const { portfolio, buyStock, sellStock, getPosition, getPositionPnL } = usePortfolio()
  const [shares, setShares] = useState('')
  const [inputMode, setInputMode] = useState<'shares' | 'euros'>('shares')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const position = getPosition(stock.ticker)
  const pnlData = getPositionPnL(stock.ticker, stock.price)
  const sharesNum = parseFloat(shares) || 0
  const isCrypto = stock.category === 'crypto'
  const isEtf = stock.category === 'etf'

  // Si mode euros, calcule les parts
  const actualShares = inputMode === 'euros'
    ? parseFloat((sharesNum / stock.price).toFixed(isCrypto ? 6 : 4))
    : sharesNum

  const total = actualShares * stock.price
  const maxBuy = portfolio.cash / stock.price
  const maxSell = position?.shares ?? 0

  // Fermer avec Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const setPercent = (pct: number) => {
    if (inputMode === 'euros') {
      const euros = mode === 'buy' ? portfolio.cash * pct : (maxSell * stock.price) * pct
      setShares(euros.toFixed(2))
    } else {
      const s = mode === 'buy' ? maxBuy * pct : maxSell * pct
      setShares(isCrypto ? s.toFixed(6) : Math.floor(s).toString())
    }
  }

  const handleConfirm = useCallback(() => {
    setError('')
    if (!actualShares || actualShares <= 0) { setError('Entrez une quantité valide'); return }
    if (mode === 'buy' && total > portfolio.cash) {
      setError(`Fonds insuffisants — €${portfolio.cash.toFixed(2)} disponibles`)
      return
    }
    if (mode === 'sell' && actualShares > maxSell + 0.000001) {
      setError(`Quantité insuffisante — ${maxSell} ${stock.ticker} disponibles`)
      return
    }
    setConfirming(true)
  }, [actualShares, mode, total, portfolio.cash, maxSell, stock])

  const handleExecute = useCallback(() => {
    try {
      if (mode === 'buy') {
        buyStock(stock.ticker, stock.name, stock.category, stock.color, actualShares, stock.price)
      } else {
        sellStock(stock.ticker, actualShares, stock.price)
      }
      setSuccess(true)
      onSuccess?.(mode, actualShares, stock.price)
      setTimeout(onClose, 2000)
    } catch (e: any) {
      setConfirming(false)
      setError(e.message)
    }
  }, [actualShares, mode, stock, buyStock, sellStock, onSuccess, onClose])

  const fmt = (n: number, d = 2) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })

  const accentColor = mode === 'buy' ? '#00c87a' : '#ff3b5c'
  const accentBg = mode === 'buy' ? 'bg-[#00c87a]' : 'bg-[#ff3b5c]'
  const accentHover = mode === 'buy' ? 'hover:bg-[#00b36b]' : 'hover:bg-[#e0344f]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#161616] rounded-t-3xl border border-white/10 overflow-hidden">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15"/>
        </div>

        {/* ─── SUCCÈS ─── */}
        {success && (
          <div className="flex flex-col items-center py-10 px-6 gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: accentColor + '20', border: `1px solid ${accentColor}40` }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-xl mb-1">
                {mode === 'buy' ? 'Achat effectué !' : 'Vente effectuée !'}
              </p>
              <p className="text-[#888] text-sm">
                {fmt(actualShares, isCrypto ? 6 : 4)} {stock.ticker} · €{fmt(total)}
              </p>
              <p className="text-[#555] text-xs mt-1">
                au prix de ${fmt(stock.price)} / unité
              </p>
            </div>
          </div>
        )}

        {/* ─── CONFIRMATION ─── */}
        {!success && confirming && (
          <div className="px-5 pb-6">
            <div className="flex items-center justify-between mb-5 pt-2">
              <h2 className="text-white font-black text-lg">Confirmer</h2>
              <button onClick={() => setConfirming(false)} className="text-[#888] text-sm underline">Modifier</button>
            </div>

            <div className="bg-white/4 rounded-2xl divide-y divide-white/6 mb-5 overflow-hidden">
              {[
                { label: 'Opération', value: mode === 'buy' ? '🟢 Achat' : '🔴 Vente' },
                { label: 'Titre', value: `${stock.ticker} — ${stock.name}` },
                { label: 'Quantité', value: `${fmt(actualShares, isCrypto ? 6 : 4)} parts` },
                { label: 'Prix unitaire', value: `$${fmt(stock.price)}` },
                { label: 'Total', value: `€${fmt(total)}`, bold: true },
                {
                  label: mode === 'buy' ? 'Cash restant' : 'Cash après vente',
                  value: `€${fmt(mode === 'buy' ? portfolio.cash - total : portfolio.cash + total)}`
                },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center px-4 py-3">
                  <span className="text-[12px] text-[#666]">{row.label}</span>
                  <span className={`text-[13px] ${row.bold ? 'font-black text-white' : 'font-semibold text-white'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleExecute}
              className={`w-full py-4 rounded-2xl text-white font-black text-[15px] ${accentBg} ${accentHover} active:scale-[.97] transition-all`}
            >
              {mode === 'buy' ? `Confirmer l'achat` : `Confirmer la vente`}
            </button>
          </div>
        )}

        {/* ─── FORMULAIRE ─── */}
        {!success && !confirming && (
          <div className="px-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pt-1">
              <div>
                <h2 className="text-white font-black text-[18px]">
                  {mode === 'buy' ? 'Acheter' : 'Vendre'}
                  <span style={{ color: accentColor }}> {stock.ticker}</span>
                </h2>
                <p className="text-[#555] text-[12px]">{stock.name}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Prix live */}
            <div className="flex items-center justify-between bg-white/4 rounded-2xl px-4 py-3 mb-3">
              <div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Cours actuel</div>
                <LivePrice
                  price={stock.price}
                  className="text-[20px] font-black text-white"
                  showFlash
                />
              </div>
              <div className="text-right">
                <div className={`text-[13px] font-bold ${stock.changePct >= 0 ? 'text-[#00c87a]' : 'text-[#ff3b5c]'}`}>
                  {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                </div>
                <div className="text-[10px] text-[#555]">aujourd'hui</div>
              </div>
            </div>

            {/* Ma position actuelle (si vente) */}
            {mode === 'sell' && position && pnlData && (
              <div className="bg-white/4 rounded-2xl px-4 py-3 mb-3">
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Ma position</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[9px] text-[#444] mb-0.5">Qté</div>
                    <div className="text-[12px] font-bold text-white">
                      {position.shares < 1 ? position.shares.toFixed(5) : position.shares}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#444] mb-0.5">PRU</div>
                    <div className="text-[12px] font-bold text-white">${fmt(position.avgPrice)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#444] mb-0.5">+/- value</div>
                    <div className={`text-[12px] font-bold ${pnlData.pnl >= 0 ? 'text-[#00c87a]' : 'text-[#ff3b5c]'}`}>
                      {pnlData.pnl >= 0 ? '+' : ''}€{fmt(Math.abs(pnlData.pnl))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRU estimé (si achat) */}
            {mode === 'buy' && position && actualShares > 0 && (
              <div className="bg-[#5b8def]/8 border border-[#5b8def]/20 rounded-xl px-4 py-2.5 mb-3">
                <div className="text-[11px] text-[#5b8def] font-semibold">
                  Nouveau PRU estimé : ${fmt((position.shares * position.avgPrice + actualShares * stock.price) / (position.shares + actualShares))}
                  <span className="text-[#5b8def]/60 ml-1">(actuellement ${fmt(position.avgPrice)})</span>
                </div>
              </div>
            )}

            {/* Toggle mode saisie */}
            <div className="flex gap-1 mb-3 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => { setInputMode('shares'); setShares('') }}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${inputMode === 'shares' ? 'bg-white/10 text-white' : 'text-[#555]'}`}
              >
                En parts
              </button>
              <button
                onClick={() => { setInputMode('euros'); setShares('') }}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${inputMode === 'euros' ? 'bg-white/10 text-white' : 'text-[#555]'}`}
              >
                En euros
              </button>
            </div>

            {/* Input */}
            <div className="bg-white/5 rounded-2xl px-4 py-3 mb-3 border border-white/6 focus-within:border-white/15 transition-colors">
              <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">
                {inputMode === 'euros' ? 'Montant en euros' : isCrypto ? 'Quantité (crypto)' : 'Nombre de parts'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#555] text-lg font-bold">
                  {inputMode === 'euros' ? '€' : '#'}
                </span>
                <input
                  type="number"
                  value={shares}
                  onChange={e => setShares(e.target.value)}
                  placeholder={inputMode === 'euros' ? '100' : isCrypto ? '0.001' : '1'}
                  step={inputMode === 'euros' ? '10' : isCrypto ? '0.001' : '1'}
                  min="0"
                  className="flex-1 bg-transparent text-white text-[26px] font-black outline-none placeholder-white/15 w-0"
                  autoFocus
                />
                <span className="text-[#555] text-sm font-semibold">{stock.ticker}</span>
              </div>
              {actualShares > 0 && (
                <div className="mt-2 flex justify-between text-[11px]">
                  <span className="text-[#555]">
                    {inputMode === 'euros'
                      ? `≈ ${fmt(actualShares, isCrypto ? 6 : 4)} parts`
                      : `≈ €${fmt(total)}`}
                  </span>
                  <span className="text-[#555]">
                    {mode === 'buy'
                      ? `Reste €${fmt(portfolio.cash - total)}`
                      : `Reçoit €${fmt(total)}`}
                  </span>
                </div>
              )}
            </div>

            {/* Raccourcis % */}
            <div className="flex gap-1.5 mb-4">
              {([0.25, 0.5, 0.75, 1] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPercent(p)}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/8 text-[#666] text-[11px] font-bold hover:bg-white/10 hover:text-white active:scale-95 transition-all"
                >
                  {p === 1 ? 'Max' : `${p * 100}%`}
                </button>
              ))}
            </div>

            {/* Solde dispo */}
            <div className="flex justify-between text-[12px] mb-4 px-1">
              <span className="text-[#555]">
                {mode === 'buy' ? 'Cash disponible' : 'Position actuelle'}
              </span>
              <span className="text-white font-semibold">
                {mode === 'buy'
                  ? `€${fmt(portfolio.cash)}`
                  : `${maxSell < 1 ? maxSell.toFixed(6) : maxSell} ${stock.ticker}`}
              </span>
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-[#ff3b5c]/10 border border-[#ff3b5c]/20 rounded-xl px-4 py-2.5 mb-3 text-[#ff3b5c] text-[12px] font-medium">
                ⚠ {error}
              </div>
            )}

            {/* Bouton confirmer */}
            <button
              onClick={handleConfirm}
              disabled={!actualShares || actualShares <= 0}
              className={`w-full py-4 rounded-2xl text-white font-black text-[15px] transition-all active:scale-[.97]
                ${accentBg} ${accentHover}
                disabled:opacity-25 disabled:cursor-not-allowed disabled:scale-100`}
            >
              {mode === 'buy'
                ? actualShares > 0 ? `Acheter ${fmt(actualShares, isCrypto ? 4 : 0)} ${stock.ticker} · €${fmt(total)}` : 'Acheter'
                : actualShares > 0 ? `Vendre ${fmt(actualShares, isCrypto ? 4 : 0)} ${stock.ticker} · €${fmt(total)}` : 'Vendre'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
