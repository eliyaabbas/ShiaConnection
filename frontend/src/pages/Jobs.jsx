import { useState, useEffect } from 'react';
import { Search, MapPin, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getJobs, applyToJob, hasApplied, getJobApplications, getUserProfile } from '../services/db';
import JobSidebar from '../components/jobs/JobSidebar';
import JobPostForm from '../components/jobs/JobPostForm';
import JobCard from '../components/jobs/JobCard';
import Avatar from '../components/ui/Avatar';
import ApplyModal from '../components/jobs/ApplyModal';

export default function Jobs() {
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();
  const isRecruiter = userProfile?.role === 'Recruiter';

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);
  const [applyingJob, setApplyingJob] = useState(null); // job object for modal
  const [applicantsMap, setApplicantsMap] = useState({});
  const [loadingApplicantsId, setLoadingApplicantsId] = useState(null);

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await getJobs(50);
    if (data) {
      setJobs(data);
      // Check which jobs the user has already applied to
      const appliedChecks = await Promise.all(data.map(j => hasApplied(j.id, currentUser.uid)));
      const applied = new Set(data.filter((_, i) => appliedChecks[i]).map(j => j.id));
      setAppliedJobs(applied);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.uid]);

  const filteredJobs = jobs.filter(j => {
    const q = search.toLowerCase();
    const loc = locationFilter.toLowerCase();
    const matchQ = !q || j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q);
    const matchLoc = !loc || j.location?.toLowerCase().includes(loc);
    return matchQ && matchLoc;
  });

  const handleApply = async (jobId, coverNote = '') => {
    setApplyingId(jobId);
    const { success, error } = await applyToJob(jobId, currentUser.uid, coverNote);
    if (success) {
      setAppliedJobs(prev => new Set([...prev, jobId]));
      toast.success('Application submitted!');
      setApplyingJob(null);
    } else {
      toast.error(error || 'Failed to apply');
    }
    setApplyingId(null);
  };

  const handleViewApplicants = async (jobId) => {
    if (applicantsMap[jobId]) {
      // Toggle view
      setApplicantsMap(prev => { const n = {...prev}; delete n[jobId]; return n; });
      return;
    }
    setLoadingApplicantsId(jobId);
    const { data: apps } = await getJobApplications(jobId);
    const profiles = await Promise.all(
      (apps || []).map(async app => {
        const { data } = await getUserProfile(app.applicantId);
        return { ...app, profile: data };
      })
    );
    setApplicantsMap(prev => ({ ...prev, [jobId]: profiles }));
    setLoadingApplicantsId(null);
  };

  const openApplyModal = (job) => {
    if (appliedJobs.has(job.id)) return;
    setApplyingJob(job);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {applyingJob && (
        <ApplyModal
          job={applyingJob}
          onClose={() => setApplyingJob(null)}
          onSubmit={handleApply}
          applying={applyingId === applyingJob?.id}
        />
      )}
      {/* Left Sidebar */}
      <JobSidebar isRecruiter={isRecruiter} setShowPostForm={setShowPostForm} />

      {/* Main Content */}
      <div className="col-span-1 md:col-span-3 space-y-5">
        
        {/* Mobile Post Button */}
        {isRecruiter && (
          <button onClick={() => setShowPostForm(true)} className="md:hidden w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-primary-600 text-white rounded-full text-sm font-bold">
            <Plus className="w-4 h-4" /> Post a Job
          </button>
        )}

        {/* Post Job Form */}
        {showPostForm && (
          <JobPostForm 
            currentUser={currentUser} 
            onClose={() => setShowPostForm(false)} 
            onPostSuccess={loadJobs} 
          />
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search jobs, titles, or companies..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm" />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="City or Remote" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm" />
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {search || locationFilter ? 'Search Results' : 'Recommended for you'}
          </h2>
          <p className="text-sm text-slate-500 mb-5">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found</p>

          {loading && (
            <div className="space-y-5">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse pb-5 border-b border-slate-100">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-48" />
                    <div className="h-3 bg-slate-200 rounded w-32" />
                    <div className="h-3 bg-slate-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">💼</p>
              <p className="font-semibold text-slate-700">No jobs found</p>
              <p className="text-sm text-slate-500 mt-1">{isRecruiter ? 'Post the first job!' : 'Try different search terms'}</p>
            </div>
          )}

          <div className="space-y-5">
            {filteredJobs.map(job => (
              <div key={job.id}>
                <JobCard 
                  job={job} 
                  currentUser={currentUser}
                  isApplied={appliedJobs.has(job.id)}
                  isApplying={applyingId === job.id}
                  onApply={() => openApplyModal(job)}
                  isRecruiterOwner={isRecruiter && job.recruiterId === currentUser.uid}
                  loadingApplicants={loadingApplicantsId === job.id}
                  onViewApplicants={() => handleViewApplicants(job.id)}
                />
                {applicantsMap[job.id] && (
                  <div className="mt-3 ml-4 border-l-2 border-primary-200 pl-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{applicantsMap[job.id].length} Applicant{applicantsMap[job.id].length !== 1 ? 's' : ''}</p>
                    {applicantsMap[job.id].length === 0 && <p className="text-sm text-slate-500">No applications yet.</p>}
                    {applicantsMap[job.id].map(app => {
                      const p = app.profile;
                      const name = p ? `${p.firstName} ${p.lastName}` : app.applicantId;
                      return (
                        <div key={app.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                          <Avatar src={p?.avatarUrl} name={name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                            <p className="text-xs text-slate-500">{p?.role || 'Applicant'} • Applied {app.appliedAt?.seconds ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString() : 'recently'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
