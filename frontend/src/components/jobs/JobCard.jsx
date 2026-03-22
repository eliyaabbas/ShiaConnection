import { Building, Clock, Loader2, CheckCircle, Users } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/time';

export default function JobCard({ job, currentUser, isApplied, isApplying, onApply, isRecruiterOwner, loadingApplicants, onViewApplicants }) {
  const postedAt = job.postedAt?.seconds ? formatDistanceToNow(job.postedAt.seconds * 1000) : '';

  return (
    <div className="group flex gap-4 pb-5 border-b border-slate-100 last:border-0 last:pb-0">
      <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-100">
        <Building className="w-6 h-6 text-primary-500" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-900 group-hover:text-primary-600 cursor-pointer transition-colors">{job.title}</h3>
        <p className="text-sm font-medium text-slate-700 mt-0.5">{job.company}</p>
        <p className="text-sm text-slate-500 mt-0.5">{job.location} • {job.type}</p>
        {job.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{job.description}</p>}
        <div className="flex items-center gap-3 mt-3">
          {postedAt && (
            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{postedAt}</span>
            </div>
          )}
          {job.recruiterId !== currentUser.uid && (
            <button
              onClick={() => !isApplied && onApply(job.id)}
              disabled={isApplied || isApplying}
              className={`ml-auto px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${
                isApplied
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                  : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
              }`}
            >
              {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
               isApplied ? <><CheckCircle className="w-3.5 h-3.5" /> Applied</> : 'Easy Apply'}
            </button>
          )}
          {isRecruiterOwner && (
            <button
              onClick={onViewApplicants}
              className="ml-auto px-4 py-1.5 rounded-full text-sm font-bold border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              {loadingApplicants ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              Applicants
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
