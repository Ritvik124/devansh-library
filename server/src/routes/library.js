import { Router } from 'express';
import { Seat, Booking, User } from '../models/index.js';
import { auth, admin, wrap, bad } from '../middleware/auth.js';
import { parseIST, todayIST, dateIST } from '../utils/time.js';
const r = Router();
const group = (list) => list.reduce((a, b) => ((a[b.seatId] ??= []).push(b), a), {});
const overlap = (seatId, start, end) => Booking.findOne({ seatId, status: 'confirmed', startTime: { $lt: end }, endTime: { $gt: start } });

// Live seat status computed from bookings (all times are absolute instants; display in IST)
async function liveSeats() {
  const now = new Date();
  const seats = await Seat.find({ isActive: true }).sort('seatNumber').lean();
  const by = group(await Booking.find({ status: 'confirmed', endTime: { $gt: now } }).sort('startTime').lean());
  return seats.map((s) => {
    const l = by[s._id] || []; let t = now, cur = null;
    for (const b of l) if (b.startTime <= t && b.endTime > t) { t = b.endTime; cur ??= b; }
    const next = l.find((b) => b.startTime > now);
    const status = s.status === 'maintenance' ? 'maintenance' : cur ? 'occupied' : next && next.startTime - now <= 3600e3 ? 'reserved' : 'available';
    return { _id: s._id, seatNumber: s.seatNumber, location: s.location, status, current: cur && { startTime: cur.startTime, endTime: cur.endTime },
      nextAvailable: status === 'maintenance' ? null : t, upcoming: l.filter((b) => b.startTime > now).slice(0, 5).map((b) => ({ startTime: b.startTime, endTime: b.endTime })) };
  });
}
r.get('/seats', wrap(async (q, s) => s.json({ success: true, seats: await liveSeats() })));
r.get('/seats/available', wrap(async (q, s) => s.json({ success: true, seats: (await liveSeats()).filter((x) => x.status === 'available') })));

// Earliest suitable seat: per seat, slide the candidate start past conflicting bookings until a free window of `duration` exists
r.get('/bookings/first-available', auth, wrap(async (q, s) => {
  const dur = Number(q.query.duration), st = parseIST(String(q.query.date), String(q.query.startTime));
  if (!st.isValid || !(dur >= 30 && dur <= 1440)) return bad(s, 'Invalid date, time or duration');
  const start = +st.toJSDate(), ms = dur * 60000;
  const seats = await Seat.find({ isActive: true, status: 'active' }).lean();
  const by = group(await Booking.find({ status: 'confirmed', endTime: { $gt: new Date(start) } }).sort('startTime').lean());
  const res = seats.map((seat) => {
    let t = start; const l = by[seat._id] || [];
    for (const b of l) { if (+b.startTime >= t + ms) break; if (+b.endTime > t) t = +b.endTime; }
    const nb = l.find((b) => +b.startTime >= t + ms);
    return { seatId: seat._id, seatNumber: seat.seatNumber, location: seat.location, availableFrom: new Date(t), availableMinutes: nb ? (+nb.startTime - t) / 60000 : null };
  }).sort((a, b) => a.availableFrom - b.availableFrom || a.seatNumber.localeCompare(b.seatNumber));
  s.json({ success: true, best: res[0] || null, alternatives: res.slice(1, 7) });
}));

r.post('/bookings', auth, wrap(async (q, s) => {
  const dur = Number(q.body.duration), st = parseIST(String(q.body.date), String(q.body.startTime));
  if (!st.isValid || !(dur >= 30 && dur <= 1440)) return bad(s, 'Invalid date, time or duration');
  const start = st.toJSDate(), end = new Date(+start + dur * 60000);
  if (+start < Date.now() - 5 * 60000) return bad(s, 'Start time is in the past');
  const seat = await Seat.findById(q.body.seatId);
  if (!seat || !seat.isActive || seat.status === 'maintenance') return bad(s, 'Seat is not available');
  if (await overlap(seat._id, start, end)) return bad(s, 'This seat is already booked during the selected time.', 409);
  if (await Booking.findOne({ userId: q.user._id, status: 'confirmed', startTime: { $lt: end }, endTime: { $gt: start } })) return bad(s, 'You already have a booking during this time', 409);
  const bk = await Booking.create({ bookingId: `DL-${st.year}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, userId: q.user._id, seatId: seat._id, date: dateIST(start), startTime: start, endTime: end });
  s.status(201).json({ success: true, message: 'Booking confirmed', booking: bk, seat: seat.seatNumber });
}));
r.get('/bookings/my', auth, wrap(async (q, s) => {
  const now = new Date();
  const l = await Booking.find({ userId: q.user._id }).sort('-startTime').populate('seatId', 'seatNumber location').lean();
  s.json({ success: true, bookings: l.map((b) => ({ ...b, phase: b.status === 'cancelled' ? 'cancelled' : b.endTime <= now ? 'completed' : b.startTime <= now ? 'active' : 'upcoming' })) });
}));
r.get('/bookings/:id', auth, wrap(async (q, s) => {
  const b = await Booking.findOne({ $or: [{ bookingId: q.params.id }, ...(/^[a-f\d]{24}$/i.test(q.params.id) ? [{ _id: q.params.id }] : [])] }).populate('seatId', 'seatNumber location');
  if (!b || (String(b.userId) !== String(q.user._id) && q.user.role !== 'admin')) return bad(s, 'Booking not found', 404);
  s.json({ success: true, booking: b });
}));
const cancel = wrap(async (q, s) => {
  const b = await Booking.findById(q.params.id);
  if (!b || (String(b.userId) !== String(q.user._id) && q.user.role !== 'admin')) return bad(s, 'Booking not found', 404);
  if (b.status === 'cancelled' || b.endTime <= new Date()) return bad(s, 'Booking cannot be cancelled');
  b.status = 'cancelled'; await b.save(); s.json({ success: true, message: 'Booking cancelled' });
});
r.delete('/bookings/:id', auth, cancel);

// ---- Admin ----
const A = [auth, admin];
r.get('/admin/stats', ...A, wrap(async (q, s) => {
  const seats = await liveSeats(), c = (x) => seats.filter((z) => z.status === x).length;
  s.json({ success: true, stats: { totalStudents: await User.countDocuments({ role: 'student' }), totalSeats: seats.length, available: c('available'), occupied: c('occupied'), reserved: c('reserved'), maintenance: c('maintenance'),
    todayBookings: await Booking.countDocuments({ date: todayIST(), status: 'confirmed' }), upcoming: await Booking.countDocuments({ status: 'confirmed', startTime: { $gt: new Date() } }) } });
}));
r.get('/admin/students', ...A, wrap(async (q, s) => {
  const t = String(q.query.q || '').replace(/[^\w@. -]/g, ''), f = { role: 'student' };
  if (t) f.$or = ['name', 'email', 'phone', 'studentId'].map((k) => ({ [k]: new RegExp(t, 'i') }));
  s.json({ success: true, students: await User.find(f).sort('-createdAt').limit(200) });
}));
r.put('/admin/users/:id', ...A, wrap(async (q, s) => {
  const u = await User.findOneAndUpdate({ _id: q.params.id, role: 'student' }, { isActive: !!q.body.isActive }, { new: true });
  u ? s.json({ success: true, user: u }) : bad(s, 'Student not found', 404);
}));
r.delete('/admin/users/:id', ...A, wrap(async (q, s) => {
  const u = await User.findOneAndDelete({ _id: q.params.id, role: 'student' });
  if (u) await Booking.updateMany({ userId: u._id, status: 'confirmed' }, { status: 'cancelled' });
  u ? s.json({ success: true, message: 'Student removed' }) : bad(s, 'Student not found', 404);
}));
r.get('/admin/bookings', ...A, wrap(async (q, s) => {
  const t = String(q.query.q || '').trim().toUpperCase(); let l = await Booking.find().sort('-startTime').limit(300).populate('userId', 'name studentId').populate('seatId', 'seatNumber').lean();
  if (t) l = l.filter((b) => [b.bookingId, b.seatId?.seatNumber, b.userId?.name, b.userId?.studentId].some((v) => String(v).toUpperCase().includes(t)));
  s.json({ success: true, bookings: l });
}));
r.delete('/admin/bookings/:id', ...A, cancel);
r.get('/admin/seats', ...A, wrap(async (q, s) => s.json({ success: true, seats: await Seat.find({ isActive: true }).sort('seatNumber') })));
r.post('/admin/seats', ...A, wrap(async (q, s) => {
  const seatNumber = String(q.body.seatNumber || '').trim().toUpperCase();
  if (!seatNumber) return bad(s, 'Seat number required');
  if (await Seat.findOne({ seatNumber })) return bad(s, 'Seat already exists', 409);
  s.status(201).json({ success: true, seat: await Seat.create({ seatNumber, location: `Section ${seatNumber[0]}` }) });
}));
r.put('/admin/seats/:id', ...A, wrap(async (q, s) => {
  const u = {}; if (['active', 'maintenance'].includes(q.body.status)) u.status = q.body.status;
  if (q.body.location) u.location = String(q.body.location);
  s.json({ success: true, seat: await Seat.findByIdAndUpdate(q.params.id, u, { new: true }) });
}));
r.delete('/admin/seats/:id', ...A, wrap(async (q, s) => {
  await Seat.findByIdAndUpdate(q.params.id, { isActive: false });
  await Booking.updateMany({ seatId: q.params.id, status: 'confirmed', endTime: { $gt: new Date() } }, { status: 'cancelled' });
  s.json({ success: true, message: 'Seat removed' });
}));
export default r;
