import { Award, Plus, X } from 'lucide-react';

export default function ProfileCertifications({
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
          <Award className="w-5 h-5 text-primary-600" /> Licenses & Certifications
        </h2>
        {isOwnProfile && (
          <button 
            onClick={() => { 
              setCollectionForm({ name: '', issuer: '', issueDate: '', url: '' }); 
              setEditingCollection({ type: 'certifications', item: null }); 
            }} 
            className="text-primary-600 hover:bg-primary-50 p-1.5 rounded transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {editingCollection?.type === 'certifications' && isOwnProfile && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <input 
            placeholder="Certification Name" 
            value={collectionForm.name || ''} 
            onChange={e => setCollectionForm(p => ({...p, name: e.target.value}))} 
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
          />
          <input 
            placeholder="Issuing Organization" 
            value={collectionForm.issuer || ''} 
            onChange={e => setCollectionForm(p => ({...p, issuer: e.target.value}))} 
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" 
          />
          <div className="flex gap-2">
            <input 
              placeholder="Issue Date (e.g. Aug 2023)" 
              value={collectionForm.issueDate || ''} 
              onChange={e => setCollectionForm(p => ({...p, issueDate: e.target.value}))} 
              className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg" 
            />
            <input 
              placeholder="Credential URL (optional)" 
              type="url" 
              value={collectionForm.url || ''} 
              onChange={e => setCollectionForm(p => ({...p, url: e.target.value}))} 
              className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg" 
            />
          </div>
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

      <div className="space-y-4">
        {(profile.certifications || []).length === 0 && <p className="text-slate-400 text-sm italic">No certifications added yet.</p>}
        {(profile.certifications || []).map(cert => (
          <div key={cert.id} className="flex gap-3 group border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-sm">{cert.name}</h3>
              <p className="text-sm text-slate-600">{cert.issuer}</p>
              {cert.issueDate && <p className="text-xs text-slate-500 mt-1">Issued {cert.issueDate}</p>}
              {cert.url && <a href={cert.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary-600 mt-2 hover:underline flex items-center gap-1">Show Credential</a>}
            </div>
            {isOwnProfile && (
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleRemoveCollectionItem('certifications', cert.id)} 
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
