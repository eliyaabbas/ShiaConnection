import { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';

export default function ApplyModal({ job, onClose, onSubmit, applying }) {
  const [coverNote, setCoverNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(job.id, coverNote);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Apply to {job.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{job.company} · {job.location}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cover Note <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              value={coverNote}
              onChange={e => setCoverNote(e.target.value)}
              placeholder="Briefly explain why you're a great fit..."
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none bg-slate-50"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={applying} className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {applying ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
