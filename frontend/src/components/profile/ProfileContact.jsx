import { PenSquare, Mail, Phone, Linkedin } from 'lucide-react';

export default function ProfileContact({
  profile,
  isOwnProfile,
  editingField,
  setEditingField,
  editData,
  setEditData,
  saveField
}) {
  if (!profile) return null;
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-900">Contact Info</h2>
        {isOwnProfile && editingField !== 'contact' && (
          <button 
            onClick={() => { setEditData({ phone: profile.phone || '', linkedin: profile.linkedin || '' }); setEditingField('contact'); }} 
            className="text-slate-400 hover:text-primary-600 p-1.5 hover:bg-primary-50 rounded text-sm"
          >
            <PenSquare className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {editingField === 'contact' ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Phone Number</label>
            <input 
              value={editData.phone || ''} 
              onChange={e => setEditData({ ...editData, phone: e.target.value })} 
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">LinkedIn Profile URL</label>
            <input 
              type="url" 
              value={editData.linkedin || ''} 
              onChange={e => setEditData({ ...editData, linkedin: e.target.value })} 
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" 
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={async () => { await saveField('phone', editData.phone); await saveField('linkedin', editData.linkedin); setEditingField(null); }} 
              className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-md hover:bg-primary-700"
            >
              Save
            </button>
            <button 
              onClick={() => setEditingField(null)} 
              className="px-3 py-1 border border-slate-300 text-slate-600 text-xs font-semibold rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-full text-slate-600"><Mail className="w-4 h-4"/></div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-slate-500 font-semibold mb-0.5">Email</p>
              <a href={`mailto:${profile.email}`} className="text-primary-600 hover:underline truncate block">{profile.email}</a>
            </div>
          </div>
          {profile.phone && (
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-full text-slate-600"><Phone className="w-4 h-4"/></div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Phone</p>
                <p className="text-slate-800">{profile.phone}</p>
              </div>
            </div>
          )}
          {profile.linkedin && (
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-full text-blue-600"><Linkedin className="w-4 h-4"/></div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-slate-500 font-semibold mb-0.5">LinkedIn</p>
                <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline truncate block">{profile.linkedin}</a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
