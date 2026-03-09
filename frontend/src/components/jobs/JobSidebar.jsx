import { ChevronRight, Plus } from 'lucide-react';

export default function JobSidebar({ isRecruiter, setShowPostForm }) {
  return (
    <div className="hidden md:block col-span-1 space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h2 className="font-bold text-slate-900 text-base mb-4">Manage</h2>
        <ul className="space-y-2 text-sm font-medium text-slate-700">
          <li className="flex items-center justify-between hover:text-primary-600 cursor-pointer py-1.5">
            <span>My Applications</span> <ChevronRight className="w-4 h-4" />
          </li>
          <li className="flex items-center justify-between hover:text-primary-600 cursor-pointer py-1.5">
            <span>Saved Jobs</span> <ChevronRight className="w-4 h-4" />
          </li>
          <li className="flex items-center justify-between hover:text-primary-600 cursor-pointer py-1.5">
            <span>Job Alerts</span> <ChevronRight className="w-4 h-4" />
          </li>
        </ul>
      </div>
      
      {isRecruiter && (
        <button
          onClick={() => setShowPostForm(true)}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-bold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Post a Job
        </button>
      )}
    </div>
  );
}
