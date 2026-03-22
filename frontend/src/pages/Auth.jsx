import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/auth';
import { db, auth } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff, X, Mail, CheckCircle, Loader2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    firstName: '', lastName: '', email: '', phone: '', gender: '',
    password: '', confirmPassword: ''
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

      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      const { user, error: regError } = await registerUser(formData.email, formData.password, displayName);

      if (regError) {
        setError(regError);
      } else if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone,
            gender: formData.gender,
            role: '',              // set during onboarding
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
    setFormData({ firstName: '', lastName: '', email: '', phone: '', gender: '',
                  password: '', confirmPassword: '', role: 'Professional' });
  };

  const iClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400";
  const lClass = "block text-sm font-bold text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* ─── Left Brand Sidebar ─── */}
        <div className="md:w-5/12 bg-primary-900 text-white p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-white/10 p-2 rounded-lg"><span className="font-bold text-xl">✓</span></div>
              <h1 className="text-2xl font-bold tracking-tight">ShiaConnection</h1>
            </div>
            <h2 className="text-4xl font-extrabold mb-3">
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
          <div className="bg-white/10 rounded-xl p-5 mt-8 border border-white/5">
            <h3 className="font-bold text-sm mb-2">Tanzeemul Makatib is a leading Shia Muslim educational organization in India, operating 1,246+ schools.</h3>
            <p className="text-xs text-primary-200">We created ShiaConnection to help our community connect professionally.</p>
          </div>
        </div>

        {/* ─── Right Form ─── */}
        <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
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

                  {/* Social login can be added here in the future */}
                </>
              ) : (
                /* ─────────── CREATE ACCOUNT ─────────── */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lClass}>First Name</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                        placeholder="Ali" required className={iClass} />
                    </div>
                    <div>
                      <label className={lClass}>Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                        placeholder="Hussain" required className={iClass} />
                    </div>
                  </div>
                  <div>
                    <label className={lClass}>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="you@example.com" required className={iClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lClass}>Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                        placeholder="+91 9876543210" className={iClass} />
                    </div>
                    <div>
                      <label className={lClass}>Gender <span className="text-slate-400 font-normal">(optional)</span></label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className={`${iClass} cursor-pointer`}>
                        <option value="">Prefer not to say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
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
