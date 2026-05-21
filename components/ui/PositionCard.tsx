'use client'

import Link from 'next/link'
import LivePrice from './LivePrice'
import { Stock } from '@/types'
import { Position } from '@/types'

interface PositionCardProps {
  position: Position
  stock?: Stock
  onTrade?: (ticker: string, mode: 'buy' | 'sell') => void
}

export default function PositionCard({ position, stock, onTrade }: PositionCardProps) {
  const price = stock?.price ?? position.avgPrice
  const value = position.shares * price
  const cost = position.shares * position.avgPrice
  const pnl = value - cost
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
  const isUp = pnl >= 0

  const fmt = (n: number, d = 2) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })

  const sharesDisplay = position.shares < 1
    ? position.shares.toFixed(6).replace(/0+$/, '')
    : position.shares % 1 === 0
      ? position.shares.toString()
      : position.shares.toFixed(4)

  return (
    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
      {/* Header position */}
      <Link href={`/stock/${position.ticker}`} className="flex items-center gap-3 px-4 pt-4 pb-3 hover:bg-white/3 transition-colors">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: position.color + '22', color: position.color }}
        >
          {position.ticker.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-black text-white">{position.ticker}</span>
            {stock && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                (stock.changePct ?? 0) >= 0
                  ? 'bg-[#00c87a]/10 text-[#00c87a]'
                  : 'bg-[#ff3b5c]/10 text-[#ff3b5c]'
              }`}>
                {(stock.changePct ?? 0) >= 0 ? '+' : ''}{(stock.changePct ?? 0).toFixed(2)}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#555] truncate">{position.name}</div>
        </div>
        <div className="text-right">
          <LivePrice
            price={price}
            className="text-[14px] font-bold text-white block"
            showFlash
          />
          <div className="text-[10px] text-[#555] mt-0.5">{sharesDisplay} parts</div>
        </div>
      </Link>

      {/* Grille PRU / Valeur / +/- */}
      <div className="grid grid-cols-3 gap-px bg-white/5 border-t border-white/5">
        <div className="bg-[#1a1a1a] px-3 py-2.5">
          <div className="text-[9px] text-[#555] uppercase tracking-wider mb-1">PRU</div>
          <div className="text-[12px] font-bold text-white">${fmt(position.avgPrice)}</div>
        </div>
        <div className="bg-[#1a1a1a] px-3 py-2.5">
          <div className="text-[9px] text-[#555] uppercase tracking-wider mb-1">Valeur</div>
          <div className="text-[12px] font-bold text-white">€{fmt(value)}</div>
        </div>
        <div className="bg-[#1a1a1a] px-3 py-2.5">
          <div className="text-[9px] text-[#555] uppercase tracking-wider mb-1">+/- value</div>
          <div className={`text-[12px] font-bold ${isUp ? 'text-[#00c87a]' : 'text-[#ff3b5c]'}`}>
            {isUp ? '+' : ''}€{fmt(Math.abs(pnl))}
          </div>
          <div className={`text-[9px] font-semibold ${isUp ? 'text-[#00c87a]' : 'text-[#ff3b5c]'}`}>
            ({isUp ? '+' : ''}{fmt(pnlPct)}%)
          </div>
        </div>
      </div>

      {/* Boutons Acheter/Vendre */}
      {onTrade && (
        <div className="flex gap-2 px-3 py-2.5 border-t border-white/5">
          <button
            onClick={() => onTrade(position.ticker, 'sell')}
            className="flex-1 py-2 rounded-xl bg-[#ff3b5c]/10 border border-[#ff3b5c]/20 text-[#ff3b5c] text-[12px] font-bold hover:bg-[#ff3b5c]/18 active:scale-95 transition-all"
          >
            Vendre
          </button>
          <button
            onClick={() => onTrade(position.ticker, 'buy')}
            className="flex-[2] py-2 rounded-xl bg-[#00c87a]/10 border border-[#00c87a]/20 text-[#00c87a] text-[12px] font-bold hover:bg-[#00c87a]/18 active:scale-95 transition-all"
          >
            Acheter plus
          </button>
        </div>
      )}
    </div>
  )
}
