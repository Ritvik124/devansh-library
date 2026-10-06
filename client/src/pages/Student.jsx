import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, fmtFull, fmtTime, fmtDate, fmtDur, nowIST, toParts } from '../services/api';
import { useApp } from '../context/App';
import SeatMap, { Legend } from '../components/SeatMap';

export function Dashboard() {
  const { user } = useApp(); const [b, setB] = useState([]), [seats, setSeats] = useState([]);
  useEffect(() => { api('/bookings/my').then((d) => setB(d.bookings)); api('/seats').then((d) => setSeats(d.seats)); }, []);
  const act = b.find((x) => x.phase === 'active'), up = b.filter((x) => x.phase === 'upcoming'), today = nowIST().toISODate();
  const hrs = b.filter((x) => x.phase === 'completed').reduce((a, x) => a + (new Date(x.endTime) - new Date(x.startTime)) / 36e5, 0);
  const cards = [['🪑 Current Seat', act?.seatId?.seatNumber || 'None'], ["📅 Today's Booking", b.filter((x) => x.date === today && x.status === 'confirmed').length], ['⏰ Booking End', act ? fmtTime(act.endTime) : '—'], ['🟢 Available Seats', seats.filter((s) => s.status === 'available').length], ['📚 Study Hours', hrs.toFixed(1)], ['📋 Upcoming', up.length]];
  return <div className="mx-auto max-w-6xl px-4 py-8"><h1 className="text-3xl font-bold">Welcome, {user.name} 👋</h1>
    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">{cards.map(([l, v]) => <div key={l} className="card"><p className="text-sm text-slate-500">{l}</p><p className="text-2xl font-bold text-brand-700">{v}</p></div>)}</div>
    <div className="mt-6 flex flex-wrap gap-3"><Link className="btn" to="/find">Find a Seat</Link><Link className="btn" to="/find">Book a Seat</Link><Link className="btn2" to="/bookings">My Bookings</Link><Link className="btn2" to="/profile">My Profile</Link></div>
    {up[0] && <p className="mt-6 card">🔔 Next booking: seat <b>{up[0].seatId?.seatNumber}</b> at {fmtFull(up[0].startTime)}</p>}</div>;
}

export function FindSeat() {
  const { toast } = useApp(), nav = useNavigate(), n = nowIST();
  const [f, setF] = useState({ date: n.toISODate(), time: n.toFormat('HH:mm'), duration: 240 }), [res, setRes] = useState(null), [seats, setSeats] = useState([]), [sel, setSel] = useState(null), [pend, setPend] = useState(null);
  const load = () => api('/seats').then((d) => setSeats(d.seats)); useEffect(() => { load(); }, []);
  const find = async (e) => { e.preventDefault(); try { setRes(await api(`/bookings/first-available?date=${f.date}&startTime=${f.time}&duration=${f.duration}`)); } catch (x) { toast(x.message, 'err'); } };
  const confirm = async () => { try { const d = await api('/bookings', { method: 'POST', body: { seatId: pend.seatId, date: pend.date, startTime: pend.time, duration: pend.duration } }); toast(`✅ Booked seat ${d.seat} — ${d.booking.bookingId}`); nav('/bookings'); } catch (x) { toast('❌ ' + x.message, 'err'); setPend(null); load(); } };
  const ask = (seatId, seatNumber, from) => setPend({ seatId, seatNumber, ...(from ? toParts(from) : { date: f.date, time: f.time }), duration: Number(f.duration) });
  const endOf = (p) => new Date(new Date(`${p.date}T${p.time}:00+05:30`).getTime() + p.duration * 6e4);
  const Opt = ({ r, best }) => <div className={`card ${best ? 'border-brand-500 border-2' : ''}`}><p className="font-bold text-lg">{best && '🎯 '}Seat {r.seatNumber}</p><p className="text-sm">Available from <b>{fmtFull(r.availableFrom)}</b></p><p className="text-sm">Available duration: <b>{fmtDur(r.availableMinutes)}</b></p><button className="btn mt-3" onClick={() => ask(r.seatId, r.seatNumber, r.availableFrom)}>BOOK THIS SEAT</button></div>;
  return <div className="mx-auto max-w-6xl px-4 py-8 space-y-6"><h1 className="text-3xl font-bold">🎯 Find My Earliest Available Seat</h1>
    <form onSubmit={find} className="card grid sm:grid-cols-4 gap-3 items-end">
      <label className="text-sm">Date<input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></label>
      <label className="text-sm">Start time (IST)<input type="time" className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} required /></label>
      <label className="text-sm">Duration<select className="input" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })}>{[1, 2, 3, 4, 6, 8, 10, 12, 24].map((h) => <option key={h} value={h * 60}>{h} hour{h > 1 && 's'}</option>)}</select></label>
      <button className="btn">Find Seat</button></form>
    {res && (res.best ? <div><h2 className="font-bold mb-2">Best Available Seat</h2><div className="grid md:grid-cols-3 gap-4"><Opt r={res.best} best />{res.alternatives.slice(0, 2).map((r) => <Opt key={r.seatId} r={r} />)}</div></div> : <p className="card">No suitable seat found.</p>)}
    <div className="card"><h2 className="font-bold mb-3">Or pick a seat on the map</h2><Legend /><div className="mt-3"><SeatMap seats={seats} selected={sel?._id} onPick={setSel} /></div></div>
    {sel && <div className="card"><h3 className="font-bold text-lg">Seat {sel.seatNumber} — {sel.location}</h3><p className="capitalize">Status: {sel.status}</p>
      {sel.current && <p>Current booking: {fmtTime(sel.current.startTime)} – {fmtTime(sel.current.endTime)}</p>}
      {sel.nextAvailable && <p>Next available: <b>{fmtFull(sel.nextAvailable)}</b></p>}
      {sel.upcoming.map((u, i) => <p key={i} className="text-sm text-slate-500">Booked: {fmtDate(u.startTime)} {fmtTime(u.startTime)}–{fmtTime(u.endTime)}</p>)}
      {sel.status !== 'maintenance' && <div className="mt-3 flex gap-2"><button className="btn" onClick={() => ask(sel._id, sel.seatNumber)}>Book at selected time</button>{sel.status !== 'available' && <button className="btn2" onClick={() => ask(sel._id, sel.seatNumber, sel.nextAvailable)}>Book from {fmtTime(sel.nextAvailable)}</button>}</div>}</div>}
    {pend && <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"><div className="card max-w-sm w-full space-y-1"><h3 className="font-bold text-lg">DEVANSH LIBRARY — Booking Summary</h3>
      <p>Seat: <b>{pend.seatNumber}</b></p><p>Start: {fmtFull(new Date(`${pend.date}T${pend.time}:00+05:30`))}</p><p>End: {fmtFull(endOf(pend))}</p><p>Duration: {fmtDur(pend.duration)}</p>
      <div className="flex gap-2 pt-3"><button className="btn flex-1" onClick={confirm}>Confirm Booking</button><button className="btn2" onClick={() => setPend(null)}>Cancel</button></div></div></div>}</div>;
}

export function SeatsPublic() {
  const [seats, setSeats] = useState([]); useEffect(() => { api('/seats').then((d) => setSeats(d.seats)); }, []);
  return <div className="mx-auto max-w-6xl px-4 py-8"><h1 className="text-3xl font-bold mb-3">Live Seat Availability</h1><Legend /><div className="card mt-4"><SeatMap seats={seats} /></div><p className="mt-3 text-sm text-slate-500">Login to book a seat.</p></div>;
}

export function MyBookings() {
  const { toast } = useApp(), [l, setL] = useState([]), [tab, setTab] = useState('upcoming');
  const load = () => api('/bookings/my').then((d) => setL(d.bookings)); useEffect(() => { load(); }, []);
  const cancel = async (id) => { if (!confirm('Cancel this booking?')) return; try { await api(`/bookings/${id}`, { method: 'DELETE' }); toast('Booking cancelled'); load(); } catch (x) { toast(x.message, 'err'); } };
  const shown = l.filter((b) => b.phase === tab);
  return <div className="mx-auto max-w-4xl px-4 py-8"><h1 className="text-3xl font-bold mb-4">My Bookings</h1>
    <div className="flex gap-2 mb-4 flex-wrap">{['upcoming', 'active', 'completed', 'cancelled'].map((t) => <button key={t} onClick={() => setTab(t)} className={`btn capitalize ${tab === t ? '' : '!bg-white !text-slate-600 border'}`}>{t}</button>)}</div>
    {shown.length === 0 && <p className="card text-center text-slate-500">No {tab} bookings.</p>}
    <div className="space-y-3">{shown.map((b) => <div key={b._id} className="card flex flex-wrap justify-between gap-3"><div><p className="font-bold">Seat {b.seatId?.seatNumber}</p><p className="text-sm">{fmtDate(b.startTime)} · {fmtTime(b.startTime)} – {fmtTime(b.endTime)} IST</p><p className="text-xs text-slate-500">{b.bookingId} · {b.status}</p></div>
      {(b.phase === 'upcoming' || b.phase === 'active') && <button className="btn2 !text-red-600" onClick={() => cancel(b._id)}>Cancel Booking</button>}</div>)}</div></div>;
}

export function Profile() {
  const { user, setUser, logout, toast } = useApp(), nav = useNavigate(), [e, setE] = useState(false), [f, setF] = useState({ name: user.name, phone: user.phone, profileImage: user.profileImage || '' }), [pw, setPw] = useState({ currentPassword: '', newPassword: '' }), [cnt, setCnt] = useState(0);
  useEffect(() => { api('/bookings/my').then((d) => setCnt(d.bookings.length)); }, []);
  const save = async () => { try { const d = await api('/auth/me', { method: 'PUT', body: f }); setUser(d.user); setE(false); toast('Profile updated'); } catch (x) { toast(x.message, 'err'); } };
  const chg = async () => { try { const d = await api('/auth/me/password', { method: 'PUT', body: pw }); toast(d.message); setPw({ currentPassword: '', newPassword: '' }); } catch (x) { toast(x.message, 'err'); } };
  return <div className="mx-auto max-w-xl px-4 py-8 space-y-4"><div className="card text-center"><div className="mx-auto h-24 w-24 rounded-full bg-brand-100 grid place-items-center text-3xl font-bold text-brand-700 overflow-hidden">{user.profileImage ? <img src={user.profileImage} className="h-full w-full object-cover" /> : user.name[0]}</div>
    <h1 className="mt-3 text-2xl font-bold">{user.name}</h1><p className="text-sm">{user.email} · {user.phone}</p><p className="text-sm">Student ID: {user.studentId}</p><p className="text-sm">Member since {fmtDate(user.createdAt)} · {cnt} bookings</p>
    <div className="mt-4 flex justify-center gap-2"><button className="btn2" onClick={() => setE(!e)}>Edit Profile</button><button className="btn" onClick={async () => { await logout(); nav('/login'); }}>Logout</button></div></div>
    {e && <div className="card space-y-2">{['name', 'phone', 'profileImage'].map((k) => <input key={k} className="input" placeholder={k} value={f[k]} onChange={(x) => setF({ ...f, [k]: x.target.value })} />)}<button className="btn" onClick={save}>Save</button></div>}
    <div className="card space-y-2"><h2 className="font-bold">Change Password</h2><input type="password" className="input" placeholder="Current password" value={pw.currentPassword} onChange={(x) => setPw({ ...pw, currentPassword: x.target.value })} /><input type="password" className="input" placeholder="New password" value={pw.newPassword} onChange={(x) => setPw({ ...pw, newPassword: x.target.value })} /><button className="btn" onClick={chg}>Change Password</button></div></div>;
}
