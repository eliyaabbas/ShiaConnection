import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Jobs from './pages/Jobs';
import Network from './pages/Network';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Onboarding from './pages/Onboarding';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Saved from './pages/Saved';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from './components/ui/Toast';

function AuthGuard() {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/" replace />;
  return <Auth />;
}

function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Public / Auth routes */}
        <Route path="/auth" element={<AuthGuard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Semi-Protected route (logged in but onboarding NOT required) */}
        <Route path="/onboarding" element={
          <ProtectedRoute requireOnboarding={false}>
            <Onboarding />
          </ProtectedRoute>
        } />
        
        {/* Strictly Protected layout routes (logged in AND onboarded) */}
        <Route path="/" element={
           <ProtectedRoute requireOnboarding={true}>
             <Layout />
           </ProtectedRoute>
        }>
          <Route index element={<Feed />} />
          <Route path="profile/me" element={<ProfileMe />} />
          <Route path="profile/:id" element={<Profile />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="network" element={<Network />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:chatId" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="saved" element={<Saved />} />
        </Route>
        
        {/* Admin layout */}
        <Route path="/admin" element={
          <ProtectedRoute requireOnboarding={false} requireAdmin={true}>
             <Layout />
          </ProtectedRoute>
        }>
           <Route index element={<Admin />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

// Redirect /profile/me to the actual uid-based profile
function ProfileMe() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/auth" replace />;
  return <Navigate to={`/profile/${currentUser.uid}`} replace />;
}

export default App;

