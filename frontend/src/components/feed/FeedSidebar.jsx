import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';

export default function FeedSidebar({ suggestedConnections }) {
  const { currentUser, userProfile } = useAuth();
  const fullName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : '';

  return (
    <div className="hidden lg:flex flex-col gap-4">


      {/* Suggested Connections */}
      {suggestedConnections && suggestedConnections.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">People you may know</h3>
          <div className="space-y-3">
            {suggestedConnections.slice(0, 4).map(person => {
              const name = `${person.firstName} ${person.lastName}`;
              return (
                <div key={person.id} className="flex items-center gap-3">
                  <Link to={`/profile/${person.id}`} className="flex-shrink-0">
                    <Avatar src={person.avatarUrl} name={name} size="sm" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${person.id}`} className="text-xs font-semibold text-slate-900 truncate block hover:text-primary-600 transition-colors">{name}</Link>
                    <p className="text-xs text-slate-500 truncate">{person.role}</p>
                  </div>
                  <Link to={`/profile/${person.id}`} className="text-xs text-primary-600 font-semibold hover:underline whitespace-nowrap">View</Link>
                </div>
              );
            })}
            <Link to="/network" className="block text-xs text-center text-primary-600 font-semibold hover:underline pt-1">See all →</Link>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="font-semibold text-slate-800 text-sm mb-2">Quick links</h3>
        <div className="space-y-1">
          {[
            { to: '/saved', label: '🔖 Saved Items' },
            { to: '/jobs', label: '💼 Jobs' },
            { to: '/notifications', label: '🔔 Notifications' },
            { to: '/settings', label: '⚙️ Settings' },
          ].map(link => (
            <Link key={link.to} to={link.to} className="block text-xs text-slate-600 hover:text-primary-600 py-1 transition-colors">{link.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
