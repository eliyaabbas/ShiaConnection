import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/time';
import Avatar from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import { Link } from 'react-router-dom';
import { 
  getUserProfile, hasUserLikedPost, likePost, 
  getPostComments, addComment, deletePost 
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

  useEffect(() => {
    // Load author profile
    getUserProfile(post.authorId).then(({ data }) => {
      if (data) setAuthorProfile(data);
    });
    // Check if current user liked this post
    hasUserLikedPost(post.id, currentUser.uid).then(setLiked);
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

  return (
    <div className="glass-card fade-in-up hover-lift transition-all duration-300">
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
            <p className="text-xs text-slate-500">{authorProfile?.role || 'Member'} • {postedAt}</p>
          </div>
        </div>
        {post.authorId === currentUser.uid && (
          <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all hover:scale-110" title="Delete post">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.mediaUrl && (
          <div className="mt-3">
            {post.mediaType === 'video' ? (
              <video 
                src={post.mediaUrl} 
                controls 
                className="w-full max-h-[500px] object-contain bg-slate-900 rounded-xl"
              />
            ) : (
              <img 
                src={post.mediaUrl} 
                alt="Post attachment" 
                className="w-full max-h-[500px] object-cover rounded-xl border border-slate-100"
              />
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
        <FeedAction icon={<Share2 className="w-4 h-4" />} label="Share" />
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
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

function CommentItem({ comment }) {
  const [author, setAuthor] = useState(null);
  useEffect(() => {
    getUserProfile(comment.authorId).then(({ data }) => setAuthor(data));
  }, [comment.authorId]);
  const name = author ? `${author.firstName} ${author.lastName}` : '...';
  return (
    <div className="flex items-start gap-2">
      <Link to={`/profile/${comment.authorId}`}>
        <Avatar src={author?.avatarUrl} name={name} size="sm" className="hover:opacity-90 transition-opacity" />
      </Link>
      <div className="bg-slate-50 rounded-xl px-3 py-2 text-sm flex-1">
        <Link to={`/profile/${comment.authorId}`} className="font-bold text-slate-900 mr-2 hover:text-primary-600 transition-colors">
          {name}
        </Link>
        <span className="text-slate-600">{comment.text}</span>
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
