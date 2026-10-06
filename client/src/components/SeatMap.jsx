const COL = { available: 'bg-green-100 text-green-800 border-green-300', occupied: 'bg-red-100 text-red-800 border-red-300', reserved: 'bg-yellow-100 text-yellow-800 border-yellow-300', maintenance: 'bg-slate-300 text-slate-600 border-slate-400' };
export const Legend = () => <div className="flex flex-wrap gap-3 text-xs">{[['🟢', 'Available'], ['🔴', 'Occupied'], ['🟡', 'Reserved'], ['⚫', 'Maintenance']].map(([i, t]) => <span key={t}>{i} {t}</span>)}</div>;
export default function SeatMap({ seats, onPick, selected }) {
  const g = seats.reduce((a, s) => ((a[s.seatNumber[0]] ??= []).push(s), a), {});
  return <div className="space-y-4">{Object.entries(g).map(([k, l]) => <div key={k}><h4 className="text-xs font-bold text-slate-500 mb-1">SECTION {k}</h4>
    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">{l.map((s) => <button key={s._id} onClick={() => onPick?.(s)} className={`rounded-lg border py-2 text-xs font-semibold transition hover:scale-105 ${COL[s.status]} ${selected === s._id ? 'ring-2 ring-brand-600' : ''}`}>{s.seatNumber}</button>)}</div></div>)}</div>;
}
