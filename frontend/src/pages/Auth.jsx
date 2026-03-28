import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, signInWithGoogle } from '../services/auth';
import { db, auth } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff, X, Mail, CheckCircle, Loader2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const navigate = useNavigate();

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const { user, error: loginError } = await loginUser(formData.email, formData.password);
      if (loginError) setError(loginError);
      else navigate('/');
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.'); setLoading(false); return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.'); setLoading(false); return;
      }

      const displayName = formData.name.trim();
      const { user, error: regError } = await registerUser(formData.email, formData.password, displayName);

      if (regError) {
        setError(regError);
      } else if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            firstName: formData.name.trim(),
            lastName: '',
            email: formData.email.trim(),
            phone: '',
            gender: '',
            role: '',
            profileStatus: 'pending',
            createdAt: serverTimestamp(),
          });
          navigate('/onboarding');
        } catch (dbErr) {
          setError('Account created but profile setup failed: ' + dbErr.message);
        }
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { user, isNewUser, error: googleError } = await signInWithGoogle();
      if (googleError) {
        setError(googleError);
        setGoogleLoading(false);
        return;
      }
      if (user) {
        if (isNewUser) {
          // Create Firestore profile for brand-new Google user
          await setDoc(doc(db, 'users', user.uid), {
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            phone: '',
            gender: '',
            role: '',
            profileStatus: 'pending',
            avatarUrl: user.photoURL || '',
            createdAt: serverTimestamp(),
          });
          navigate('/onboarding');
        } else {
          // Existing user — check if they completed onboarding
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists() && docSnap.data().profileStatus === 'completed') {
            navigate('/');
          } else {
            navigate('/onboarding');
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    }
    setGoogleLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setForgotError(
        err.code === 'auth/user-not-found' ? 'No account found with this email.' :
        err.code === 'auth/invalid-email'   ? 'Invalid email address.' :
        err.message
      );
    }
    setForgotLoading(false);
  };

  const switchMode = () => {
    setIsLogin(m => !m);
    setError('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const iClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400";
  const lClass = "block text-sm font-bold text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* ─── Left Brand Sidebar ─── */}
        <div className="md:w-5/12 bg-primary-900 text-white p-6 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 md:mb-10">
              <div className="bg-white/10 p-2 rounded-lg"><span className="font-bold text-xl">✓</span></div>
              <h1 className="text-2xl font-bold tracking-tight">ShiaConnection</h1>
            </div>
            
            <div className="hidden md:block">
              <h2 className="text-4xl font-extrabold mb-3 mt-6 md:mt-0">
                {isLogin ? 'Welcome Back' : 'Join Today'}
              </h2>
              <p className="text-primary-100 text-lg mb-10">
                {isLogin ? 'Continue your professional journey' : 'Your professional journey starts here'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FeatureCard icon="🤝" title="Build Network" />
                <FeatureCard icon="💼" title="Find Jobs" />
                <FeatureCard icon="📈" title="Grow Career" />
                <FeatureCard icon="🎯" title="Find Mentors" />
              </div>
            </div>
          </div>
          
          <div className="hidden md:block bg-white/10 rounded-xl p-5 mt-8 border border-white/5">
            <h3 className="font-bold text-sm mb-2">Tanzeemul Makatib is a leading Shia Muslim educational organization in India, operating 1,246+ schools.</h3>
            <p className="text-xs text-primary-200">We created ShiaConnection to help our community connect professionally.</p>
          </div>
        </div>

        {/* ─── Right Form ─── */}
        <div className="md:w-7/12 p-6 md:p-12 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">{isLogin ? 'Sign In' : 'Create Account'}</h2>
              <p className="text-slate-500">{isLogin ? 'Access your professional network' : 'Join our community of professionals'}</p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠️</span> {error}
              </div>
            )}

            {/* ─── Google Sign-In Button ─── */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60 shadow-sm mb-5"
            >
              {googleLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* ─── Divider ─── */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isLogin ? (
                /* ─────────── SIGN IN ─────────── */
                <>
                  <div>
                    <label className={lClass}>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="Enter your email" required className={iClass} />
                  </div>
                  <div>
                    <label className={lClass}>Password</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} name="password" value={formData.password}
                        onChange={handleChange} placeholder="Enter your password"
                        required className={`${iClass} pr-12`} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition-colors">
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 text-primary-600 border-slate-300 rounded" />
                      <span className="text-sm text-slate-500">Remember me</span>
                    </label>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(formData.email); setForgotSent(false); setForgotError(''); }}
                      className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm transition-colors mt-2 disabled:opacity-70 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</> : 'Sign In'}
                  </button>
                </>
              ) : (
                /* ─────────── CREATE ACCOUNT ─────────── */
                <>
                  <div>
                    <label className={lClass}>Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      placeholder="Your full name" required className={iClass} />
                  </div>
                  <div>
                    <label className={lClass}>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="you@example.com" required className={iClass} />
                  </div>
                  <div>
                    <label className={lClass}>Password</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} name="password" value={formData.password}
                        onChange={handleChange} placeholder="At least 6 characters"
                        required minLength={6} className={`${iClass} pr-12`} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1">
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={lClass}>Confirm Password</label>
                    <div className="relative">
                      <input type={showConfirmPw ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                        onChange={handleChange} placeholder="Repeat your password"
                        required className={`${iClass} pr-12`} />
                      <button type="button" onClick={() => setShowConfirmPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1">
                        {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mt-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</> : 'Create Account & Continue'}
                  </button>
                </>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={switchMode} className="font-bold text-primary-600 hover:underline">
                {isLogin ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* ─── Forgot Password Modal ─── */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForgot(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Reset Password</h3>
              <button onClick={() => setShowForgot(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSent ? (
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                <h4 className="font-bold text-slate-900 text-lg mb-2">Check your inbox!</h4>
                <p className="text-slate-500 text-sm">We sent a password reset link to <strong>{forgotEmail}</strong></p>
                <button onClick={() => setShowForgot(false)} className="mt-6 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-slate-500 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
                {forgotError && (
                  <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm border border-red-100">{forgotError}</div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="your@email.com" required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 placeholder-slate-400" />
                </div>
                <button type="submit" disabled={forgotLoading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  {forgotLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title }) {
  return (
    <div className="bg-white/10 rounded-xl p-4 border border-white/5 hover:bg-white/20 transition-colors">
      <div className="text-2xl mb-3">{icon}</div>
      <h4 className="font-bold text-sm text-white/90">{title}</h4>
    </div>
  );
}
