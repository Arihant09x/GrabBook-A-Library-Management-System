import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Particles } from '../components/magicui/retro-grid';
import { motion } from 'framer-motion';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
const otpRequestSchema = z.object({
  email: z.string().email('Invalid email address')
});
const otpVerifySchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
});
const adminUpgradeSchema = z.object({
  adminCode: z.string().min(4, 'Admin code must be at least 4 characters')
});
export default function Login() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: any;
    if (countdown > 0) {
      interval = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterView) {
      const result = registerSchema.safeParse({ name, email, password });
      if (!result.success) { setError(result.error.issues[0].message); return; }
    } else {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) { setError(result.error.issues[0].message); return; }
    }
    setLoading(true);
    try {
      let res;
      if (isRegisterView) {
        res = await api.post('/auth/register', { name, email, password });
      } else {
        res = await api.post('/auth/login', { email, password });
      }

      login(res.data.token, res.data.user);

      if (res.data.user.role !== 'ADMIN') {
        setShowUpgrade(true);
      } else {
        toast.success(isRegisterView ? 'Registration successful!' : 'Login successful!');
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || (isRegisterView ? 'Registration failed' : 'Login failed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0 && step === 'verify') return;
    const result = otpRequestSchema.safeParse({ email });
    if (!result.success) { setError(result.error.issues[0].message); return; }
    setLoading(true);

    try {
      await api.post('/auth/otp/request', { email });
      setStep('verify');
      setError('');
      setCountdown(600);
      toast.success('Secure OTP sent to your email');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to request OTP';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = otpVerifySchema.safeParse({ email, otp });
    if (!result.success) { setError(result.error.issues[0].message); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/verify', { email, otp });
      login(res.data.token, res.data.user);
      if (res.data.user.role !== 'ADMIN') {
        setShowUpgrade(true);
      } else {
        toast.success('Login successful!');
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = adminUpgradeSchema.safeParse({ adminCode });
    if (!result.success) { setError(result.error.issues[0].message); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/upgrade', { adminCode });
      login(res.data.token, res.data.user);
      toast.success('Admin privileges successfully escalated!');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid Admin Code';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50/50 p-4 overflow-hidden">
      <Particles
        className="absolute inset-0"
        quantity={250}
        ease={100}
        color="#2563eb"
        refresh
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 w-full max-w-sm h-full"
      >
        <Card className="w-full shadow-2xl bg-white/80 backdrop-blur-md border border-white/40">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Library Access</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Sign in to borrow books</p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6 space-x-2 bg-gray-100 p-1 rounded-full">
              <button
                type="button"
                className={`flex-1 text-sm py-1.5 px-3 rounded-full transition-all ${!isOtpMode ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
                onClick={() => setIsOtpMode(false)}
              >Password</button>
              <button
                type="button"
                className={`flex-1 text-sm py-1.5 px-3 rounded-full transition-all ${isOtpMode ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
                onClick={() => { setIsOtpMode(true); setStep('request'); }}
              >OTP Login</button>
            </div>

            {error && <div className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded">{error}</div>}

            {showUpgrade ? (
              <form onSubmit={handleUpgradeAdmin} className="space-y-4">
                <p className="text-sm text-center text-gray-600 mb-4">Success! You are authenticated. Would you like to enter a Secret Admin Code to escalate your privileges, or skip to continue as a standard user?</p>
               <Input type="password" placeholder="Admin Secret Code (Optional)" value={adminCode} onChange={e => setAdminCode(e.target.value)} required disabled={loading} />
               <Button type="submit" className="w-full" isLoading={loading}>Verify & Access Dashboard</Button>
               <Button type="button" disabled={loading} className="w-full border-gray-300 text-gray-700 bg-white hover:bg-gray-50" onClick={() => navigate('/')}>Skip this step</Button>
            </form>
            ) : !isOtpMode ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                {isRegisterView && (
                  <Input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                )}
                <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              <Button type="submit" className="w-full mt-2" isLoading={loading}>{isRegisterView ? 'Create Account' : 'Sign In'}</Button>
              <div className="text-center mt-2">
                  <button type="button" className="text-sm text-primary hover:underline transition" onClick={() => setIsRegisterView(!isRegisterView)}>
                    {isRegisterView ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                  </button>
                </div>
              </form>
            ) : (
              step === 'request' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <Input type="email" placeholder="Valid Email for OTP" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                <Button type="submit" className="w-full mt-2" isLoading={loading}>Request Secure OTP</Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-xs text-center text-gray-500 mb-2">Code sent to {email}</p>
                  <div className="flex justify-between items-center mb-2 px-2 bg-gray-100/50 py-2 rounded-md">
                    <span className="text-xs font-medium text-muted-foreground flex items-center">
                      <svg className="w-3 h-3 mr-1 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Expires in: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </span>
                    <button type="button" onClick={handleRequestOtp} disabled={countdown > 0 || loading} className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline font-semibold">Resend Code</button>
                </div>
                <Input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="text-center tracking-widest text-lg" disabled={loading} />
                <Button type="submit" className="w-full mt-2" isLoading={loading}>Verify & Access</Button>
              </form>
              )
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
