import { Activity } from 'lucide-react';

export default function ProfileActivity({ userPosts = [] }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-bold text-slate-900">Activity</h2>
        </div>
        <span className="text-sm text-slate-500">{userPosts.length} posts</span>
      </div>
      
      {userPosts.length === 0 ? (
        <p className="text-slate-400 text-sm italic border-t border-slate-100 pt-3">Hasn't posted anything recently.</p>
      ) : (
        <div className="space-y-3">
          {userPosts.slice(0, 3).map(post => (
            <div key={post.id} className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors">
              <p className="text-sm text-slate-800 line-clamp-2">{post.content}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>{post.likesCount} Likes</span>
                <span>{post.commentsCount} Comments</span>
                <span>{new Date(post.createdAt?.toMillis() || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
