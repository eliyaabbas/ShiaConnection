import { AlertCircle } from 'lucide-react';

export default function ProfileCompleteness({ profile, isOwnProfile }) {
  if (!isOwnProfile || !profile) return null;

  let completenessScore = 0;
  let missingItems = [];
  
  if (profile.avatarUrl) completenessScore += 20; else missingItems.push('Profile Photo');
  if (profile.about) completenessScore += 20; else missingItems.push('About Summary');
  if (profile.experience?.length) completenessScore += 20; else missingItems.push('Experience');
  if (profile.education?.length) completenessScore += 20; else missingItems.push('Education');
  if (profile.skills?.length) completenessScore += 20; else missingItems.push('Skills');

  if (completenessScore >= 100) return null;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-200 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 bg-amber-100 p-1.5 rounded-full text-amber-600">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-slate-900 font-bold mb-1">
            Profile Strength: {['Beginner', 'Intermediate', 'Advanced', 'Expert'][Math.floor(completenessScore/25)]}
          </h3>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${completenessScore}%` }} />
          </div>
          <p className="text-sm text-slate-600">
            You're missing: <span className="font-medium text-slate-800">{missingItems.join(', ')}</span>. Profiles with these details get 5x more views!
          </p>
        </div>
      </div>
    </div>
  );
}
