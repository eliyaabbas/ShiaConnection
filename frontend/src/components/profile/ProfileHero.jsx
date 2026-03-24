import { useRef, useState } from 'react';
import { Camera, Loader2, MessageSquare, UserPlus, UserCheck, UserMinus, Building2, GraduationCap, PenSquare, Check, X, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';

export default function ProfileHero({ 
  profile, 
  isOwnProfile, 
  connectionStatus, 
  handleConnect, 
  uploadingAvatar, 
  uploadingCover, 
  handleFileUpload,
  saveField
}) {
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  const [editingField, setEditingField] = useState(null);
  const [editData, setEditData] = useState({});

  if (!profile) return null;
  const heroName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="glass-card overflow-hidden">
      {/* Cover */}
      <div 
        className="h-48 bg-slate-800 relative bg-cover bg-center"
        style={profile.coverUrl ? { backgroundImage: `url(${profile.coverUrl})` } : {}}
      >
        {isOwnProfile && (
          <>
            <button 
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm text-white transition-colors"
              title="Edit Cover Photo"
            >
              {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} className="hidden" />
          </>
        )}
      </div>

      <div className="px-6 pb-6 relative">
        {/* Avatar */}
        <div className="absolute -top-16 left-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary-400 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            <Avatar src={profile.avatarUrl} name={heroName} className="w-32 h-32 text-4xl border-4 border-white shadow-2026 z-10 relative transition-transform duration-500 group-hover:scale-105" />
            {isOwnProfile && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-2 right-2 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full border-2 border-white transition-colors shadow-sm z-20"
              >
                {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} className="hidden" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end pt-4 gap-2 h-14">
          {!isOwnProfile && (
            <>
              <Link to={`/messages?newChat=${profile.id}`} className="px-5 py-1.5 border-2 border-primary-600 text-primary-700 rounded-full text-sm font-bold hover:bg-primary-50 transition-all hover:-translate-y-0.5 hover:shadow-sm flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
              <button
                onClick={handleConnect}
                disabled={connectionStatus !== 'none'}
                className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  connectionStatus === 'connected'      ? 'bg-slate-100 text-slate-600 cursor-default' :
                  connectionStatus === 'pending_sent'   ? 'bg-slate-100 text-slate-500 cursor-default' :
                  'bg-gradient-to-r from-primary-500 to-primary-600 bg-pan text-white hover:shadow-2026-hover hover:-translate-y-0.5'
                }`}
              >
                {connectionStatus === 'connected'    ? <><UserCheck className="w-4 h-4" /> Connected</>    :
                 connectionStatus === 'pending_sent' ? <><UserMinus className="w-4 h-4" /> Pending</>      :
                 <><UserPlus className="w-4 h-4" /> Connect</>}
              </button>
            </>
          )}
        </div>

        <div className="mt-4">
          {/* Name Editor */}
          {editingField === 'name' ? (
            <div className="flex items-center gap-2 mb-2">
              <input value={editData.firstName || ''} onChange={e => setEditData({ ...editData, firstName: e.target.value })}
                placeholder="First Name" className="w-1/3 border border-primary-400 rounded-lg px-2 py-1 text-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              <input value={editData.lastName || ''} onChange={e => setEditData({ ...editData, lastName: e.target.value })}
                placeholder="Last Name" className="w-1/3 border border-primary-400 rounded-lg px-2 py-1 text-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              <button onClick={async () => { await saveField('firstName', editData.firstName); await saveField('lastName', editData.lastName); setEditingField(null); }} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check className="w-5 h-5" /></button>
              <button onClick={() => setEditingField(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{heroName}</h1>
              {isOwnProfile && <button onClick={() => { setEditData({ ...editData, firstName: profile.firstName || '', lastName: profile.lastName || '' }); setEditingField('name'); }} className="text-slate-400 hover:text-primary-600 p-0.5" title="Edit Name"><PenSquare className="w-4 h-4" /></button>}
            </div>
          )}
          
          {/* Headline Editor */}
          {editingField === 'headline' ? (
            <div className="flex items-center gap-2 mt-1 mb-2">
              <input value={editData.headline || ''} onChange={e => setEditData({ ...editData, headline: e.target.value })}
                className="flex-1 border border-primary-400 rounded-lg px-2 py-1 text-base font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              <button onClick={async () => { await saveField('headline', editData.headline); setEditingField(null); }} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditingField(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-lg text-slate-700 font-medium">{profile.headline || (isOwnProfile ? 'Add your headline' : '')}</p>
              {isOwnProfile && <button onClick={() => { setEditData({ headline: profile.headline || '' }); setEditingField('headline'); }} className="text-slate-400 hover:text-primary-600 p-0.5"><PenSquare className="w-4 h-4" /></button>}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-500 mt-2 text-sm flex-wrap">
            {profile.location && <><MapPin className="w-4 h-4" /><span>{profile.location}</span><span>•</span></>}
            <span className="text-primary-600 font-semibold bg-primary-50 px-2 py-0.5 rounded-md">{profile.role}</span>
            {(profile.connectionsCount || 0) > 0 && (
              <><span>•</span><Link to={`/network`} className="text-primary-600 hover:underline font-semibold">{profile.connectionsCount} connections</Link></>
            )}
          </div>
          
          {/* Role Specific Details Inline Preview */}
          <div className="mt-4 text-sm text-slate-600 flex gap-4">
             {profile.role === 'Professional' && profile.roleDetails?.company && (
               <div className="flex items-center gap-1"><Building2 className="w-4 h-4"/> {profile.roleDetails.jobTitle} at {profile.roleDetails.company}</div>
             )}
             {profile.role === 'Scholar' && profile.roleDetails?.institution && (
               <div className="flex items-center gap-1"><GraduationCap className="w-4 h-4"/> {profile.roleDetails.title} at {profile.roleDetails.institution}</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
