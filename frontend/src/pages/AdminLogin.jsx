import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { logoutUser } from '../services/auth';

export default function AdminLogin() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in AND is an admin, take them straight to the dashboard
  if (currentUser && userProfile?.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await userCred.user.getIdTokenResult(true); // Force refresh token
      
      const isAdmin = tokenResult.claims.admin === true || tokenResult.claims.superAdmin === true;

      if (!isAdmin) {
        // Not an admin! Kick them out immediately
        await logoutUser();
        toast.error('Access Denied: You do not have administrator privileges.');
        setLoading(false);
        return;
      }

      toast.success('Admin authenticated successfully');
      navigate('/admin');
    } catch (err) {
      toast.error('Authentication failed. Check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-xl">
            <Shield className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ShiaConnection Admin</h1>
          <p className="text-slate-400 text-sm">Restricted Access Control Portal</p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder-slate-600 transition-colors"
                placeholder="admin@shiaconnection.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Secure Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder-slate-600 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate System'}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/auth')} 
            className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Public App
          </button>
        </div>

      </div>
    </div>
  );
}
