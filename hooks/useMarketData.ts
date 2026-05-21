'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Stock } from '@/types'
import { STOCK_UNIVERSE, CRYPTO_IDS, CRYPTO_META } from '@/lib/constants'

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY || ''

// Fetch quote REST (fallback ou initial load)
async function fetchFinnhubQuote(ticker: string) {
  if (!FINNHUB_KEY) return null
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 0 } }
    )
    const d = await res.json()
    if (!d.c) return null
    return { price: d.c, prevClose: d.pc, high: d.h, low: d.l, open: d.o, volume: d.v }
  } catch { return null }
}

async function fetchCryptoPrice(tickers: string[]) {
  try {
    const ids = tickers.map(t => CRYPTO_IDS[t]).filter(Boolean).join(',')
    if (!ids) return {}
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_high_low=true`,
      { next: { revalidate: 0 } }
    )
    const d = await res.json()
    const result: Record<string, any> = {}
    tickers.forEach(ticker => {
      const id = CRYPTO_IDS[ticker]
      if (d[id]) {
        result[ticker] = {
          price: d[id].usd,
          prevClose: d[id].usd / (1 + d[id].usd_24h_change / 100),
          change: d[id].usd * d[id].usd_24h_change / 100,
          changePct: d[id].usd_24h_change,
          high: d[id].usd_24h_high ?? d[id].usd * 1.02,
          low: d[id].usd_24h_low ?? d[id].usd * 0.98,
          open: d[id].usd / (1 + d[id].usd_24h_change / 100),
          volume: d[id].usd_24h_vol ?? 0,
        }
      }
    })
    return result
  } catch { return {} }
}

// Génère un historique simulé cohérent avec le prix réel
export function generateHistory(basePrice: number, points: number, volatility = 0.015): number[] {
  const data: number[] = []
  let price = basePrice * (1 - (Math.random() * 0.08))
  for (let i = 0; i < points; i++) {
    const drift = (basePrice - price) * 0.05
    const noise = (Math.random() - 0.48) * price * volatility
    price = Math.max(price + drift + noise, price * 0.97)
    data.push(parseFloat(price.toFixed(2)))
  }
  data[data.length - 1] = basePrice
  return data
}

export function useMarketData(tickers?: string[]) {
  const [stocks, setStocks] = useState<Record<string, Stock>>({})
  const [loading, setLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const subscribedRef = useRef<Set<string>>(new Set())

  const allTickers = tickers ?? [
    ...STOCK_UNIVERSE.map(s => s.ticker),
    ...CRYPTO_META.map(s => s.ticker),
  ]

  const stockTickers = allTickers.filter(t => !CRYPTO_IDS[t])
  const cryptoTickers = allTickers.filter(t => !!CRYPTO_IDS[t])

  const buildStock = useCallback((meta: any, quote: any): Stock => ({
    ...meta,
    price: quote?.price ?? meta.high52 * 0.9,
    prevClose: quote?.prevClose ?? meta.high52 * 0.89,
    change: quote?.change ?? 0,
    changePct: quote?.changePct ?? 0,
    high: quote?.high ?? meta.high52 * 0.95,
    low: quote?.low ?? meta.low52 * 1.05,
    open: quote?.open ?? meta.high52 * 0.89,
    volume: quote?.volume ?? 0,
  }), [])

  // Initial load
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const initialStocks: Record<string, Stock> = {}

      // Stocks via Finnhub
      if (FINNHUB_KEY) {
        await Promise.all(
          stockTickers.map(async ticker => {
            const meta = STOCK_UNIVERSE.find(s => s.ticker === ticker)
            if (!meta) return
            const quote = await fetchFinnhubQuote(ticker)
            if (cancelled) return
            const change = quote ? quote.price - quote.prevClose : 0
            const changePct = quote ? (change / quote.prevClose) * 100 : 0
            initialStocks[ticker] = buildStock(meta, quote ? { ...quote, change, changePct } : null)
          })
        )
      } else {
        // Mode démo sans clé API
        stockTickers.forEach(ticker => {
          const meta = STOCK_UNIVERSE.find(s => s.ticker === ticker)
          if (!meta) return
          const price = meta.high52! * (0.85 + Math.random() * 0.12)
          const prevClose = price * (1 + (Math.random() - 0.5) * 0.03)
          const change = price - prevClose
          initialStocks[ticker] = buildStock(meta, {
            price, prevClose, change,
            changePct: (change / prevClose) * 100,
            high: price * 1.01, low: price * 0.99, open: prevClose, volume: 0,
          })
        })
      }

      // Crypto via CoinGecko
      const cryptoData = await fetchCryptoPrice(cryptoTickers)
      cryptoTickers.forEach(ticker => {
        const meta = CRYPTO_META.find(s => s.ticker === ticker)
        if (!meta || cancelled) return
        const d = cryptoData[ticker]
        if (d) {
          initialStocks[ticker] = {
            ...meta, high52: d.price * 1.3, low52: d.price * 0.6,
            ...d, marketCap: undefined, pe: undefined,
            about: meta.about,
          }
        } else {
          const price = ticker === 'BTC' ? 65000 : ticker === 'ETH' ? 3200 : 150
          initialStocks[ticker] = buildStock(meta, {
            price, prevClose: price * 0.98,
            change: price * 0.02, changePct: 2,
            high: price * 1.02, low: price * 0.97, open: price * 0.98, volume: 0,
          })
        }
      })

      if (!cancelled) {
        setStocks(initialStocks)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, []) // eslint-disable-line

  // WebSocket Finnhub pour updates en temps réel
  useEffect(() => {
    if (!FINNHUB_KEY || stockTickers.length === 0) return
    const connect = () => {
      const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`)
      wsRef.current = ws
      ws.onopen = () => {
        stockTickers.forEach(ticker => {
          if (!subscribedRef.current.has(ticker)) {
            ws.send(JSON.stringify({ type: 'subscribe', symbol: ticker }))
            subscribedRef.current.add(ticker)
          }
        })
      }
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type !== 'trade' || !msg.data?.length) return
          setStocks(prev => {
            const next = { ...prev }
            msg.data.forEach((trade: any) => {
              const ticker = trade.s
              if (next[ticker]) {
                const price = trade.p
                const prevClose = next[ticker].prevClose
                const change = price - prevClose
                next[ticker] = { ...next[ticker], price, change, changePct: (change / prevClose) * 100 }
              }
            })
            return next
          })
        } catch {}
      }
      ws.onerror = () => ws.close()
      ws.onclose = () => {
        subscribedRef.current.clear()
        setTimeout(connect, 5000)
      }
    }
    connect()
    return () => {
      wsRef.current?.close()
      subscribedRef.current.clear()
    }
  }, []) // eslint-disable-line

  // Polling CoinGecko toutes les 30s
  useEffect(() => {
    if (cryptoTickers.length === 0) return
    const poll = async () => {
      const data = await fetchCryptoPrice(cryptoTickers)
      setStocks(prev => {
        const next = { ...prev }
        cryptoTickers.forEach(ticker => {
          if (data[ticker] && next[ticker]) {
            next[ticker] = { ...next[ticker], ...data[ticker] }
          }
        })
        return next
      })
    }
    const id = setInterval(poll, 30000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line

  return { stocks, loading }
}

// Hook pour historique de prix (Finnhub candles ou simulé)
export function usePriceHistory(ticker: string, resolution: string = 'D') {
  const [history, setHistory] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const isCrypto = !!CRYPTO_IDS[ticker]

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)

      const points = resolution === '1' ? 60 : resolution === '5' ? 78 : resolution === '60' ? 90 : 90

      if (FINNHUB_KEY && !isCrypto) {
        try {
          const to = Math.floor(Date.now() / 1000)
          const days = resolution === '1' ? 1 : resolution === '5' ? 5 : resolution === '60' ? 30 : 365
          const from = to - days * 86400
          const res = await fetch(
            `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`
          )
          const d = await res.json()
          if (!cancelled && d.s === 'ok' && d.c?.length) {
            setHistory(d.c)
            setLoading(false)
            return
          }
        } catch {}
      }

      // Fallback simulé
      if (!cancelled) {
        const basePrice = ticker === 'BTC' ? 65000 : ticker === 'ETH' ? 3200 : 150
        setHistory(generateHistory(basePrice, points))
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [ticker, resolution])

  return { history, loading }
}
