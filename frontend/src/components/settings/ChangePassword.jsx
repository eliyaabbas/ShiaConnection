import { Loader2 } from 'lucide-react';

export default function ChangePassword({
  pwForm,
  setPwForm,
  changingPw,
  handleChangePassword
}) {
  const inputClass = "w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-lg font-bold text-slate-900 mb-5">Change Password</h2>
      <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
        <div>
          <label className={labelClass}>Current Password</label>
          <input 
            type="password" 
            value={pwForm.currentPw} 
            onChange={e => setPwForm(p => ({...p, currentPw: e.target.value}))} 
            className={inputClass} 
            required 
          />
        </div>
        <div>
          <label className={labelClass}>New Password</label>
          <input 
            type="password" 
            value={pwForm.newPw} 
            onChange={e => setPwForm(p => ({...p, newPw: e.target.value}))} 
            className={inputClass} 
            required 
            minLength={6} 
          />
        </div>
        <div>
          <label className={labelClass}>Confirm New Password</label>
          <input 
            type="password" 
            value={pwForm.confirmPw} 
            onChange={e => setPwForm(p => ({...p, confirmPw: e.target.value}))} 
            className={inputClass} 
            required 
          />
        </div>
        <button 
          type="submit" 
          disabled={changingPw} 
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {changingPw && <Loader2 className="w-4 h-4 animate-spin" />}
          {changingPw ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
