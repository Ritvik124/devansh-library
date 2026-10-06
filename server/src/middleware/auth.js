import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
export const wrap = (f) => (q, s, n) => f(q, s, n).catch(n);
export const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });
export const auth = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const { id } = jwt.verify(t, process.env.JWT_SECRET);
    const u = await User.findById(id);
    if (!u || !u.isActive) throw new Error('x');
    req.user = u; next();
  } catch { bad(res, 'Please login to continue', 401); }
};
export const admin = (req, res, next) => (req.user.role === 'admin' ? next() : bad(res, 'Admin access only', 403));
