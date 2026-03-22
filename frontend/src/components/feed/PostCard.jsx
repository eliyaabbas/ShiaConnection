import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Trash2, Send, Bookmark, PenSquare, Check, X } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/time';
import Avatar from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import { Link } from 'react-router-dom';
import { 
  getUserProfile, hasUserLikedPost, likePost, 
  getPostComments, addComment, deletePost, deleteComment,
  savePost, unsavePost, isPostSaved, updatePost
} from '../../services/db';

export default function PostCard({ post, currentUser }) {
  const toast = useToast();
  const [authorProfile, setAuthorProfile] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const commentsSubRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || '');
  const [savingEdit, setSavingEdit] = useState(false);
  const [content, setContent] = useState(post.content || '');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(!post.mediaUrl || post.mediaType === 'video');

  useEffect(() => {
    getUserProfile(post.authorId).then(({ data }) => { 
      if (data) setAuthorProfile(data); 
      setLoadingProfile(false);
    });
    hasUserLikedPost(post.id, currentUser.uid).then(setLiked);
    isPostSaved(currentUser.uid, post.id).then(setSaved);
  }, [post.id, post.authorId, currentUser.uid]);

  useEffect(() => {
    if (showComments && !commentsSubRef.current) {
      commentsSubRef.current = getPostComments(post.id, setComments);
    }
    if (!showComments && commentsSubRef.current) {
      commentsSubRef.current();
      commentsSubRef.current = null;
    }
    return () => commentsSubRef.current?.();
  }, [showComments, post.id]);

  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikesCount(c => prev ? c - 1 : c + 1);
    const { error } = await likePost(post.id, currentUser.uid);
    if (error) { setLiked(prev); setLikesCount(c => prev ? c + 1 : c - 1); }
  };

  const handleSave = async () => {
    const prev = saved;
    setSaved(!prev);
    if (prev) await unsavePost(currentUser.uid, post.id);
    else await savePost(currentUser.uid, post.id);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${post.authorId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    const { success, error } = await updatePost(post.id, editText.trim());
    if (success) {
      setContent(editText.trim());
      setEditing(false);
      toast.success('Post updated!');
    } else {
      toast.error(error || 'Failed to update post');
    }
    setSavingEdit(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setAddingComment(true);
    const { success, error } = await addComment(post.id, currentUser.uid, commentText.trim());
    if (success) setCommentText('');
    else toast.error(error || 'Failed to add comment');
    setAddingComment(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    const { error } = await deletePost(post.id);
    if (error) toast.error('Failed to delete post');
    else toast.success('Post deleted');
  };

  const authorName = authorProfile
    ? `${authorProfile.firstName} ${authorProfile.lastName}`
    : 'ShiaConnection User';

  const postedAt = post.createdAt?.seconds
    ? formatDistanceToNow(post.createdAt.seconds * 1000)
    : 'Just now';

  if (loadingProfile) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-slate-200 rounded w-32" />
            <div className="h-2 bg-slate-200 rounded w-20" />
          </div>
        </div>
        <div className="space-y-1.5 mt-2">
          <div className="h-3 bg-slate-200 rounded w-full" />
          <div className="h-3 bg-slate-200 rounded w-5/6" />
        </div>
        {post.mediaUrl && (
          <div className="h-64 bg-slate-200 rounded-xl w-full mt-3"></div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card fade-in-up hover-lift transition-all duration-300 mb-4">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.authorId}`}>
            <Avatar src={authorProfile?.avatarUrl} name={authorName} size="md" className="hover:opacity-90 transition-opacity" />
          </Link>
          <div>
            <Link to={`/profile/${post.authorId}`} className="hover:text-primary-600 transition-colors">
              <h4 className="font-bold text-slate-900 text-sm leading-tight inline-block">{authorName}</h4>
            </Link>
            <p className="text-xs text-slate-500">
              {authorProfile?.role || 'Member'} · {postedAt}
              {post.updatedAt && <span className="ml-1 text-slate-400">(edited)</span>}
            </p>
          </div>
        </div>
        {post.authorId === currentUser.uid && !editing && (
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditText(content); setEditing(true); }} className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-all" title="Edit post">
              <PenSquare className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title="Delete post">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full text-sm text-slate-800 border border-primary-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none min-h-[80px]"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(false)} disabled={savingEdit} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={handleEdit} disabled={savingEdit || !editText.trim()} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold disabled:opacity-60 flex items-center gap-1 hover:bg-primary-700">
                <Check className="w-3.5 h-3.5" /> {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{content}</p>
        )}
        {post.mediaUrl && !editing && (
          <div className="mt-3 relative">
            {post.mediaType === 'video' ? (
              <video src={post.mediaUrl} controls className="w-full max-h-[500px] object-contain bg-slate-900 rounded-xl" />
            ) : (
              <>
                {!imageLoaded && <div className="w-full h-64 bg-slate-200 animate-pulse rounded-xl border border-slate-100"></div>}
                <img 
                  src={post.mediaUrl} 
                  alt="Post attachment" 
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full max-h-[500px] object-cover rounded-xl border border-slate-100 ${imageLoaded ? 'block' : 'hidden'}`} 
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Counts */}
      {(likesCount > 0 || post.commentsCount > 0) && (
        <div className="px-4 pb-2 flex items-center justify-between text-xs text-slate-500 font-medium">
          {likesCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="bg-primary-100 text-primary-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">👍</span>
              <span>{likesCount}</span>
            </div>
          )}
          {post.commentsCount > 0 && (
            <button onClick={() => setShowComments(s => !s)} className="ml-auto hover:underline">
              {post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-2 py-1.5 border-t border-slate-100 flex justify-between text-sm text-slate-500 font-semibold">
        <FeedAction icon={<Heart className={`w-4 h-4 ${liked ? 'fill-primary-600 text-primary-600' : ''}`} />} label="Like" active={liked} onClick={handleLike} />
        <FeedAction icon={<MessageCircle className="w-4 h-4" />} label="Comment" onClick={() => setShowComments(s => !s)} />
        <FeedAction icon={<Share2 className="w-4 h-4" />} label="Share" onClick={handleShare} />
        <FeedAction icon={<Bookmark className={`w-4 h-4 ${saved ? 'fill-primary-600 text-primary-600' : ''}`} />} label="Save" active={saved} onClick={handleSave} />
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} postId={post.id} currentUserId={currentUser.uid} />
          ))}
          <form onSubmit={handleComment} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="flex-1 text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || addingComment}
              className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, postId, currentUserId }) {
  const toast = useToast();
  const [author, setAuthor] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    getUserProfile(comment.authorId).then(({ data }) => setAuthor(data));
  }, [comment.authorId]);
  const name = author ? `${author.firstName} ${author.lastName}` : '...';
  const time = comment.createdAt?.seconds ? formatDistanceToNow(comment.createdAt.seconds * 1000) : '';
  const isOwn = comment.authorId === currentUserId;

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deleteComment(postId, comment.id);
    if (error) { toast.error('Failed to delete comment'); setDeleting(false); }
  };

  return (
    <div className="flex items-start gap-2">
      <Link to={`/profile/${comment.authorId}`}>
        <Avatar src={author?.avatarUrl} name={name} size="sm" className="hover:opacity-90 transition-opacity" />
      </Link>
      <div className="bg-slate-50 rounded-xl px-3 py-2 text-sm flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/profile/${comment.authorId}`} className="font-bold text-slate-900 mr-2 hover:text-primary-600 transition-colors">
              {name}
            </Link>
            <span className="text-slate-600">{comment.text}</span>
          </div>
          {isOwn && (
            <button onClick={handleDelete} disabled={deleting} className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors mt-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {time && <p className="text-[10px] text-slate-400 mt-0.5">{time}</p>}
      </div>
    </div>
  );
}

function FeedAction({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 hover:bg-slate-100 px-3 py-2 rounded-xl transition-all duration-200 flex-1 justify-center active:scale-95 ${active ? 'text-primary-600 font-bold bg-primary-50' : 'hover:text-slate-800 hover:-translate-y-0.5'}`}
    >
      {icon}
      <span className="text-xs hidden sm:inline">{label}</span>
    </button>
  );
}
