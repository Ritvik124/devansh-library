import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Seat } from './models/index.js';
await mongoose.connect(process.env.MONGODB_URI);
for (const g of 'ABCD') for (let i = 1; i <= 25; i++) {
  const seatNumber = `${g}${String(i).padStart(2, '0')}`;
  await Seat.updateOne({ seatNumber }, { $setOnInsert: { seatNumber, location: `Section ${g}` } }, { upsert: true });
}
const email = process.env.SEED_ADMIN_EMAIL, pw = process.env.SEED_ADMIN_PASSWORD;
if (email && pw && !(await User.findOne({ email }))) await User.create({ name: 'Library Admin', email, phone: '9000000000', studentId: 'ADMIN-001', role: 'admin', passwordHash: await bcrypt.hash(pw, 12) });
console.log('Seeded 100 seats and admin:', email);
await mongoose.disconnect();
