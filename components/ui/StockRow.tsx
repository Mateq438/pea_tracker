'use client'

import Link from 'next/link'
import { Stock } from '@/types'
import LivePrice from './LivePrice'

interface StockRowProps {
  stock: Stock
}

function MiniSparkline({ up }: { up: boolean }) {
  const pts = up ? '2,20 12,16 22,12 32,13 42,8 52,6 62,4' : '2,4 12,6 22,10 32,8 42,14 52,16 62,20'
  const color = up ? '#00c87a' : '#ff3b5c'
  return (
    <svg width="62" height="24" viewBox="0 0 62 24" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
    </svg>
  )
}

export default function StockRow({ stock }: StockRowProps) {
  const isUp = stock.changePct >= 0

  return (
    <Link
      href={`/stock/${stock.ticker}`}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1a1a1a] hover:bg-[#222] active:scale-[.98] transition-all border border-transparent hover:border-white/8"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
        style={{ background: stock.color + '22', color: stock.color }}
      >
        {stock.ticker.slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-black text-white">{stock.ticker}</div>
        <div className="text-[10px] text-[#555] mt-0.5 truncate">{stock.name}</div>
      </div>

      <MiniSparkline up={isUp} />

      <div className="text-right flex-shrink-0">
        <LivePrice
          price={stock.price}
          className="text-[13px] font-bold text-white block"
          showFlash
        />
        <div
          className="text-[11px] font-bold mt-0.5"
          style={{ color: isUp ? '#00c87a' : '#ff3b5c' }}
        >
          {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
        </div>
      </div>
    </Link>
  )
}
