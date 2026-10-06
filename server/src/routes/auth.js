import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/index.js';
import { auth, wrap, bad } from '../middleware/auth.js';
const r = Router();
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, studentId: u.studentId, role: u.role, profileImage: u.profileImage, createdAt: u.createdAt });
const strong = (p) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(p);
const S = (v) => String(v ?? '');
r.post('/register', wrap(async (q, s) => {
  const name = S(q.body.name).trim(), email = S(q.body.email).trim().toLowerCase(), phone = S(q.body.phone).trim();
  const studentId = S(q.body.studentId).trim(), password = S(q.body.password), profileImage = S(q.body.profileImage).slice(0, 500);
  if (!name || !studentId) return bad(s, 'Name and Student ID are required');
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad(s, 'Enter a valid email');
  if (!/^[6-9]\d{9}$/.test(phone)) return bad(s, 'Enter a valid 10-digit Indian mobile number');
  if (!strong(password)) return bad(s, 'Password needs 8+ chars with upper, lower case and a number');
  if (password !== S(q.body.confirmPassword)) return bad(s, 'Passwords do not match');
  if (await User.findOne({ $or: [{ email }, { phone }, { studentId }] })) return bad(s, 'Email, mobile or Student ID already registered', 409);
  const u = await User.create({ name, email, phone, studentId, profileImage, passwordHash: await bcrypt.hash(password, 12) });
  s.status(201).json({ success: true, message: 'Account created successfully. Welcome to DEVANSH LIBRARY!', token: sign(u), user: pub(u) });
}));
r.post('/login', wrap(async (q, s) => {
  const id = S(q.body.identifier).trim().toLowerCase();
  const u = await User.findOne({ $or: [{ email: id }, { phone: id }] }).select('+passwordHash');
  if (!u || !(await bcrypt.compare(S(q.body.password), u.passwordHash))) return bad(s, 'Invalid credentials', 401);
  if (!u.isActive) return bad(s, 'Account disabled. Contact the library.', 403);
  s.json({ success: true, token: sign(u), user: pub(u) });
}));
r.post('/logout', (q, s) => s.json({ success: true, message: 'Logged out' }));
r.post('/forgot-password', wrap(async (q, s) => {
  const u = await User.findOne({ email: S(q.body.email).trim().toLowerCase() });
  const out = { success: true, message: 'If the email exists, a reset token has been generated.' };
  if (u) {
    const token = crypto.randomBytes(16).toString('hex');
    u.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    u.resetExpires = new Date(Date.now() + 15 * 60000);
    await u.save();
    // TODO: send `token` by email/SMS in production. Shown in response only in development.
    if (process.env.NODE_ENV !== 'production') out.devToken = token;
  }
  s.json(out);
}));
r.post('/reset-password', wrap(async (q, s) => {
  const u = await User.findOne({ email: S(q.body.email).trim().toLowerCase() }).select('+resetTokenHash +resetExpires');
  const h = crypto.createHash('sha256').update(S(q.body.token)).digest('hex');
  if (!u || u.resetTokenHash !== h || u.resetExpires < new Date()) return bad(s, 'Invalid or expired reset token');
  if (!strong(S(q.body.password)) || q.body.password !== q.body.confirmPassword) return bad(s, 'Weak or mismatched password');
  u.passwordHash = await bcrypt.hash(q.body.password, 12); u.resetTokenHash = undefined; u.resetExpires = undefined;
  await u.save();
  s.json({ success: true, message: 'Password reset. Please login.' });
}));
r.get('/me', auth, (q, s) => s.json({ success: true, user: pub(q.user) }));
r.put('/me', auth, wrap(async (q, s) => {
  if (q.body.name) q.user.name = S(q.body.name).trim();
  if (q.body.phone) { if (!/^[6-9]\d{9}$/.test(S(q.body.phone))) return bad(s, 'Invalid mobile number'); q.user.phone = S(q.body.phone); }
  if (q.body.profileImage !== undefined) q.user.profileImage = S(q.body.profileImage).slice(0, 500);
  await q.user.save(); s.json({ success: true, user: pub(q.user) });
}));
r.put('/me/password', auth, wrap(async (q, s) => {
  const u = await User.findById(q.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(S(q.body.currentPassword), u.passwordHash))) return bad(s, 'Current password is wrong');
  if (!strong(S(q.body.newPassword))) return bad(s, 'Password needs 8+ chars with upper, lower case and a number');
  u.passwordHash = await bcrypt.hash(q.body.newPassword, 12); await u.save();
  s.json({ success: true, message: 'Password changed' });
}));
export default r;
