import { Loader2 } from 'lucide-react';

export default function RequestRoleChange({
  userProfile,
  roleForm,
  setRoleForm,
  requestingRole,
  handleRoleRequest
}) {
  const inputClass = "w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Request Role Change</h2>
      <p className="text-sm text-slate-500 mb-5">
        Current role: <span className="font-semibold text-primary-600">{userProfile?.role}</span>. 
        An admin will review your request.
      </p>
      <form onSubmit={handleRoleRequest} className="space-y-4 max-w-sm">
        <div>
          <label className={labelClass}>Requested Role</label>
          <select 
            value={roleForm.newRole} 
            onChange={e => setRoleForm(p => ({...p, newRole: e.target.value}))} 
            className={`${inputClass} cursor-pointer`} 
            required
          >
            <option value="">Select a role...</option>
            {['Professional', 'Student', 'Recruiter', 'Skilled Worker']
              .filter(r => r !== userProfile?.role)
              .map(r => <option key={r} value={r}>{r}</option>)
            }
          </select>
        </div>
        <div>
          <label className={labelClass}>Justification</label>
          <textarea
            value={roleForm.justification}
            onChange={e => setRoleForm(p => ({...p, justification: e.target.value}))}
            placeholder="Briefly explain why you need this role change..."
            rows={4} 
            className={`${inputClass} resize-none`} 
            required 
            minLength={20}
          />
        </div>
        <button 
          type="submit" 
          disabled={requestingRole} 
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {requestingRole && <Loader2 className="w-4 h-4 animate-spin" />}
          {requestingRole ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
