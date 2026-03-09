import { Star, Plus, Check, X } from 'lucide-react';

export default function ProfileSkills({
  profile,
  isOwnProfile,
  addingSkill,
  setAddingSkill,
  newSkill,
  setNewSkill,
  handleAddSkill,
  handleRemoveSkill
}) {
  if (!profile) return null;

  // Skills can be stored either as plain strings or as {skillName, proficiencyLevel, _id} objects
  const rawSkills = profile.skills || [];
  const normalizedSkills = rawSkills.map(s =>
    typeof s === 'string' ? { label: s, key: s } : { label: s.skillName || s.name || JSON.stringify(s), key: s._id || s.skillName || JSON.stringify(s) }
  );

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Star className="w-4 h-4 text-primary-600" /> Skills
        </h2>
        {isOwnProfile && (
          <button 
            onClick={() => setAddingSkill(true)} 
            className="text-primary-600 hover:bg-primary-50 p-1.5 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {addingSkill && (
        <div className="flex gap-2 mb-4">
          <input 
            placeholder="Ex: React, Strategy..." 
            value={newSkill} 
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 min-w-0" 
          />
          <button 
            onClick={handleAddSkill} 
            className="px-2.5 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex-shrink-0"
          >
            <Check className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setAddingSkill(false)} 
            className="px-2.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {normalizedSkills.length === 0 && <p className="text-slate-400 text-sm italic">No skills added yet.</p>}
        {normalizedSkills.map(skill => (
          <span key={skill.key} className="flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold hover:border-slate-300 transition-colors">
            {skill.label}
            {isOwnProfile && (
              <button onClick={() => handleRemoveSkill(typeof profile.skills[0] === 'string' ? skill.label : profile.skills.find(s => (s._id || s.skillName) === skill.key))} className="hover:text-red-500 ml-1 leading-none">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
