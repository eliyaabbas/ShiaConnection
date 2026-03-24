import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadAvatar } from '../services/storage';
import { logoutUser } from '../services/auth';
import {
  Briefcase, GraduationCap, User, ChevronRight, ChevronLeft,
  Check, Loader2, Star, Camera, Plus, X, LogOut,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  { id: 'Professional', label: 'Professional', icon: Briefcase, desc: 'Working in a company or self-employed', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'Student', label: 'Student', icon: GraduationCap, desc: 'Currently studying at a university or college', color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'Recruiter', label: 'Recruiter', icon: User, desc: 'Actively hiring for roles at a company or agency', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'Skilled Worker', label: 'Skilled Worker', icon: Star, desc: 'Trade, craft, or technical specialist', color: 'text-amber-600', bg: 'bg-amber-50' },
];

const STEPS = ['Welcome', 'Your Role', 'Core Details', 'Profile', 'Done'];

// Suggested skills by role
const SUGGESTED_SKILLS = {
  Professional:     ['Leadership', 'Project Management', 'Communication', 'Data Analysis', 'Python', 'Excel', 'SQL', 'Marketing', 'Strategy'],
  Student:          ['Research', 'Teamwork', 'Python', 'Data Science', 'Writing', 'Public Speaking', 'Mathematics', 'Programming'],
  Recruiter:        ['Talent Acquisition', 'Interviewing', 'LinkedIn', 'Candidate Sourcing', 'HR Strategy', 'ATS Tools', 'People Management'],
  'Skilled Worker': ['Electrical Work', 'Plumbing', 'Woodworking', 'Masonry', 'Welding', 'Project Estimation', 'Safety Protocols'],
};

const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-700 placeholder-slate-400 shadow-sm";
const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Onboarding() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Optional personal info fields (collected during onboarding)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');

  // Profile enrichment fields
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Redirect if already done & pre-populate optional fields
  useEffect(() => {
    if (!currentUser) { navigate('/auth', { replace: true }); return; }
    if (userProfile?.profileStatus === 'completed') { navigate('/', { replace: true }); return; }
    if (userProfile?.role && !selectedRole) setSelectedRole(userProfile.role);
    // Pre-populate optional personal info from existing profile
    if (userProfile) {
      if (userProfile.firstName && !firstName) setFirstName(userProfile.firstName);
      if (userProfile.lastName && !lastName) setLastName(userProfile.lastName);
      if (userProfile.gender && !gender) setGender(userProfile.gender);
      if (userProfile.phone && !phone) setPhone(userProfile.phone);
    }
  }, [currentUser, userProfile, navigate]);

  // Ensure Firestore doc exists for brand-new users
  useEffect(() => {
    if (!currentUser || step !== 0) return;
    const ensureProfile = async () => {
      const ref = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: currentUser.uid,
          email: currentUser.email || '',
          firstName: currentUser.displayName?.split(' ')[0] || '',
          lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
          role: '',
          profileStatus: 'pending',
          createdAt: new Date(),
        });
        await refreshProfile();
      }
    };
    ensureProfile();
  }, [currentUser, step]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const nextStep = () => { setError(''); setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const prevStep = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  // ─── Skills helpers ───
  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills(prev => [...prev, trimmed]);
    setSkillInput('');
  };
  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s));

  // ─── Avatar helpers ───
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ─── Final Submit (Step 2 → Details saved, then Step 3 → profile/avatar saved) ───
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Use setDoc+merge so it works even if doc doesn't fully exist yet
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...formData,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        phone: phone.trim(),
        role: selectedRole,
        updatedAt: new Date(),
      }, { merge: true });
      await refreshProfile();
      nextStep();
    } catch (err) {
      setError('Failed to save: ' + err.message);
    }
    setLoading(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let avatarUrl = userProfile?.avatarUrl || null;

      if (avatarFile) {
        setUploadingAvatar(true);
        const { url, error: uploadErr } = await uploadAvatar(currentUser.uid, avatarFile);
        setUploadingAvatar(false);
        if (uploadErr) { setError('Avatar upload failed: ' + uploadErr); setLoading(false); return; }
        avatarUrl = url;
      }

      await setDoc(doc(db, 'users', currentUser.uid), {
        headline: headline.trim(),
        about: about.trim(),
        skills,
        ...(avatarUrl && { avatarUrl }),
        profileStatus: 'completed',
        updatedAt: new Date(),
      }, { merge: true });
      await refreshProfile();
      setStep(4);
    } catch (err) {
      setError('Failed to save: ' + err.message);
    }
    setLoading(false);
  };

  const displayName = userProfile?.firstName || currentUser?.displayName?.split(' ')[0] || 'there';

  // ─── Role-specific detail fields ────────────────────────────────────────────
  const renderDetailFields = () => {
    switch (selectedRole) {
      case 'Professional':
        return (
          <>
            <Field label="Current Job Title" name="jobTitle" placeholder="e.g. Senior Software Engineer" onChange={handleChange} icon="💼" />
            <Field label="Current Company / Organization" name="company" placeholder="e.g. Google, Freelance" onChange={handleChange} icon="🏢" />
            <Field label="Years of Experience" name="yearsExperience" type="number" placeholder="e.g. 5" min="0" max="60" onChange={handleChange} icon="📅" />
            <Field label="Location" name="location" placeholder="e.g. Mumbai, India" onChange={handleChange} icon="📍" />
            <Field label="LinkedIn Profile URL" name="linkedIn" type="url" placeholder="https://linkedin.com/in/..." onChange={handleChange} required={false} icon="🔗" />
          </>
        );
      case 'Student':
        return (
          <>
            <Field label="University / College" name="university" placeholder="e.g. Aligarh Muslim University" onChange={handleChange} icon="🎓" />
            <Field label="Degree" name="degree" placeholder="e.g. B.Tech, MBA, PhD" onChange={handleChange} icon="📜" />
            <Field label="Field of Study" name="major" placeholder="e.g. Computer Science" onChange={handleChange} icon="📚" />
            <Field label="Expected Graduation Year" name="graduationYear" type="number" placeholder="e.g. 2026" min="2024" max="2035" onChange={handleChange} icon="📅" />
            <Field label="Location" name="location" placeholder="e.g. Aligarh, UP, India" onChange={handleChange} icon="📍" />
          </>
        );
      case 'Recruiter':
        return (
          <>
            <Field label="Company / Agency Name" name="company" placeholder="e.g. Shia Tech Partners" onChange={handleChange} icon="🏢" />
            <Field label="Your Job Title" name="jobTitle" placeholder="e.g. Talent Acquisition Manager" onChange={handleChange} icon="💼" />
            <Field label="Hiring Region" name="hiringRegion" placeholder="e.g. South Asia, Remote, Middle East" onChange={handleChange} icon="🌍" />
            <Field label="Location" name="location" placeholder="e.g. Dubai, UAE" onChange={handleChange} icon="📍" />
            <Field label="LinkedIn Profile URL" name="linkedIn" type="url" placeholder="https://linkedin.com/in/..." onChange={handleChange} required={false} icon="🔗" />
          </>
        );
      case 'Skilled Worker':
        return (
          <>
            <Field label="Primary Trade or Skill" name="trade" placeholder="e.g. Electrician, Carpenter, Welder" onChange={handleChange} icon="🔧" />
            <Field label="Years of Experience" name="yearsExperience" type="number" placeholder="e.g. 10" min="0" max="60" onChange={handleChange} icon="📅" />
            <Field label="Location" name="location" placeholder="e.g. Lucknow, India" onChange={handleChange} icon="📍" />
            <div>
              <label className={labelClass}>Availability</label>
              <select name="availability" onChange={handleChange} className={`${inputClass} cursor-pointer`} required>
                <option value="">Select availability...</option>
                <option value="Available now">Available now</option>
                <option value="Open to offers">Open to offers</option>
                <option value="Currently busy">Currently busy</option>
              </select>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex flex-col">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="bg-primary-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm">✓</span>
          <span className="font-bold text-slate-900 text-lg tracking-tight">ShiaConnection</span>
        </div>

        {/* Step progress */}
        <div className="hidden sm:flex items-center gap-1.5">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`relative flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300 ${
                i < step  ? 'bg-primary-600 text-white shadow-sm' :
                i === step ? 'ring-2 ring-primary-500 bg-primary-50 text-primary-700' :
                'bg-slate-200 text-slate-400'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`hidden lg:block text-xs font-medium mr-1 ${i === step ? 'text-primary-600' : 'text-slate-400'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`w-5 h-0.5 rounded-full ${i < step ? 'bg-primary-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400">Step {step + 1} / {STEPS.length}</span>
          <button
            onClick={async () => { await logoutUser(); navigate('/auth', { replace: true }); }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* ══════════════════════════════════════════════
              STEP 0 — WELCOME
          ══════════════════════════════════════════════ */}
          {step === 0 && (
            <div className="text-center fade-in-up">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-100 mb-6 text-5xl">👋</div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Welcome, {displayName}!</h1>
              <p className="text-lg text-slate-500 mb-10 max-w-md mx-auto">
                Let's build your ShiaConnection profile in just a few steps. It only takes 2 minutes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
                {[
                  { icon: '🤝', label: 'Build your Network', desc: 'Connect with professionals in the community' },
                  { icon: '💼', label: 'Find Opportunities', desc: 'Discover jobs matched to your profile' },
                  { icon: '🌍', label: 'Grow Together', desc: 'Share knowledge and uplift the community' },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="font-bold text-slate-800 text-sm">{item.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={nextStep} className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-full shadow-lg transition-all flex items-center gap-2 mx-auto">
                Get Started <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 1 — ROLE SELECTION
          ══════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">What best describes you?</h2>
                <p className="text-slate-500">We'll personalize your feed, jobs, and network based on this.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {ROLES.map(role => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isSelected ? 'bg-primary-600' : role.bg}`}>
                        <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : role.color}`} />
                      </div>
                      <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-primary-700' : 'text-slate-800'}`}>{role.label}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={prevStep} className="flex items-center gap-2 px-5 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-full hover:bg-slate-50 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={nextStep} disabled={!selectedRole}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm">
                  Continue as {selectedRole || '...'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 2 — CORE DETAILS (role-specific)
          ══════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="fade-in-up">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                  {(() => { const r = ROLES.find(r => r.id === selectedRole); const Icon = r?.icon || User; return <Icon className="w-8 h-8 text-primary-600" />; })()}
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-1">{selectedRole} Details</h2>
                <p className="text-slate-500 text-sm">Tell us about your professional background.</p>
              </div>

              {error && <div className="mb-5 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

              <form onSubmit={handleDetailsSubmit} className="space-y-5">

                {/* ─── Optional Personal Info ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Complete Your Profile <span className="text-slate-400 font-normal normal-case">(optional)</span></h3>
                    <p className="text-xs text-slate-500 mt-1">Help others know you better. You can skip these and fill later.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>
                        <span className="mr-1.5">👤</span>First Name
                      </label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                        placeholder="e.g. Ali" className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <span className="mr-1.5">👤</span>Last Name
                      </label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                        placeholder="e.g. Hussain" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <span className="mr-1.5">📱</span>Phone Number
                      </label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+91 9876543210" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <span className="mr-1.5">⚧</span>Gender
                      </label>
                      <select value={gender} onChange={e => setGender(e.target.value)} className={`${inputClass} cursor-pointer`}>
                        <option value="">Prefer not to say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ─── Role-specific Fields ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-5">
                  {renderDetailFields()}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={prevStep} className="flex items-center gap-2 px-5 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-full hover:bg-slate-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <>Next: Profile <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 3 — PROFILE ENRICHMENT (photo, headline, bio, skills)
          ══════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="fade-in-up">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-1">Your Public Profile</h2>
                <p className="text-slate-500 text-sm">A great profile gets 5× more views. All fields are optional here.</p>
              </div>

              {error && <div className="mb-5 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

              <form onSubmit={handleProfileSubmit} className="space-y-5">

                {/* ─── Profile Photo ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Profile Photo</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center">
                        {avatarPreview
                          ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                          : <span className="text-white text-3xl font-bold">{displayName[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full border-2 border-white transition-colors shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <div className="text-sm text-slate-500 leading-relaxed">
                      <p className="font-semibold text-slate-700 mb-1">Upload a clear, professional photo</p>
                      <p>JPG, PNG or WEBP · Max 5 MB</p>
                      {avatarPreview && <p className="text-emerald-600 font-semibold mt-1">✓ Photo selected</p>}
                    </div>
                  </div>
                </div>

                {/* ─── Headline ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Headline</h3>
                  <p className="text-xs text-slate-500 mb-3">Shown under your name everywhere on the platform.</p>
                  <input
                    type="text"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder={
                      selectedRole === 'Professional'   ? 'e.g. Senior Engineer at Apple | Open to opportunities' :
                      selectedRole === 'Student'        ? 'e.g. Computer Science student at AMU | Seeking internships' :
                      selectedRole === 'Recruiter'      ? 'e.g. Talent Acquisition @ TechCorp | Hiring in India & UAE' :
                      'e.g. Master Electrician | 15 years experience | Lucknow'
                    }
                    maxLength={120}
                    className={inputClass}
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{headline.length}/120</p>
                </div>

                {/* ─── Bio / About ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">About You</h3>
                  <p className="text-xs text-slate-500 mb-3">Write a brief bio that tells people who you are.</p>
                  <textarea
                    value={about}
                    onChange={e => setAbout(e.target.value)}
                    placeholder="Tell your story... what are you passionate about, what are your goals, what unique value do you bring?"
                    rows={4}
                    maxLength={1000}
                    className={`${inputClass} resize-none`}
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{about.length}/1000</p>
                </div>

                {/* ─── Skills ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-1 text-sm uppercase tracking-wider">Skills</h3>
                  <p className="text-xs text-slate-500 mb-4">Add up to 10 skills that reflect your expertise.</p>

                  {/* Selected skills */}
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[30px]">
                    {skills.map(skill => (
                      <span key={skill} className="flex items-center gap-1 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1.5 rounded-full text-sm font-medium">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {skills.length === 0 && <span className="text-sm text-slate-400 italic">No skills added yet</span>}
                  </div>

                  {/* Custom skill input */}
                  {skills.length < 10 && (
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                        placeholder="Type a skill and press Enter..."
                        className={`${inputClass} flex-1`}
                        maxLength={40}
                      />
                      <button type="button" onClick={() => addSkill(skillInput)}
                        className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors flex-shrink-0">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Suggestions */}
                  {skills.length < 10 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-2">Suggested for {selectedRole}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(SUGGESTED_SKILLS[selectedRole] || [])
                          .filter(s => !skills.includes(s))
                          .slice(0, 8)
                          .map(skill => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => addSkill(skill)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-primary-50 border border-slate-200 hover:border-primary-300 text-slate-600 hover:text-primary-700 rounded-full text-xs font-medium transition-colors"
                            >
                              <Plus className="w-3 h-3" /> {skill}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Actions ─── */}
                <div className="flex gap-3">
                  <button type="button" onClick={prevStep} className="flex items-center gap-2 px-5 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-full hover:bg-slate-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md text-base">
                    {loading
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> {uploadingAvatar ? 'Uploading photo...' : 'Saving...'}</>
                      : <><Check className="w-5 h-5" /> Complete My Profile</>
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 4 — DONE 🎉
          ══════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="text-center fade-in-up">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-emerald-100 mb-6 text-7xl">🎉</div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-3">You're all set!</h2>
              <p className="text-lg text-slate-500 mb-4 max-w-md mx-auto">
                Your ShiaConnection profile is live. Start building connections and exploring opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <button onClick={() => window.location.href = '/'}
                  className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-full shadow-lg transition-all">
                  Go to Feed →
                </button>
                <button onClick={() => window.location.href = `/profile/${currentUser?.uid}`}
                  className="px-10 py-4 border-2 border-slate-300 text-slate-700 font-bold text-lg rounded-full hover:bg-slate-50 transition-all">
                  View My Profile
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, name, type = 'text', placeholder, onChange, icon, required = true, min, max }) {
  return (
    <div>
      <label className={labelClass}>
        {icon && <span className="mr-1.5">{icon}</span>}
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input type={type} name={name} placeholder={placeholder} onChange={onChange}
        className={inputClass} required={required} min={min} max={max} />
    </div>
  );
}
