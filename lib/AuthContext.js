'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null));
  }, []);

  return <Ctx.Provider value={{ user, loading: user === undefined, logout: () => signOut(auth) }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
