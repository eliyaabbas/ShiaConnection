import { useState, useEffect } from 'react';
import { Users, Shield, Flag, Activity, CheckCircle, XCircle, MoreVertical, Loader2, Search, UserX, UserCheck, UserPlus, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';
import { getRoleChangeRequests, rejectRoleChange, getAllUsers, suspendUser, activateUser, getFlaggedContent, getAdminUsers } from '../services/db';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

const approveRoleChangeFn = httpsCallable(functions, 'approveRoleChange');
const makeAdminFn = httpsCallable(functions, 'makeAdmin');
const removeAdminFn = httpsCallable(functions, 'removeAdmin');

export default function Admin() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect non-admins
  useEffect(() => {
    if (userProfile && !userProfile.isAdmin) {
      navigate('/', { replace: true });
    }
  }, [userProfile, navigate]);

  const [roleRequests, setRoleRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Determine if this user is a super admin
  const isSuperAdmin = userProfile?.customClaims?.superAdmin === true || userProfile?.__isSuperAdmin === true;

  // Load role requests real-time
  useEffect(() => {
    const unsub = getRoleChangeRequests(setRoleRequests);
    return unsub;
  }, []);

  // Load users when on accounts tab
  useEffect(() => {
    if (activeTab === 'accounts') {
      getAllUsers().then(({ data }) => setAllUsers(data || []));
    }
  }, [activeTab]);

  // Load flagged content
  useEffect(() => {
    if (activeTab === 'flags') {
      const unsub = getFlaggedContent(setFlaggedPosts);
      return unsub;
    }
  }, [activeTab]);

  // Load Admin List
  useEffect(() => {
    if (activeTab === 'admins') {
      const unsub = getAdminUsers(setAdminList);
      return unsub;
    }
  }, [activeTab]);

  const handleApproveRole = async (req) => {
    setProcessingId(req.id);
    try {
      await approveRoleChangeFn({ requestId: req.id });
      toast.success(`Role changed to ${req.requestedRole}`);
    } catch (err) {
      toast.error('Failed to approve: ' + err.message);
    }
    setProcessingId(null);
  };

  const handleRejectRole = async (req) => {
    setProcessingId(req.id + '_reject');
    const { error } = await rejectRoleChange(req.id);
    if (error) toast.error(error);
    else toast.success('Request rejected');
    setProcessingId(null);
  };

  const handleSuspend = async (uid) => {
    setProcessingId(uid + '_suspend');
    const { error } = await suspendUser(uid);
    if (error) toast.error(error);
    else {
      toast.success('User suspended');
      setAllUsers(u => u.map(usr => usr.id === uid ? { ...usr, profileStatus: 'suspended' } : usr));
    }
    setProcessingId(null);
  };

  const handleActivate = async (uid) => {
    setProcessingId(uid + '_activate');
    const { error } = await activateUser(uid);
    if (error) toast.error(error);
    else {
      toast.success('User activated');
      setAllUsers(u => u.map(usr => usr.id === uid ? { ...usr, profileStatus: 'active' } : usr));
    }
    setProcessingId(null);
  };

  const handleMakeAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setProcessingId('make_admin');
    try {
      await makeAdminFn({ email: newAdminEmail });
      toast.success(`${newAdminEmail} has been promoted to Admin`);
      setNewAdminEmail('');
    } catch (err) {
      toast.error(err.message);
    }
    setProcessingId(null);
  };

  const handleRemoveAdmin = async (uid) => {
    if (!window.confirm('Are you sure you want to revoke this user\'s admin access?')) return;
    setProcessingId(uid + '_remove_admin');
    try {
      await removeAdminFn({ uid });
      toast.success('Admin privileges revoked');
    } catch (err) {
      toast.error(err.message);
    }
    setProcessingId(null);
  };

  const filteredUsers = allUsers.filter(u => {
    const q = userSearch.toLowerCase();
    return !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
  });

  const stats = [
    { label: 'Total Users',   value: allUsers.length || '—', icon: Users,    color: 'text-blue-500', bg: 'bg-blue-50'    },
    { label: 'Pending Roles', value: roleRequests.length,    icon: Shield,   color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Flagged Posts', value: flaggedPosts.length,    icon: Flag,     color: 'text-red-500', bg: 'bg-red-50'       },
    { label: 'Active Users',  value: allUsers.filter(u => u.profileStatus !== 'suspended').length || '—', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-5">
      
      {/* Admin Sidebar */}
      <div className="md:w-56 flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm p-4 h-fit sticky top-20">
        <h2 className="font-bold text-slate-900 mb-5 text-base px-1">Admin Panel</h2>
        <nav className="space-y-0.5">
          <SidebarItem icon={Activity} label="Overview"      id="overview"  activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem icon={Shield}   label="Role Queue"    id="review"    activeTab={activeTab} setActiveTab={setActiveTab} badge={roleRequests.length} />
          <SidebarItem icon={Users}    label="Accounts"      id="accounts"  activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem icon={Flag}     label="Flagged Posts" id="flags"     activeTab={activeTab} setActiveTab={setActiveTab} badge={flaggedPosts.length} />
          <SidebarItem icon={Key}      label="Admin Access"  id="admins"    activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-5">
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${s.bg}`}><Icon className={`w-5 h-5 ${s.color}`} /></div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Role Queue Tab */}
        {(activeTab === 'overview' || activeTab === 'review') && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Role Change Requests</h2>
              <p className="text-sm text-slate-500">Pending user role upgrades</p>
            </div>
            <div className="overflow-x-auto">
              {roleRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-medium">No pending requests</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested Role</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Justification</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roleRequests.map(req => {
                      const isProcessing = processingId === req.id || processingId === req.id + '_reject';
                      return (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-500 font-mono">{req.userId?.slice(0, 8)}...</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                              {req.requestedRole}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                            <p className="line-clamp-2">{req.justification || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <button onClick={() => handleApproveRole(req)} disabled={isProcessing}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 disabled:opacity-50" title="Approve">
                              {isProcessing && processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleRejectRole(req)} disabled={isProcessing}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 disabled:opacity-50" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <h2 className="font-bold text-slate-900">All Accounts</h2>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => {
                    const isSuspended = user.profileStatus === 'suspended';
                    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
                    const isProcessing = processingId === user.id + '_suspend' || processingId === user.id + '_activate';
                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Link to={`/profile/${user.id}`}>
                              <Avatar src={user.avatarUrl} name={name} size="sm" className="hover:opacity-90 transition-opacity" />
                            </Link>
                            <div>
                              <Link to={`/profile/${user.id}`} className="hover:text-primary-600 transition-colors">
                                <p className="font-semibold text-slate-900 text-sm">{name}</p>
                              </Link>
                              <p className="text-xs text-slate-500">{user.email || user.contactEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{user.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSuspended ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                            {user.profileStatus || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => isSuspended ? handleActivate(user.id) : handleSuspend(user.id)}
                            disabled={isProcessing}
                            className={`p-1.5 rounded-lg border border-transparent transition-colors disabled:opacity-50 ${
                              isSuspended ? 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200' : 'text-red-600 hover:bg-red-50 hover:border-red-200'
                            }`}
                            title={isSuspended ? 'Activate' : 'Suspend'}
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> :
                             isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">No users match your search.</div>
              )}
            </div>
          </div>
        )}

        {/* Flagged Content Tab */}
        {activeTab === 'flags' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-slate-900 mb-4">Flagged Content</h2>
            {flaggedPosts.length === 0 ? (
              <div className="text-center py-12">
                <Flag className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No flagged content</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedPosts.map(post => (
                  <div key={post.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Flag className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 line-clamp-2">{post.content}</p>
                      <p className="text-xs text-slate-400 mt-1">Post ID: {post.id}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 flex-shrink-0">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Admins Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-5">
            {/* Promote Form */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-slate-900 mb-1">Promote User to Admin</h2>
              <p className="text-sm text-slate-500 mb-4">Grant full backend access to an existing user via their connected email.</p>
              <form onSubmit={handleMakeAdmin} className="flex gap-3">
                <input
                  type="email"
                  required
                  placeholder="user@shiaconnection.com"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={processingId === 'make_admin' || !newAdminEmail}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {processingId === 'make_admin' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Promote
                </button>
              </form>
            </div>

            {/* Admin Directory */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-900">Current Admins</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {adminList.map(adminUser => (
                  <div key={adminUser.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${adminUser.type === 'super_admin' ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                          {adminUser.name}
                          {adminUser.type === 'super_admin' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-widest">SuperAdmin</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{adminUser.email}</p>
                      </div>
                    </div>
                    {/* Only super admins can see the revoke button */}
                    {isSuperAdmin && adminUser.type !== 'super_admin' && (
                      <button
                        onClick={() => handleRemoveAdmin(adminUser.id)}
                        disabled={processingId === adminUser.id + '_remove_admin'}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === adminUser.id + '_remove_admin' ? 'Revoking...' : 'Revoke'}
                      </button>
                    )}
                  </div>
                ))}
                {adminList.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">No admins found in directory.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, id, activeTab, setActiveTab, badge }) {
  const active = activeTab === id;
  return (
    <button onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
        {label}
      </div>
      {!!badge && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-700'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
