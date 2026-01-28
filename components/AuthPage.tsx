
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, Loader2, User, AlertCircle, ArrowRight, Zap, ShieldCheck, CheckCircle, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  // Use Router Hook for Mode
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine mode based on URL
  const isLogin = location.pathname.includes('/login');

  const [showOtp, setShowOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear error when switching modes
  useEffect(() => {
      setError('');
  }, [location.pathname]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!supabase) {
        setError("Configuration error.");
        setLoading(false);
        return;
    }

    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { 
                        full_name: fullName,
                        joined_at: new Date().toISOString() 
                    }
                }
            });

            if (signUpError) throw signUpError;
            
            // Only show OTP if session is not already established (email confirmation required)
            if (data.user && !data.session) {
                setShowOtp(true);
            }
        }
    } catch (err: any) {
        setError(err.message || "Authentication failed");
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      if (!supabase) return;

      try {
          const { data, error } = await supabase.auth.verifyOtp({
              email,
              token: otpCode,
              type: 'signup'
          });

          if (error) throw error;

          if (data.user) {
              // Ensure profile exists in public.users
              await supabase.from('users').upsert([
                  {
                      id: data.user.id,
                      email: email,
                      full_name: fullName,
                      joined_at: new Date().toISOString(),
                      usage: { ai_analysis_used: 0, monetization_checks_used: 0, tracked_niches: 0, last_reset: new Date().toDateString() }
                  }
              ]);
          }
      } catch (err: any) {
          setError(err.message || "Invalid or expired code.");
      } finally {
          setLoading(false);
      }
  };

  const handleResendCode = async () => {
      if (!email) return;
      setResendLoading(true);
      setError('');
      try {
          const { error } = await supabase.auth.resend({
              type: 'signup',
              email: email
          });
          if (error) throw error;
          alert(`8-digit code resent to ${email}`);
      } catch (err: any) {
          setError(err.message || "Failed to resend code");
      } finally {
          setResendLoading(false);
      }
  };

  const handleGoogleLogin = async () => {
      if(!supabase) return;
      await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
      });
  };

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white p-4 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(34,197,94,0.15),transparent)] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
            <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-2xl shadow-green-500/20 mb-6 transform hover:scale-110 transition-transform cursor-pointer">
                    <Zap className="text-white w-8 h-8 fill-current" />
                </div>
                <h1 className="text-4xl font-black tracking-tight mb-2">
                    {showOtp ? 'Verify Identity' : (isLogin ? 'Welcome Back' : 'Get Started')}
                </h1>
                <p className="text-gray-400 font-medium">
                    {showOtp ? 'Check your email for the 8-digit code.' : 'Analyze trending niches with NicheTracker.ai'}
                </p>
            </div>

            <div className="bg-[#18181b] border border-white/5 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all">
                
                {!showOtp && (
                    <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5 relative">
                        <div 
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#27272a] border border-white/10 shadow-lg rounded-xl transition-all duration-300 ease-out ${isLogin ? 'left-1.5' : 'left-[calc(50%+4.5px)]'}`}
                        ></div>
                        <button 
                            onClick={() => navigate('/auth/login')}
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10 ${isLogin ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                            Log In
                        </button>
                        <button 
                            onClick={() => navigate('/auth/register')}
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10 ${!isLogin ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {showOtp ? (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="text-center mb-4">
                            <div className="inline-flex p-4 bg-green-500/10 rounded-full text-green-500 mb-4 border border-green-500/20">
                                <ShieldCheck size={40} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block text-center">Security Code</label>
                            <input 
                                type="text" 
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 text-center text-4xl font-black tracking-[0.4em] text-green-400 focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-white/5"
                                placeholder="00000000"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm text-red-400 font-bold">
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading || otpCode.length < 8}
                            className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black rounded-2xl transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20}/> : 'Confirm & Login'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                        
                        <div className="flex flex-col gap-2">
                            <button 
                                type="button"
                                onClick={handleResendCode}
                                disabled={resendLoading}
                                className="w-full text-center text-xs font-bold text-green-500 hover:text-green-400 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                                {resendLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                {resendLoading ? 'Resending...' : 'Resend Code'}
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => setShowOtp(false)}
                                className="w-full text-center text-xs font-bold text-gray-500 hover:text-white transition-colors"
                            >
                                Changed email? Go back
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <form onSubmit={handleAuth} className="space-y-5">
                            {!isLogin && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors">
                                            <User size={18} />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-medium focus:border-green-500 focus:outline-none transition-all shadow-inner"
                                            placeholder="John Doe"
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-medium focus:border-green-500 focus:outline-none transition-all shadow-inner"
                                        placeholder="name@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-medium focus:border-green-500 focus:outline-none transition-all shadow-inner"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm text-red-400 font-bold animate-in fade-in zoom-in-95">
                                    <AlertCircle size={18} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black rounded-2xl transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] mt-4"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20}/> : (isLogin ? 'Sign In' : 'Create Account')}
                                {!loading && <ArrowRight size={20} />}
                            </button>
                        </form>

                        <div className="my-8 flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">OR</span>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>

                        <button 
                            onClick={handleGoogleLogin}
                            className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-[1.01]"
                        >
                            <GoogleIcon />
                            <span>Continue with Google</span>
                        </button>
                    </>
                )}
            </div>
            
            {!showOtp && (
                <div className="mt-10 text-center">
                    <p className="text-sm text-gray-500 font-bold">
                        {isLogin ? "Don't have an account?" : "Already a member?"}
                        <button 
                            onClick={() => navigate(isLogin ? '/auth/register' : '/auth/login')}
                            className="ml-2 text-green-500 hover:text-green-400 transition-colors"
                        >
                            {isLogin ? 'Sign up free' : 'Sign in here'}
                        </button>
                    </p>
                </div>
            )}
        </div>
    </div>
  );
};
