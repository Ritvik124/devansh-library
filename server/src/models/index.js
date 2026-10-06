import mongoose from 'mongoose';
const { Schema, model } = mongoose;
export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true },
  studentId: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  profileImage: String,
  isActive: { type: Boolean, default: true },
  resetTokenHash: { type: String, select: false },
  resetExpires: { type: Date, select: false },
}, { timestamps: true }));
export const Seat = model('Seat', new Schema({
  seatNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'maintenance'], default: 'active' },
  location: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true }));
const b = new Schema({
  bookingId: { type: String, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  seatId: { type: Schema.Types.ObjectId, ref: 'Seat', index: true },
  date: { type: String, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed', index: true },
}, { timestamps: true });
b.index({ seatId: 1, startTime: 1, endTime: 1 });
export const Booking = model('Booking', b);
