import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { subscribeFeedPosts } from '../services/db';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';

export default function Feed() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeFeedPosts((newPosts) => {
      setPosts(newPosts);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Compose Post */}
      <CreatePost />

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-200 rounded w-32" />
                  <div className="h-2 bg-slate-200 rounded w-20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-5/6" />
                <div className="h-3 bg-slate-200 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts */}
      {!loading && posts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">📰</p>
          <h3 className="font-bold text-slate-800 mb-1">No posts yet</h3>
          <p className="text-slate-500 text-sm">Be the first! Share something with the community.</p>
        </div>
      )}

      {!loading && posts.map(post => (
        <PostCard key={post.id} post={post} currentUser={currentUser} />
      ))}
    </div>
  );
}
