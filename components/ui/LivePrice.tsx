'use client'

import { useEffect, useRef, useState } from 'react'

interface LivePriceProps {
  price: number
  prevClose?: number
  decimals?: number
  prefix?: string
  className?: string
  showFlash?: boolean
}

export default function LivePrice({
  price, prevClose, decimals = 2, prefix = '$',
  className = '', showFlash = true,
}: LivePriceProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const prevRef = useRef(price)

  useEffect(() => {
    if (!showFlash || price === prevRef.current) return
    setFlash(price > prevRef.current ? 'up' : 'down')
    prevRef.current = price
    const t = setTimeout(() => setFlash(null), 600)
    return () => clearTimeout(t)
  }, [price, showFlash])

  const formatted = price >= 10000
    ? price.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
    : price.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  const flashColor = flash === 'up' ? '#00c87a' : flash === 'down' ? '#ff3b5c' : undefined

  return (
    <span
      className={`transition-colors duration-300 ${className}`}
      style={flashColor ? { color: flashColor } : undefined}
    >
      {prefix}{formatted}
    </span>
  )
}
