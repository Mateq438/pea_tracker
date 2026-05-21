'use client'

import { useState } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import BottomNav from '@/components/ui/BottomNav'

export default function ProfilePage() {
  const { portfolio, resetPortfolio } = usePortfolio()
  const [confirmReset, setConfirmReset] = useState(false)
  const [finnhubKey, setFinnhubKey] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('trackfolio_finnhub_key') ?? '' : ''
  )
  const [keySaved, setKeySaved] = useState(false)

  const totalPositions = portfolio.positions.length
  const totalTrades = portfolio.trades.length

  const saveKey = () => {
    localStorage.setItem('trackfolio_finnhub_key', finnhubKey)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/6 px-5 py-3">
        <span className="text-[17px] font-black text-white tracking-tight">
          Track<span className="text-[#00c87a]">folio</span>
        </span>
      </header>

      {/* Avatar */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <div className="w-20 h-20 rounded-full bg-[#00c87a]/15 border-2 border-[#00c87a]/30 flex items-center justify-center mb-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00c87a" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <p className="text-[18px] font-black text-white">Mon compte</p>
        <p className="text-[12px] text-[#555] mt-1">Trackfolio Paper Trading</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-2 mx-4 mb-6">
        {[
          { label: 'Cash', value: `€${portfolio.cash.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Positions', value: totalPositions.toString() },
          { label: 'Trades', value: totalTrades.toString() },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-3 text-center">
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-[14px] font-black text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Section API */}
      <div className="mx-4 mb-4">
        <p className="text-[11px] text-[#555] uppercase tracking-wider mb-2 px-1">API Données</p>
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-4 py-4">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[13px] font-bold text-white">Clé Finnhub</p>
              <a
                href="https://finnhub.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#5b8def] font-semibold"
              >
                Obtenir gratuitement ↗
              </a>
            </div>
            <p className="text-[11px] text-[#555] mb-3">Cours boursiers en temps réel via WebSocket</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={finnhubKey}
                onChange={e => setFinnhubKey(e.target.value)}
                placeholder="Votre clé API…"
                className="flex-1 bg-[#111] border border-white/8 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#5b8def]/50 transition-colors"
              />
              <button
                onClick={saveKey}
                className={`px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                  keySaved
                    ? 'bg-[#00c87a]/15 text-[#00c87a] border border-[#00c87a]/25'
                    : 'bg-[#5b8def] text-white hover:bg-[#4a7de0]'
                }`}
              >
                {keySaved ? '✓' : 'Sauver'}
              </button>
            </div>
          </div>
          <div className="border-t border-white/5 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-white">CoinGecko Crypto</p>
              <p className="text-[10px] text-[#555]">Gratuit · Sans clé requise</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#00c87a]/10 border border-[#00c87a]/20 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00c87a]"/>
              <span className="text-[10px] font-bold text-[#00c87a]">Actif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section App */}
      <div className="mx-4 mb-4">
        <p className="text-[11px] text-[#555] uppercase tracking-wider mb-2 px-1">Application</p>
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden divide-y divide-white/5">
          {[
            { label: 'Version', value: '1.0.0', icon: '📦' },
            { label: 'Mode', value: 'Paper Trading', icon: '🎮' },
            { label: 'Données', value: 'Temps réel', icon: '⚡' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-lg">{item.icon}</span>
              <span className="text-[13px] text-white flex-1">{item.label}</span>
              <span className="text-[12px] text-[#555] font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Réinitialiser */}
      <div className="mx-4 mb-4">
        <p className="text-[11px] text-[#555] uppercase tracking-wider mb-2 px-1">Zone de danger</p>
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full px-4 py-4 text-left flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-[#ff3b5c]/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3b5c" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#ff3b5c]">Réinitialiser le portefeuille</p>
                <p className="text-[11px] text-[#555] mt-0.5">Efface toutes les positions et l'historique</p>
              </div>
            </button>
          ) : (
            <div className="p-4">
              <p className="text-[13px] text-white font-bold mb-1">Êtes-vous sûr ?</p>
              <p className="text-[11px] text-[#555] mb-3">Cette action est irréversible. Toutes vos positions et transactions seront supprimées.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/8 text-white text-[12px] font-bold"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { resetPortfolio(); setConfirmReset(false) }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ff3b5c] text-white text-[12px] font-bold"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
