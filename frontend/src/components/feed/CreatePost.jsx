import { useState } from 'react';
import { Image, Video, FileText, Send, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import { createPost } from '../../services/db';
import { uploadPostMedia } from '../../services/storage';

export default function CreatePost() {
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();
  const [postText, setPostText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fullName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : '';

  const handleFileSelect = (e, acceptType) => {
    const file = e.target.files[0];
    if (file) {
      if (acceptType === 'image' && !file.type.startsWith('image/')) {
        return toast.error('Please select a valid image file');
      }
      if (acceptType === 'video' && !file.type.startsWith('video/')) {
        return toast.error('Please select a valid video file');
      }
      if (file.size > 20 * 1024 * 1024) {
        return toast.error('File must be smaller than 20MB');
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handlePost = async () => {
    if (!postText.trim() && !selectedFile) return;
    setSubmitting(true);
    setUploadProgress(0);

    let finalMediaUrl = null;
    let mediaType = null;

    if (selectedFile) {
      const tempId = `post_${Date.now()}`;
      mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      const { url, error } = await uploadPostMedia(currentUser.uid, tempId, selectedFile, setUploadProgress);
      if (error) {
        toast.error('Failed to upload media: ' + error);
        setSubmitting(false);
        return;
      }
      finalMediaUrl = url;
    }

    const { success, error } = await createPost(currentUser.uid, postText.trim(), finalMediaUrl, mediaType);
    if (success) {
      setPostText('');
      clearMedia();
      toast.success('Post published!');
    } else {
      toast.error(error || 'Failed to post');
    }
    setSubmitting(false);
    setUploadProgress(0);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 flex gap-3">
        <Avatar src={userProfile?.avatarUrl} name={fullName} size="md" className="flex-shrink-0 mt-0.5" />
        <div className="flex-grow">
          <textarea
            placeholder="Share an update, write an article, or start a discussion..."
            className="w-full bg-transparent resize-none outline-none text-slate-700 min-h-[60px] pb-2 text-base placeholder-slate-400"
            value={postText}
            onChange={e => setPostText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handlePost(); }}
          />

          {/* Media Preview Area */}
          {previewUrl && (
            <div className="relative mt-2 inline-block">
              {selectedFile?.type.startsWith('video/') ? (
                <video src={previewUrl} controls className="max-h-48 rounded-lg outline outline-1 outline-slate-200" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg object-contain outline outline-1 outline-slate-200" />
              )}
              <button 
                onClick={clearMedia}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg backdrop-blur-sm">
                  <div className="text-center font-bold text-primary-600">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1" />
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-1 relative">
          <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'image')} />
          <input type="file" id="video-upload" className="hidden" accept="video/*" onChange={(e) => handleFileSelect(e, 'video')} />
          
          <label htmlFor="image-upload">
            <ActionButton as="span" icon={<Image className="w-4 h-4 text-primary-500" />} label="Photo" />
          </label>
          <label htmlFor="video-upload">
            <ActionButton as="span" icon={<Video className="w-4 h-4 text-primary-500" />} label="Video" />
          </label>
          <ActionButton icon={<FileText className="w-4 h-4 text-primary-500" />} label="Article" />
        </div>
        <button
          onClick={handlePost}
          disabled={(!postText.trim() && !selectedFile) || submitting}
          className={`px-5 py-1.5 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${
            (postText.trim() || selectedFile) && !submitting
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Post
        </button>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, as = 'button' }) {
  const Component = as;
  return (
    <Component className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-lg transition-colors text-xs text-slate-500 font-medium cursor-pointer">
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Component>
  );
}
