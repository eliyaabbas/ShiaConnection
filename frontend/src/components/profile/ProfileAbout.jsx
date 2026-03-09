import { PenSquare } from 'lucide-react';

export default function ProfileAbout({ 
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
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-slate-900">About</h2>
        {isOwnProfile && editingField !== 'about' && (
          <button 
            onClick={() => { setEditData({ about: profile.about || '' }); setEditingField('about'); }} 
            className="text-slate-400 hover:text-primary-600 p-1.5 hover:bg-primary-50 rounded"
          >
            <PenSquare className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {editingField === 'about' ? (
        <div className="space-y-2">
          <textarea 
            value={editData.about || ''} 
            onChange={e => setEditData({ ...editData, about: e.target.value })}
            rows={5} 
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" 
          />
          <div className="flex gap-2">
            <button 
              onClick={async () => { await saveField('about', editData.about); setEditingField(null); }} 
              className="px-4 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700"
            >
              Save
            </button>
            <button 
              onClick={() => setEditingField(null)} 
              className="px-4 py-1.5 border border-slate-300 text-slate-600 text-sm font-semibold rounded-full hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {profile.about || (isOwnProfile ? <span className="text-slate-400 italic">Write something about yourself...</span> : 'No bio yet.')}
        </p>
      )}
    </div>
  );
}
