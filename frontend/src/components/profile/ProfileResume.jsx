import { useRef } from 'react';
import { FileText, Download } from 'lucide-react';

export default function ProfileResume({
  profile,
  isOwnProfile,
  uploadingResume,
  handleFileUpload
}) {
  const resumeInputRef = useRef(null);

  if (!profile || !['Professional', 'Scholar'].includes(profile.role)) return null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-base font-bold text-slate-900 mb-3">{profile.role === 'Scholar' ? 'CV' : 'Resume'}</h2>
      {profile.resumeUrl ? (
        <div className="flex flex-col gap-3">
          <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-slate-700">{profile.firstName}_Resume.pdf</span>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
          </a>
          {isOwnProfile && (
            <button onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume} className="text-xs font-semibold text-primary-600 hover:underline flex justify-center w-full">
              {uploadingResume ? 'Uploading...' : 'Upload New Version'}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
          <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 mb-3">No resume uploaded</p>
          {isOwnProfile && (
            <button onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume} className="px-4 py-1.5 bg-white border border-slate-300 shadow-sm rounded-md text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              {uploadingResume ? 'Uploading...' : 'Upload PDF'}
            </button>
          )}
        </div>
      )}
      <input ref={resumeInputRef} type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'resume')} className="hidden" />
    </div>
  );
}
