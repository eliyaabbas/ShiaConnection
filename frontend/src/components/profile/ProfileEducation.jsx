import { GraduationCap, Plus, PenSquare, X } from 'lucide-react';

export default function ProfileEducation({
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
          <GraduationCap className="w-5 h-5 text-primary-600" /> Education
        </h2>
        {isOwnProfile && (
          <button 
            onClick={() => { 
              setCollectionForm({ school: '', degree: '', field: '', period: '' }); 
              setEditingCollection({ type: 'education', item: null }); 
            }} 
            className="text-primary-600 hover:bg-primary-50 p-1.5 rounded transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {editingCollection?.type === 'education' && isOwnProfile && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <input 
            placeholder="School / University" 
            value={collectionForm.school || ''} 
            onChange={e => setCollectionForm(p => ({...p, school: e.target.value}))} 
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
          />
          <div className="flex gap-2">
            <input 
              placeholder="Degree (e.g. BS)" 
              value={collectionForm.degree || ''} 
              onChange={e => setCollectionForm(p => ({...p, degree: e.target.value}))} 
              className="w-1/3 px-3 py-2 text-sm border border-slate-300 rounded-lg" 
            />
            <input 
              placeholder="Field of Study (e.g. Computer Science)" 
              value={collectionForm.field || ''} 
              onChange={e => setCollectionForm(p => ({...p, field: e.target.value}))} 
              className="w-2/3 px-3 py-2 text-sm border border-slate-300 rounded-lg" 
            />
          </div>
          <input 
            placeholder="Period (e.g. 2018 - 2022)" 
            value={collectionForm.period || ''} 
            onChange={e => setCollectionForm(p => ({...p, period: e.target.value}))} 
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
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
        {(profile.education || []).length === 0 && <p className="text-slate-400 text-sm italic">No education added yet.</p>}
        {(profile.education || []).map(edu => (
          <div key={edu.id} className="flex gap-4 group">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex-1 pb-6 border-b border-slate-100 group-last:border-0 group-last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{edu.school}</h3>
                  {edu.degree && <p className="text-sm font-medium text-slate-700">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>}
                  {edu.period && <p className="text-xs text-slate-500 mt-0.5">{edu.period}</p>}
                </div>
                {isOwnProfile && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setCollectionForm(edu); setEditingCollection({ type: 'education', item: edu }); }} 
                      className="p-1.5 text-slate-400 hover:text-primary-600"
                    >
                      <PenSquare className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleRemoveCollectionItem('education', edu.id)} 
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
