'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone.trim()) return toast.error('Enter your phone number');
    setLoading(true);
    try {
      let formatted = phone.trim();
      if (formatted.startsWith('09')) formatted = '+959' + formatted.substring(2);
      if (!formatted.startsWith('+')) formatted = '+' + formatted;
      await authApi.sendOtp(formatted, 'MM');
      setPhone(formatted);
      setStep('otp');
      toast.success('OTP sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) return toast.error('Enter the OTP code');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp.trim(), 'MM');
      const { accessToken, user } = res.data;

      if (user.role !== 'PARTNER' && user.role !== 'ADMIN') {
        toast.error('Access denied. Partner account required.');
        return;
      }

      Cookies.set('partner_token', accessToken, { expires: 7 });
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary text-3xl font-bold">U</span>
          </div>
          <h1 className="text-3xl font-bold text-white">UCLICK-Y</h1>
          <p className="text-blue-200 mt-1">Partner Dashboard</p>
        </div>

        <div className="card">
          {step === 'phone' ? (
            <>
              <h2 className="text-xl font-semibold mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm mb-6">Sign in with your partner phone number</p>

              <label className="label">Phone Number</label>
              <input
                type="tel"
                className="input mb-4"
                placeholder="+959 XXX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
              />

              <button onClick={sendOtp} disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-1">Verify OTP</h2>
              <p className="text-gray-500 text-sm mb-6">Enter the code sent to {phone}</p>

              <label className="label">OTP Code</label>
              <input
                type="text"
                className="input mb-4 text-center text-2xl tracking-[0.5em]"
                placeholder="------"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
                autoFocus
              />

              <button onClick={verifyOtp} disabled={loading} className="btn-primary w-full mb-3">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                onClick={() => { setStep('phone'); setOtp(''); }}
                className="text-primary text-sm hover:underline w-full text-center"
              >
                Change phone number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
