import { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSavedPosts } from '../services/db';
import PostCard from '../components/feed/PostCard';

export default function Saved() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedPosts(currentUser.uid).then(({ data }) => {
      setPosts(data || []);
      setLoading(false);
    });
  }, [currentUser.uid]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Bookmark className="w-6 h-6 text-primary-600 fill-primary-100" />
          <h1 className="text-xl font-bold text-slate-900">Saved Items</h1>
        </div>
        <p className="text-sm text-slate-500">Posts you've bookmarked for later.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 mb-1">No saved posts yet</h3>
          <p className="text-slate-500 text-sm">Click the bookmark icon on any post to save it here.</p>
        </div>
      )}

      {!loading && posts.map(post => (
        <PostCard key={post.id} post={post} currentUser={currentUser} />
      ))}
    </div>
  );
}
