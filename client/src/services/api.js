import { DateTime } from 'luxon';
export const TZ = 'Asia/Kolkata';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export async function api(path, { method = 'GET', body } = {}) {
  const t = localStorage.getItem('dl_token');
  const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(t && { Authorization: `Bearer ${t}` }) }, body: body && JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}
const L = (v) => DateTime.fromISO(new Date(v).toISOString(), { zone: TZ });
export const fmtTime = (v) => L(v).toFormat('h:mm a');
export const fmtFull = (v) => L(v).toFormat("dd LLLL yyyy, h:mm a 'IST'");
export const fmtDate = (v) => L(v).toFormat('dd LLLL yyyy');
export const nowIST = () => DateTime.now().setZone(TZ);
export const toParts = (v) => ({ date: L(v).toISODate(), time: L(v).toFormat('HH:mm') });
export const fmtDur = (m) => (m == null ? 'Open-ended' : `${Math.floor(m / 60)}h ${m % 60}m`);
