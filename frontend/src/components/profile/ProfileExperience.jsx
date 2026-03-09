import { Briefcase, Plus, PenSquare, X } from 'lucide-react';

export default function ProfileExperience({
  profile,
  isOwnProfile,
  editingCollection,
  setEditingCollection,
  collectionForm,
  setCollectionForm,
  handleSaveCollection,
  handleRemoveCollectionItem
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary-600" /> Experience
        </h2>
        {isOwnProfile && (
          <button 
            onClick={() => { 
              setCollectionForm({ title: '', company: '', period: '', description: '' }); 
              setEditingCollection({ type: 'experience', item: null }); 
            }} 
            className="text-primary-600 hover:bg-primary-50 p-1.5 rounded transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {editingCollection?.type === 'experience' && isOwnProfile && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <input 
            placeholder="Title / Role" 
            value={collectionForm.title || ''} 
            onChange={e => setCollectionForm(p => ({...p, title: e.target.value}))} 
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
          />
          <input 
            placeholder="Company / Organization" 
            value={collectionForm.company || ''} 
            onChange={e => setCollectionForm(p => ({...p, company: e.target.value}))} 
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
          />
          <input 
            placeholder="Period (e.g. Jan 2022 - Present)" 
            value={collectionForm.period || ''} 
            onChange={e => setCollectionForm(p => ({...p, period: e.target.value}))} 
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
          />
          <textarea 
            placeholder="Description" 
            value={collectionForm.description || ''} 
            onChange={e => setCollectionForm(p => ({...p, description: e.target.value}))} 
            rows={3} 
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none" 
          />
          <div className="flex gap-2 pt-1">
            <button 
              onClick={handleSaveCollection} 
              className="px-4 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700"
            >
              Save
            </button>
            <button 
              onClick={() => setEditingCollection(null)} 
              className="px-4 py-1.5 border border-slate-300 text-sm font-semibold rounded-full hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {(profile.experience || []).length === 0 && <p className="text-slate-400 text-sm italic">No experience added yet.</p>}
        {(profile.experience || []).map(exp => (
          <div key={exp.id} className="flex gap-4 group">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex-1 pb-6 border-b border-slate-100 group-last:border-0 group-last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{exp.title}</h3>
                  <p className="text-sm font-medium text-slate-700">{exp.company}</p>
                  {exp.period && <p className="text-xs text-slate-500 mt-0.5">{exp.period}</p>}
                </div>
                {isOwnProfile && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setCollectionForm(exp); setEditingCollection({ type: 'experience', item: exp }); }} 
                      className="p-1.5 text-slate-400 hover:text-primary-600"
                    >
                      <PenSquare className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleRemoveCollectionItem('experience', exp.id)} 
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {exp.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{exp.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
