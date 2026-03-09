import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { createJob } from '../../services/db';

export default function JobPostForm({ currentUser, onClose, onPostSuccess }) {
  const toast = useToast();
  const [jobForm, setJobForm] = useState({ title: '', company: '', location: '', type: 'Full-time', description: '' });
  const [posting, setPosting] = useState(false);

  const handlePostJob = async () => {
    if (!jobForm.title || !jobForm.company || !jobForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    setPosting(true);
    const { success, error } = await createJob(currentUser.uid, jobForm);
    if (success) {
      toast.success('Job posted successfully!');
      onPostSuccess();
      onClose();
    } else {
      toast.error(error || 'Failed to post job');
    }
    setPosting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-slate-900 text-lg">Post a New Job</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1"><X className="w-5 h-5" /></button>
      </div>
      <div className="space-y-3">
        <input placeholder="Job Title *" value={jobForm.title} onChange={e => setJobForm(p => ({...p, title: e.target.value}))} className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300" />
        <input placeholder="Company Name *" value={jobForm.company} onChange={e => setJobForm(p => ({...p, company: e.target.value}))} className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300" />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Location (e.g. Remote)" value={jobForm.location} onChange={e => setJobForm(p => ({...p, location: e.target.value}))} className="px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <select value={jobForm.type} onChange={e => setJobForm(p => ({...p, type: e.target.value}))} className="px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option><option>Remote</option>
          </select>
        </div>
        <textarea placeholder="Job description *" value={jobForm.description} onChange={e => setJobForm(p => ({...p, description: e.target.value}))} rows={4} className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
        <button onClick={handlePostJob} disabled={posting} className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
          {posting && <Loader2 className="w-4 h-4 animate-spin" />}
          {posting ? 'Posting...' : 'Publish Job'}
        </button>
      </div>
    </div>
  );
}
