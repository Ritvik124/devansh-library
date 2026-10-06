import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import { useApp } from '../context/App';
export default function Layout() {
  const { user, logout } = useApp(), nav = useNavigate(), [open, setOpen] = useState(false);
  const links = !user ? [['/', 'Home'], ['/#about', 'About'], ['/#facilities', 'Facilities'], ['/seats', 'Seat Availability'], ['/#contact', 'Contact']]
    : user.role === 'admin' ? [['/admin', 'Admin Panel']] : [['/dashboard', 'Dashboard'], ['/find', 'Find Seat'], ['/bookings', 'My Bookings'], ['/profile', 'Profile']];
  const out = async () => { await logout(); nav('/login'); };
  return (<div className="min-h-screen flex flex-col">
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-brand-700 tracking-wide"><BookOpen /> DEVANSH LIBRARY</Link>
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {links.map(([to, l]) => <NavLink key={l} to={to} className="hover:text-brand-600">{l}</NavLink>)}
          {user ? <button className="btn" onClick={out}>Logout</button> : <><Link to="/login" className="hover:text-brand-600">Login</Link><Link to="/register" className="btn">Register</Link></>}
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="md:hidden px-4 pb-4 flex flex-col gap-3 text-sm" onClick={() => setOpen(false)}>
        {links.map(([to, l]) => <Link key={l} to={to}>{l}</Link>)}
        {user ? <button className="btn" onClick={out}>Logout</button> : <><Link to="/login">Login</Link><Link to="/register">Register</Link></>}</div>}
    </header>
    <main className="flex-1"><Outlet /></main>
    <footer className="bg-brand-900 text-blue-100 mt-16"><div className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-3 gap-6 text-sm">
      <div><h3 className="text-white font-bold text-lg">DEVANSH LIBRARY</h3><p>Your Space to Focus, Learn & Succeed</p></div>
      <div><p className="text-white font-semibold">Quick Links</p><p>Home | About | Facilities | Seats | Contact</p></div>
      <div><p className="text-white font-semibold">Open 24×7</p><p>Timezone: IST (UTC+05:30)</p></div>
      <p className="md:col-span-3 border-t border-blue-800 pt-4 text-center">© 2026 DEVANSH LIBRARY. All Rights Reserved. · Made by Ritvik Raj ❤️</p></div></footer></div>);
}
