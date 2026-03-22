import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Briefcase, MessageSquare, Bell, Search, Settings, Bookmark, Star, LogOut, UserCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth';
import { subscribeNotifications, subscribeChats, searchUsers } from '../../services/db';
import Avatar from '../ui/Avatar';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const fullName = userProfile
    ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
    : currentUser?.displayName || 'User';

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeNotifications(currentUser.uid, (notifs) => {
      setUnreadNotifs(notifs.filter(n => !n.read).length);
    });
    return unsub;
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeChats(currentUser.uid, (chats) => {
      const unread = chats.filter(c => c.lastSenderId && c.lastSenderId !== currentUser.uid && !c.readBy?.[currentUser.uid]).length;
      setUnreadChats(unread);
    });
    return unsub;
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/auth');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    const timer = setTimeout(async () => {
      const { data } = await searchUsers(searchQuery, currentUser?.uid);
      setSearchResults(data || []);
      setSearchOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.uid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectResult = (userId) => {
    setSearchQuery('');
    setSearchOpen(false);
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ──────────── Top Header ──────────── */}
      <header className="sticky top-0 z-50 glass h-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">

          {/* Left: Logo + Search */}
          <div className="flex items-center gap-3 lg:gap-6 min-w-0">
            <Link to="/" className="text-lg font-bold tracking-tighter text-primary-600 flex items-center gap-2 flex-shrink-0">
              <img src="/Logo.png" alt="ShiaConnection Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
              <span className="hidden sm:inline">ShiaConnection</span>
            </Link>

            <div ref={searchRef} className="hidden sm:flex relative group w-48 md:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100 hover:bg-slate-200 focus:bg-white border border-transparent focus:border-primary-400 focus:ring-2 focus:ring-primary-100 rounded-full text-sm outline-none transition-all placeholder-slate-400"
              />
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 max-h-72 overflow-y-auto">
                  {searchResults.map(user => (
                    <button key={user.id} onClick={() => handleSelectResult(user.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left">
                      <Avatar src={user.avatarUrl} name={`${user.firstName} ${user.lastName}`} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchOpen && searchResults.length === 0 && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
                  <p className="text-sm text-slate-500 text-center">No results for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Action icons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Link to="/notifications" className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-slate-700 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </Link>
            <Link to="/messages" className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-slate-700 transition-colors">
              <MessageSquare className="w-5 h-5" />
              {unreadChats > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadChats > 9 ? '9+' : unreadChats}
                </span>
              )}
            </Link>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ──────────── Mobile Slide-down Menu ──────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <nav
            className="bg-white w-72 h-full shadow-2xl flex flex-col overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Profile mini */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-primary-50 to-emerald-50">
              <Link to="/profile/me" onClick={() => setMobileMenuOpen(false)}>
                <Avatar src={userProfile?.avatarUrl} name={fullName} size="lg" className="border-2 border-white shadow" />
              </Link>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{fullName}</p>
                <p className="text-xs text-slate-500">{userProfile?.role || 'Member'}</p>
                <p className="text-xs text-primary-600 font-medium">{userProfile?.connectionsCount || 0} connections</p>
              </div>
            </div>

            <div className="px-3 py-4 space-y-0.5 flex-1">
              <MobileMenuItem to="/" icon={<Home className="w-5 h-5" />} label="Home" active={isActive('/')} />
              <MobileMenuItem to="/network" icon={<Users className="w-5 h-5" />} label="My Network" active={isActive('/network')} />
              <MobileMenuItem to="/jobs" icon={<Briefcase className="w-5 h-5" />} label="Jobs" active={isActive('/jobs')} />
              <MobileMenuItem to="/messages" icon={<MessageSquare className="w-5 h-5" />} label="Messages" active={isActive('/messages')} badge={unreadChats} />
              <MobileMenuItem to="/notifications" icon={<Bell className="w-5 h-5" />} label="Notifications" active={isActive('/notifications')} badge={unreadNotifs} />
              <MobileMenuItem to="/profile/me" icon={<UserCircle className="w-5 h-5" />} label="Profile" active={isActive('/profile')} />
              <MobileMenuItem to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" active={isActive('/settings')} />
              <div className="my-2 border-t border-slate-100" />
              <MobileMenuItem to="/saved" icon={<Bookmark className="w-5 h-5" />} label="Saved Items" active={isActive('/saved')} />
            </div>

            <div className="p-3 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ──────────── Main Body ──────────── */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex gap-5">

        {/* Left Sidebar — desktop only */}
        <aside className="hidden md:flex flex-col w-60 lg:w-64 flex-shrink-0 self-start sticky top-[4.5rem]">
          <nav className="glass-card py-3">
            {/* User card */}
            <div className="px-4 pb-4 mb-2 border-b border-slate-100">
              <div className="h-12 bg-gradient-to-r from-primary-400 to-emerald-500 -mx-4 -mt-3 rounded-t-2xl mb-8" />
              <div className="flex justify-center -mt-10 mb-2">
                <Link to="/profile/me">
                  <Avatar
                    src={userProfile?.avatarUrl}
                    name={fullName}
                    size="xl"
                    className="border-4 border-white shadow-md hover:opacity-90 transition-opacity"
                  />
                </Link>
              </div>
              <div className="text-center">
                <Link to="/profile/me" className="font-bold text-slate-900 text-sm leading-tight hover:text-primary-600 transition-colors block truncate">
                  {fullName}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">{userProfile?.role || 'Member'}</p>
                <p className="text-xs text-primary-600 font-semibold border-t border-slate-100 mt-2 pt-2">
                  {userProfile?.connectionsCount || 0} connections
                </p>
              </div>
            </div>

            <ul className="px-2 space-y-0.5">
              <SidebarItem to="/"              icon={<Home         className="w-[18px] h-[18px]" />} label="Home"          active={isActive('/')} />
              <SidebarItem to="/network"       icon={<Users        className="w-[18px] h-[18px]" />} label="My Network"    active={isActive('/network')} />
              <SidebarItem to="/jobs"          icon={<Briefcase    className="w-[18px] h-[18px]" />} label="Jobs"          active={isActive('/jobs')} />
              <SidebarItem to="/messages"      icon={<MessageSquare className="w-[18px] h-[18px]" />} label="Messages"     active={isActive('/messages')} badge={unreadChats || null} />
              <SidebarItem to="/notifications" icon={<Bell         className="w-[18px] h-[18px]" />} label="Notifications" active={isActive('/notifications')} badge={unreadNotifs || null} />
              <SidebarItem to="/profile/me"    icon={<UserCircle   className="w-[18px] h-[18px]" />} label="Profile"       active={isActive('/profile')} />
              <SidebarItem to="/settings"      icon={<Settings     className="w-[18px] h-[18px]" />} label="Settings"      active={isActive('/settings')} />
            </ul>

            <div className="mx-4 my-2 border-t border-slate-100" />

            <ul className="px-2 space-y-0.5">
              <SidebarItem to="/saved"   icon={<Bookmark className="w-[18px] h-[18px]" />} label="Saved Items"  active={isActive('/saved')} />
              <SidebarItem to="/premium" icon={<Star     className="w-[18px] h-[18px] text-amber-500" />} label="Try Premium"
                customColor="text-amber-600 font-semibold" hoverColor="hover:bg-amber-50 hover:text-amber-700" />
            </ul>

            <div className="mx-4 mt-3 border-t border-slate-100 pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Sign Out
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <Outlet />
        </main>

      </div>

      {/* ──────────── Mobile Bottom Tab Bar ──────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/60">
        <div className="flex items-center justify-around px-2 py-1 safe-area-pb">
          <MobileTabItem to="/"          icon={<Home          className="w-5 h-5" />} label="Home"     active={isActive('/')} />
          <MobileTabItem to="/network"   icon={<Users         className="w-5 h-5" />} label="Network"  active={isActive('/network')} />
          <MobileTabItem to="/jobs"      icon={<Briefcase     className="w-5 h-5" />} label="Jobs"     active={isActive('/jobs')} />
          <MobileTabItem to="/messages"  icon={<MessageSquare className="w-5 h-5" />} label="Chats"    active={isActive('/messages')} badge={unreadChats} />
          <MobileTabItem to="/profile/me" icon={<UserCircle   className="w-5 h-5" />} label="Profile"  active={isActive('/profile')} />
        </div>
      </nav>

    </div>
  );
}

function SidebarItem({ icon, label, to, active, badge, customColor, hoverColor }) {
  const baseColor = customColor || 'text-slate-600';
  const hoverState = hoverColor || 'hover:bg-slate-100 hover:text-slate-900';
  const activeClasses = active
    ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
    : `${baseColor} ${hoverState}`;

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeClasses}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </div>
        {badge > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-4">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    </li>
  );
}

function MobileTabItem({ icon, label, to, active, badge }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[3rem] relative ${
        active ? 'text-primary-600' : 'text-slate-400'
      } transition-colors`}
    >
      <div className="relative">
        {icon}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className={`text-[10px] font-medium ${active ? 'text-primary-600' : 'text-slate-400'}`}>{label}</span>
      {active && <div className="absolute -top-1 left-3 right-3 h-0.5 bg-primary-500 rounded-b-full" />}
    </Link>
  );
}

function MobileMenuItem({ icon, label, to, active, badge }) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
