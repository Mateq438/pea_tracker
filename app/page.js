'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => { if (user) router.replace('/dashboard'); }, [user, router]);

  if (authLoading || user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', u.uid), { email, name, createdAt: serverTimestamp() });
      }
      router.push('/dashboard');
    } catch (e) {
      const msgs = {
        'auth/user-not-found': 'Compte introuvable',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/email-already-in-use': 'Email déjà utilisé',
        'auth/weak-password': 'Mot de passe trop court (6 min)',
        'auth/invalid-email': 'Email invalide',
      };
      setErr(msgs[e.code] || e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📈</div>
          <h1 className="text-2xl font-bold">PEA Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Vos portefeuilles boursiers</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800">
          {/* Tabs */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-5">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(''); }}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${mode === m ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input type="text" placeholder="Votre prénom" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
            )}
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />

            {err && <p className="text-red-400 text-xs bg-red-950/40 px-3 py-2 rounded-lg">{err}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 mt-1">
              {loading ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : mode === 'login' ? 'Se connecter' : "Créer mon compte"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">Données 100% privées · Chiffrement Firebase</p>
      </div>
    </div>
  );
}
