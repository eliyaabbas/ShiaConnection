import { useState } from 'react';
import { User, Lock, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { logoutUser } from '../services/auth';
import { updateUserProfile } from '../services/db';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';

import AccountInfo from '../components/settings/AccountInfo';
import ChangePassword from '../components/settings/ChangePassword';
import RequestRoleChange from '../components/settings/RequestRoleChange';

const requestRoleChangeFn = httpsCallable(functions, 'requestRoleChange');

export default function Settings() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('account');

  // Password change
  const [pwForm, setPwForm] = useState({ currentPw: '', newPw: '', confirmPw: '' });
  const [changingPw, setChangingPw] = useState(false);

  // Role change
  const [roleForm, setRoleForm] = useState({ newRole: '', justification: '' });
  const [requestingRole, setRequestingRole] = useState(false);

  // Location update
  const [location, setLocation] = useState(userProfile?.location || '');
  const [savingLocation, setSavingLocation] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirmPw) { toast.error('New passwords do not match'); return; }
    if (pwForm.newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setChangingPw(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, pwForm.currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, pwForm.newPw);
      toast.success('Password changed successfully!');
      setPwForm({ currentPw: '', newPw: '', confirmPw: '' });
    } catch (err) {
      toast.error(err.code === 'auth/wrong-password' ? 'Incorrect current password' : err.message);
    }
    setChangingPw(false);
  };

  const handleRoleRequest = async (e) => {
    e.preventDefault();
    if (!roleForm.newRole || !roleForm.justification) { toast.error('Please fill in all fields'); return; }
    if (roleForm.newRole === userProfile?.role) { toast.error("You're already that role"); return; }
    setRequestingRole(true);
    try {
      await requestRoleChangeFn({ newRole: roleForm.newRole, justification: roleForm.justification });
      toast.success('Role change request submitted! An admin will review it.');
      setRoleForm({ newRole: '', justification: '' });
    } catch (err) {
      toast.error(err.message);
    }
    setRequestingRole(false);
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    const { error } = await updateUserProfile(currentUser.uid, { location });
    if (error) toast.error(error);
    else { await refreshProfile(); toast.success('Location updated!'); }
    setSavingLocation(false);
  };

  const handleSignOut = async () => {
    await logoutUser();
    navigate('/auth');
  };

  const navItems = [
    { id: 'account', label: 'Account Info', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'role', label: 'Request Role Change', icon: Shield },
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-5">
      {/* Sidebar Nav */}
      <div className="md:w-56 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
          <h2 className="font-bold text-slate-900 px-3 py-2 text-base">Settings</h2>
          <nav className="space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === item.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                  <Icon className={`w-4 h-4 ${activeSection === item.id ? 'text-primary-600' : 'text-slate-400'}`} />
                  {item.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 space-y-5">
        {activeSection === 'account' && (
          <AccountInfo 
            currentUser={currentUser}
            userProfile={userProfile}
            location={location}
            setLocation={setLocation}
            savingLocation={savingLocation}
            handleSaveLocation={handleSaveLocation}
            handleSignOut={handleSignOut}
          />
        )}

        {activeSection === 'password' && (
          <ChangePassword 
            pwForm={pwForm}
            setPwForm={setPwForm}
            changingPw={changingPw}
            handleChangePassword={handleChangePassword}
          />
        )}

        {activeSection === 'role' && (
          <RequestRoleChange 
            userProfile={userProfile}
            roleForm={roleForm}
            setRoleForm={setRoleForm}
            requestingRole={requestingRole}
            handleRoleRequest={handleRoleRequest}
          />
        )}
      </div>
    </div>
  );
}
