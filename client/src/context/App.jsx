import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
const Ctx = createContext();
export const useApp = () => useContext(Ctx);
export function AppProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [toasts, setToasts] = useState([]);
  useEffect(() => { (localStorage.getItem('dl_token') ? api('/auth/me').then((d) => setUser(d.user)).catch(() => localStorage.removeItem('dl_token')) : Promise.resolve()).finally(() => setLoading(false)); }, []);
  const login = (d, remember = true) => { localStorage.setItem('dl_token', d.token); setUser(d.user); };
  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); localStorage.removeItem('dl_token'); setUser(null); };
  const toast = useCallback((msg, type = 'ok') => { const id = Math.random(); setToasts((t) => [...t, { id, msg, type }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000); }, []);
  return (<Ctx.Provider value={{ user, setUser, loading, login, logout, toast }}>{children}
    <div className="fixed bottom-4 right-4 z-50 space-y-2">{toasts.map((t) => <div key={t.id} className={`rounded-xl px-4 py-3 text-sm text-white shadow-lg ${t.type === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}>{t.msg}</div>)}</div></Ctx.Provider>);
}
