import { AlertTriangle, Loader2 } from 'lucide-react';

export default function AccountInfo({
  currentUser,
  userProfile,
  location,
  setLocation,
  savingLocation,
  handleSaveLocation,
  handleSignOut
}) {
  const inputClass = "w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-lg font-bold text-slate-900 mb-5">Account Information</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p>
          <p className="text-slate-800 font-medium">{currentUser.email}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Role</p>
          <p className="text-slate-800 font-medium">{userProfile?.role || '—'}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Status</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            userProfile?.profileStatus === 'active' || userProfile?.profileStatus === 'completed'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {userProfile?.profileStatus || 'active'}
          </span>
        </div>

        <form onSubmit={handleSaveLocation} className="space-y-2">
          <label className={labelClass}>Location</label>
          <div className="flex gap-2">
            <input 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
              placeholder="e.g. Mumbai, India" 
              className={`${inputClass} flex-1`} 
            />
            <button 
              type="submit" 
              disabled={savingLocation} 
              className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-70 flex items-center gap-2"
            >
              {savingLocation && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Danger Zone
        </h3>
        <button 
          onClick={handleSignOut} 
          className="px-4 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
