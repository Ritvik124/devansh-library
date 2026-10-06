import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../context/App';
const Field = ({ label, ...p }) => <label className="block text-sm font-medium">{label}<input className="input mt-1" {...p} /></label>;
function useForm(init) { const [f, setF] = useState(init); return [f, (k) => (e) => setF({ ...f, [k]: e.target.value }), setF]; }
export function Login() {
  const [f, on] = useForm({ identifier: '', password: '' }), { login, toast } = useApp(), nav = useNavigate();
  const go = async (e) => { e.preventDefault(); try { const d = await api('/auth/login', { method: 'POST', body: f }); login(d); nav(d.user.role === 'admin' ? '/admin' : '/dashboard'); } catch (x) { toast(x.message, 'err'); } };
  return <form onSubmit={go} className="card mx-auto mt-12 max-w-md space-y-4"><h1 className="text-2xl font-bold">Student Login</h1>
    <Field label="Email / Mobile Number" value={f.identifier} onChange={on('identifier')} required /><Field label="Password" type="password" value={f.password} onChange={on('password')} required />
    <button className="btn w-full">Login</button><p className="text-sm flex justify-between"><Link className="text-brand-600" to="/forgot">Forgot Password?</Link><Link className="text-brand-600" to="/register">Create New Account</Link></p></form>;
}
export function Register() {
  const [f, on] = useForm({ name: '', email: '', phone: '', studentId: '', password: '', confirmPassword: '', profileImage: '' }), { login, toast } = useApp(), nav = useNavigate();
  const go = async (e) => { e.preventDefault(); try { const d = await api('/auth/register', { method: 'POST', body: f }); login(d); toast('✅ ' + d.message); nav('/dashboard'); } catch (x) { toast(x.message, 'err'); } };
  return <form onSubmit={go} className="card mx-auto mt-10 max-w-lg space-y-3"><h1 className="text-2xl font-bold">Create Student Account</h1>
    <Field label="Full Name" value={f.name} onChange={on('name')} required /><Field label="Email" type="email" value={f.email} onChange={on('email')} required />
    <Field label="Mobile Number" value={f.phone} onChange={on('phone')} maxLength={10} required /><Field label="Student ID / Registration Number" value={f.studentId} onChange={on('studentId')} required />
    <Field label="Password (8+, upper, lower, number)" type="password" value={f.password} onChange={on('password')} required /><Field label="Confirm Password" type="password" value={f.confirmPassword} onChange={on('confirmPassword')} required />
    <Field label="Profile Photo URL (optional)" value={f.profileImage} onChange={on('profileImage')} /><button className="btn w-full">Register</button></form>;
}
export function Forgot() {
  const [f, on] = useForm({ email: '', token: '', password: '', confirmPassword: '' }), [step, setStep] = useState(1), { toast } = useApp(), nav = useNavigate();
  const ask = async (e) => { e.preventDefault(); try { const d = await api('/auth/forgot-password', { method: 'POST', body: f }); toast(d.message); if (d.devToken) toast('DEV token: ' + d.devToken); setStep(2); } catch (x) { toast(x.message, 'err'); } };
  const reset = async (e) => { e.preventDefault(); try { const d = await api('/auth/reset-password', { method: 'POST', body: f }); toast(d.message); nav('/login'); } catch (x) { toast(x.message, 'err'); } };
  return <form onSubmit={step === 1 ? ask : reset} className="card mx-auto mt-12 max-w-md space-y-4"><h1 className="text-2xl font-bold">Reset Password</h1>
    <Field label="Email" type="email" value={f.email} onChange={on('email')} required />
    {step === 2 && <><Field label="Reset Token" value={f.token} onChange={on('token')} required /><Field label="New Password" type="password" value={f.password} onChange={on('password')} required /><Field label="Confirm Password" type="password" value={f.confirmPassword} onChange={on('confirmPassword')} required /></>}
    <button className="btn w-full">{step === 1 ? 'Send Reset Token' : 'Reset Password'}</button></form>;
}
