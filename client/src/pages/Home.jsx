import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Zap, Droplets, ShowerHead, Armchair, Wifi, VolumeX, ShieldCheck, Target } from 'lucide-react';
import { api } from '../services/api';
const F = [[Clock, '24×7 Open', 'Study any time, any day.'], [Zap, '24×7 Electricity', 'Uninterrupted study sessions.'], [Droplets, 'Clean Drinking Water', 'Easily accessible for all.'], [ShowerHead, 'Hygienic Bathroom', 'Clean and well maintained.'], [Armchair, 'Comfortable Seating', 'Built for long sessions.'], [Wifi, 'High-Speed Wi-Fi', 'For online learning.'], [VolumeX, 'Peaceful Environment', 'Quiet and disciplined.'], [ShieldCheck, 'Safe & Secure', 'Your belongings are protected.']];
export default function Home() {
  const [seats, setSeats] = useState(null);
  useEffect(() => { api('/seats').then((d) => setSeats(d.seats)).catch(() => setSeats([])); }, []);
  const c = (x) => seats?.filter((s) => s.status === x).length ?? '–';
  return (<div>
    <section className="bg-gradient-to-br from-brand-900 to-brand-600 text-white"><div className="mx-auto max-w-6xl px-4 py-20 grid md:grid-cols-2 gap-10 items-center">
      <div><h1 className="text-5xl font-extrabold">DEVANSH LIBRARY</h1><p className="mt-3 text-xl italic">“Your Space to Focus. Your Place to Succeed.”</p>
        <p className="mt-4 text-blue-100">A peaceful, comfortable and student-friendly study environment with 24×7 access, reliable electricity, clean drinking water, hygienic bathrooms and smart seat allotment.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link to="/seats" className="btn !bg-white !text-brand-700">Check Seat Availability</Link><Link to="/find" className="btn !bg-brand-500">Book a Seat</Link><Link to="/register" className="btn2">Create Student Account</Link></div></div>
      <div className="card text-slate-800"><p className="font-bold text-green-600">🟢 LIBRARY OPEN</p><p className="text-3xl font-extrabold">24×7</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">{[['Total Seats', seats?.length ?? '–'], ['Available', c('available')], ['Occupied', c('occupied')], ['Reserved', c('reserved')]].map(([l, v]) => <div key={l} className="rounded-xl bg-brand-50 p-3"><div className="text-2xl font-bold text-brand-700">{v}</div><div className="text-xs">{l}</div></div>)}</div></div></div></section>
    <section id="about" className="mx-auto max-w-6xl px-4 py-14"><h2 className="text-3xl font-bold">A Student Study Library Built for Your Success</h2>
      <p className="mt-3 text-slate-600 max-w-3xl">DEVANSH LIBRARY gives students preparing for college, competitive, government and entrance exams a peaceful place for long-duration study — with 24×7 access, reliable electricity, clean water, hygienic bathrooms, comfortable seating and smart seat management.</p></section>
    <section id="facilities" className="mx-auto max-w-6xl px-4"><h2 className="text-3xl font-bold mb-6">Facilities</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {F.map(([I, t, d]) => <div key={t} className="card hover:shadow-md transition"><I className="text-brand-600" /><h3 className="mt-2 font-semibold">{t}</h3><p className="text-sm text-slate-500">{d}</p></div>)}</div>
      <div className="card mt-6 flex items-center gap-3 bg-brand-50"><Target className="text-brand-600" /><p><b>Smart Feature:</b> Find the Earliest Available Seat for your date, time and duration.</p></div></section>
    <section id="contact" className="mx-auto max-w-6xl px-4 py-14"><h2 className="text-3xl font-bold mb-4">Contact DEVANSH LIBRARY</h2>
      <div className="card space-y-1 text-sm"><p>📍 Address: [Add library address here]</p><p>📞 Phone: [Add phone number here]</p><p>✉️ Email: [Add email here]</p><p>🗺️ Google Maps: [Paste map embed link here]</p><p>🕐 Open 24×7</p>
        <div className="pt-3 flex gap-2"><a className="btn" href="tel:">Call Now</a><a className="btn2" href="https://maps.google.com">Get Directions</a></div></div></section></div>);
}
