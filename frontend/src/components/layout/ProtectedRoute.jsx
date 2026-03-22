import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth';

export default function ProtectedRoute({ requireOnboarding = true, requireAdmin = false, children }) {
  const { currentUser, userProfile, loading, refreshProfile } = useAuth();
  const [profilePollCount, setProfilePollCount] = useState(0);
  const MAX_POLLS = 6;  // try 6 times × 500ms = 3 seconds

  // When logged in but profile is null, poll a few times in case the
  // Cloud Function that creates the doc hasn't finished yet.
  useEffect(() => {
    if (!loading && currentUser && !userProfile && profilePollCount < MAX_POLLS) {
      const timer = setTimeout(async () => {
        await refreshProfile();
        setProfilePollCount(c => c + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, currentUser, userProfile, profilePollCount, refreshProfile]);

  // Auth loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Loading ShiaConnection...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) return <Navigate to="/auth" replace />;

  // Profile still loading (polling for Cloud Function)
  if (!userProfile && profilePollCount < MAX_POLLS) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  const isCurrentlyOnboarding = window.location.pathname === '/onboarding';
  
  // Suspended user guard
  if (userProfile && userProfile.profileStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-xl border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Account Suspended</h1>
          <p className="text-slate-500 text-sm mb-6">
            Your account has been temporarily suspended by an administrator. Please contact support for more information.
          </p>
          <button onClick={() => logoutUser()} className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (requireOnboarding && !isCurrentlyOnboarding && (!userProfile || userProfile.profileStatus === 'pending')) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // Custom access logic for Admin portal
  if (requireAdmin && !userProfile.isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children ? children : <Outlet />;
}
