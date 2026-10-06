import { useEffect, useState } from 'react';
import { api, fmtFull } from '../services/api';
import { useApp } from '../context/App';
export default function Admin() {
  const { toast } = useApp(), [tab, setTab] = useState('Dashboard'), [d, setD] = useState([]), [q, setQ] = useState(''), [st, setSt] = useState(null), [ns, setNs] = useState('');
  const url = { Students: '/admin/students', Seats: '/admin/seats', Bookings: '/admin/bookings' };
  const load = () => { if (tab === 'Dashboard') api('/admin/stats').then((r) => setSt(r.stats)); else api(`${url[tab]}?q=${encodeURIComponent(q)}`).then((r) => setD(r.students || r.seats || r.bookings)); };
  useEffect(() => { setD([]); load(); }, [tab]);
  const run = async (p, o) => { try { await api(p, o); load(); toast('Done'); } catch (x) { toast(x.message, 'err'); } };
  return <div className="mx-auto max-w-6xl px-4 py-8"><h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
    <div className="flex gap-2 mb-4 flex-wrap">{['Dashboard', 'Students', 'Seats', 'Bookings'].map((t) => <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? '' : '!bg-white !text-slate-600 border'}`}>{t}</button>)}</div>
    {tab === 'Dashboard' && st && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Object.entries(st).map(([k, v]) => <div key={k} className="card"><p className="text-xs uppercase text-slate-500">{k.replace(/([A-Z])/g, ' $1')}</p><p className="text-3xl font-bold text-brand-700">{v}</p></div>)}</div>}
    {tab !== 'Dashboard' && <div className="space-y-3">
      {tab !== 'Seats' ? <div className="flex gap-2"><input className="input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn" onClick={load}>Search</button></div>
        : <div className="flex gap-2"><input className="input" placeholder="New seat e.g. E01" value={ns} onChange={(e) => setNs(e.target.value)} /><button className="btn" onClick={() => run('/admin/seats', { method: 'POST', body: { seatNumber: ns } })}>Add Seat</button></div>}
      <div className="card overflow-x-auto"><table className="w-full text-sm"><tbody>
        {tab === 'Students' && d.map((u) => <tr key={u._id} className="border-b"><td className="py-2">{u.name}<br /><span className="text-xs text-slate-500">{u.studentId} · {u.email} · {u.phone}</span></td><td>{u.isActive ? 'Active' : 'Disabled'}</td><td className="text-right space-x-2"><button className="btn2" onClick={() => run(`/admin/users/${u._id}`, { method: 'PUT', body: { isActive: !u.isActive } })}>{u.isActive ? 'Disable' : 'Enable'}</button><button className="btn2 !text-red-600" onClick={() => confirm('Delete student?') && run(`/admin/users/${u._id}`, { method: 'DELETE' })}>Delete</button></td></tr>)}
        {tab === 'Seats' && d.map((s) => <tr key={s._id} className="border-b"><td className="py-2 font-semibold">{s.seatNumber}</td><td>{s.location}</td><td><select className="input !w-auto" value={s.status} onChange={(e) => run(`/admin/seats/${s._id}`, { method: 'PUT', body: { status: e.target.value } })}><option value="active">Active</option><option value="maintenance">Maintenance</option></select></td><td className="text-right"><button className="btn2 !text-red-600" onClick={() => confirm('Remove seat?') && run(`/admin/seats/${s._id}`, { method: 'DELETE' })}>Remove</button></td></tr>)}
        {tab === 'Bookings' && d.map((b) => <tr key={b._id} className="border-b"><td className="py-2">{b.bookingId}<br /><span className="text-xs text-slate-500">{b.userId?.name} ({b.userId?.studentId})</span></td><td>Seat {b.seatId?.seatNumber}</td><td>{fmtFull(b.startTime)}<br /><span className="text-xs">{b.status}</span></td><td className="text-right">{b.status === 'confirmed' && <button className="btn2 !text-red-600" onClick={() => run(`/admin/bookings/${b._id}`, { method: 'DELETE' })}>Cancel</button>}</td></tr>)}
      </tbody></table></div></div>}</div>;
}
