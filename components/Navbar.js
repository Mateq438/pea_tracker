'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Accueil' },
  { href: '/alerts', icon: '🔔', label: 'Alertes' },
];

export default function Navbar() {
  const path = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-base">📈 PEA Tracker</span>
        <button onClick={logout} className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors">
          Déconnexion
        </button>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 flex safe-bottom">
        {NAV.map(n => (
          <Link key={n.href} href={n.href} className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${path === n.href ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}>
            <span className="text-xl mb-0.5">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
