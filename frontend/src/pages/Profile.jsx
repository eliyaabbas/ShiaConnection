import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { 
  getUserProfile, updateUserProfile, 
  sendConnectionRequest, getConnectionStatus,
  getPostsByUser
} from '../services/db';
import { uploadAvatar, uploadPostMedia, uploadResume } from '../services/storage';

// Profile Components
import ProfileHero from '../components/profile/ProfileHero';
import ProfileCompleteness from '../components/profile/ProfileCompleteness';
import ProfileAbout from '../components/profile/ProfileAbout';
import ProfileActivity from '../components/profile/ProfileActivity';
import ProfileExperience from '../components/profile/ProfileExperience';
import ProfileEducation from '../components/profile/ProfileEducation';
import ProfileCertifications from '../components/profile/ProfileCertifications';
import ProfileContact from '../components/profile/ProfileContact';
import ProfileResume from '../components/profile/ProfileResume';
import ProfileSkills from '../components/profile/ProfileSkills';

export default function Profile() {
  const { id } = useParams();
  const { currentUser, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isOwnProfile = id === currentUser?.uid;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [userPosts, setUserPosts] = useState([]);
  
  // Uploading states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Field editing states
  const [editingField, setEditingField] = useState(null); 
  const [editData, setEditData] = useState({});

  // Collection modal states
  const [editingCollection, setEditingCollection] = useState(null); 
  const [collectionForm, setCollectionForm] = useState({});

  // Skills
  const [newSkill, setNewSkill] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await getUserProfile(id);
      if (error || !data) { toast.error('Profile not found'); navigate('/'); return; }
      setProfile(data);

      if (id) {
        const { data: posts } = await getPostsByUser(id, 5);
        if (posts) setUserPosts(posts);
      }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    if (!isOwnProfile && currentUser?.uid && id) {
      getConnectionStatus(currentUser.uid, id).then(setConnectionStatus);
    }
  }, [id, currentUser, isOwnProfile]);

  const saveField = async (field, value) => {
    if (!currentUser?.uid) return false;
    const { error } = await updateUserProfile(currentUser.uid, { [field]: value });
    if (error) { toast.error('Failed to save'); return false; }
    setProfile(p => ({ ...p, [field]: value }));
    if (isOwnProfile) await refreshProfile();
    toast.success('Saved!');
    return true;
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') {
      setUploadingAvatar(true);
      const { url, error } = await uploadAvatar(currentUser?.uid, file);
      if (!error && url) await saveField('avatarUrl', url);
      else toast.error(error || 'Upload failed');
      setUploadingAvatar(false);
    } else if (type === 'cover') {
      setUploadingCover(true);
      const { url, error } = await uploadPostMedia(currentUser?.uid, `cover_${currentUser?.uid}`, file);
      if (!error && url) await saveField('coverUrl', url);
      else toast.error(error || 'Upload failed');
      setUploadingCover(false);
    } else if (type === 'resume') {
      setUploadingResume(true);
      const { url, error } = await uploadResume(currentUser?.uid, file);
      if (!error && url) await saveField('resumeUrl', url);
      else toast.error(error || 'Upload failed');
      setUploadingResume(false);
    }
  };

  const handleConnect = async () => {
    if (connectionStatus !== 'none' || !currentUser?.uid) return;
    const { success, error } = await sendConnectionRequest(currentUser.uid, id);
    if (success) { setConnectionStatus('pending_sent'); toast.success('Connection request sent!'); }
    else toast.error(error);
  };

  const handleSaveCollection = async () => {
    const { type, item } = editingCollection;
    const currentList = profile[type] || [];
    let updatedList;

    if (item?.id) {
      updatedList = currentList.map(x => x.id === item.id ? { ...collectionForm, id: item.id } : x);
    } else {
      if ((type === 'experience' && !collectionForm.title) || (type === 'education' && !collectionForm.school) || (type === 'certifications' && !collectionForm.name)) return;
      updatedList = [...currentList, { ...collectionForm, id: Date.now() }];
    }

    await saveField(type, updatedList);
    setEditingCollection(null);
  };

  const handleRemoveCollectionItem = async (type, itemId) => {
    const updated = (profile[type] || []).filter(e => e.id !== itemId);
    await saveField(type, updated);
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    const updated = [...(profile.skills || []), newSkill.trim()];
    await saveField('skills', updated);
    setNewSkill('');
    setAddingSkill(false);
  };

  const handleRemoveSkill = async (skill) => {
    const updated = (profile.skills || []).filter(s => s !== skill);
    await saveField('skills', updated);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white rounded-xl h-64 border border-slate-200" />
        <div className="bg-white rounded-xl h-40 border border-slate-200" />
        <div className="bg-white rounded-xl h-48 border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      <ProfileCompleteness 
        profile={profile} 
        isOwnProfile={isOwnProfile} 
      />

      <ProfileHero 
        profile={profile}
        isOwnProfile={isOwnProfile}
        connectionStatus={connectionStatus}
        handleConnect={handleConnect}
        uploadingAvatar={uploadingAvatar}
        uploadingCover={uploadingCover}
        handleFileUpload={handleFileUpload}
        saveField={saveField}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-4">
          <ProfileAbout 
            profile={profile}
            isOwnProfile={isOwnProfile}
            editingField={editingField}
            setEditingField={setEditingField}
            editData={editData}
            setEditData={setEditData}
            saveField={saveField}
          />

          <ProfileActivity 
            userPosts={userPosts} 
          />

          <ProfileExperience 
            profile={profile}
            isOwnProfile={isOwnProfile}
            editingCollection={editingCollection}
            setEditingCollection={setEditingCollection}
            collectionForm={collectionForm}
            setCollectionForm={setCollectionForm}
            handleSaveCollection={handleSaveCollection}
            handleRemoveCollectionItem={handleRemoveCollectionItem}
          />

          <ProfileEducation 
            profile={profile}
            isOwnProfile={isOwnProfile}
            editingCollection={editingCollection}
            setEditingCollection={setEditingCollection}
            collectionForm={collectionForm}
            setCollectionForm={setCollectionForm}
            handleSaveCollection={handleSaveCollection}
            handleRemoveCollectionItem={handleRemoveCollectionItem}
          />

          <ProfileCertifications 
            profile={profile}
            isOwnProfile={isOwnProfile}
            editingCollection={editingCollection}
            setEditingCollection={setEditingCollection}
            collectionForm={collectionForm}
            setCollectionForm={setCollectionForm}
            handleSaveCollection={handleSaveCollection}
            handleRemoveCollectionItem={handleRemoveCollectionItem}
          />
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-4">
          <ProfileContact 
            profile={profile}
            isOwnProfile={isOwnProfile}
            editingField={editingField}
            setEditingField={setEditingField}
            editData={editData}
            setEditData={setEditData}
            saveField={saveField}
          />

          <ProfileResume 
            profile={profile}
            isOwnProfile={isOwnProfile}
            uploadingResume={uploadingResume}
            handleFileUpload={handleFileUpload}
          />

          <ProfileSkills 
            profile={profile}
            isOwnProfile={isOwnProfile}
            addingSkill={addingSkill}
            setAddingSkill={setAddingSkill}
            newSkill={newSkill}
            setNewSkill={setNewSkill}
            handleAddSkill={handleAddSkill}
            handleRemoveSkill={handleRemoveSkill}
          />
        </div>
      </div>
    </div>
  );
}
