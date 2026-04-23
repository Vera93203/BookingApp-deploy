'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import { Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'otp' | 'credentials'>('credentials');
  const [email, setEmail] = useState('admin@myanmartravel.com');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [loading, setLoading] = useState(false);

  const loginWithCredentials = async () => {
    if (!email || !password) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { accessToken, user } = res.data;
      if (user.role !== 'ADMIN') {
        toast.error('Admin access only');
        return;
      }
      Cookies.set('admin_token', accessToken, { expires: 7 });
      toast.success('Welcome, Admin!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!phone.trim()) return toast.error('Enter phone number');
    setLoading(true);
    try {
      let formatted = phone.trim();
      if (formatted.startsWith('09')) formatted = '+959' + formatted.substring(2);
      if (!formatted.startsWith('+')) formatted = '+' + formatted;
      await authApi.sendOtp(formatted);
      setPhone(formatted);
      setStep('verify');
      toast.success('OTP sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) return toast.error('Enter OTP');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp.trim());
      const { accessToken, user } = res.data;
      if (user.role !== 'ADMIN') {
        toast.error('Admin access only');
        return;
      }
      Cookies.set('admin_token', accessToken, { expires: 7 });
      toast.success('Welcome, Admin!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">UCLICK-Y</h1>
          <p className="text-gray-400 mt-1">System Administration</p>
        </div>

        <div className="card">
          {/* Method toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => { setMethod('credentials'); setStep('input'); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                method === 'credentials' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => { setMethod('otp'); setStep('input'); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                method === 'otp' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Phone OTP
            </button>
          </div>

          {method === 'credentials' ? (
            <>
              <div className="mb-4">
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="admin@myanmartravel.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="mb-6">
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="Enter password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loginWithCredentials()} />
              </div>
              <button onClick={loginWithCredentials} disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </>
          ) : step === 'input' ? (
            <>
              <div className="mb-6">
                <label className="label">Admin Phone Number</label>
                <input type="tel" className="input" placeholder="+959..."
                  value={phone} onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()} />
              </div>
              <button onClick={sendOtp} disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">Code sent to {phone}</p>
              <div className="mb-6">
                <label className="label">OTP Code</label>
                <input type="text" className="input text-center text-2xl tracking-[0.5em]"
                  maxLength={6} placeholder="------"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && verifyOtp()} autoFocus />
              </div>
              <button onClick={verifyOtp} disabled={loading} className="btn-primary w-full mb-3">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button onClick={() => setStep('input')} className="text-accent text-sm hover:underline w-full text-center">
                Change number
              </button>
            </>
          )}

          <p className="text-xs text-gray-400 text-center mt-6">
            Default: admin@myanmartravel.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
