import { UserPlus, UserCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';

export default function SuggestionGrid({ loading, suggestions, statusMap, onConnect }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-slate-200 rounded-xl overflow-hidden animate-pulse">
            <div className="h-16 bg-slate-200" />
            <div className="p-4 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-slate-200 -mt-12" />
              <div className="h-3 bg-slate-200 rounded w-24 mt-2" />
              <div className="h-3 bg-slate-200 rounded w-16" />
              <div className="h-8 bg-slate-200 rounded-full w-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-8">No suggestions right now. Check back later!</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {suggestions.map(person => {
        const name = `${person.firstName} ${person.lastName}`;
        const status = statusMap?.[person.id] || 'none';
        
        let buttonContent, buttonClass;
        if (status === 'sent') {
          buttonContent = <><Clock className="w-3.5 h-3.5" /> Pending</>;
          buttonClass = 'border-slate-200 text-slate-400 bg-slate-50 cursor-default';
        } else if (status === 'received') {
          buttonContent = <><UserCheck className="w-3.5 h-3.5" /> Respond</>;
          buttonClass = 'border-emerald-500 text-emerald-600 bg-emerald-50 hover:bg-emerald-100';
        } else if (status === 'connected') {
          buttonContent = <><UserCheck className="w-3.5 h-3.5" /> Connected</>;
          buttonClass = 'border-slate-200 text-slate-400 bg-slate-50 cursor-default';
        } else {
          buttonContent = <><UserPlus className="w-3.5 h-3.5" /> Connect</>;
          buttonClass = 'border-primary-600 text-primary-600 hover:bg-primary-50';
        }
        
        return (
          <div key={person.id} className="border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow relative group">
            <div className="h-16 bg-gradient-to-br from-primary-400 to-primary-700"></div>
            <div className="p-4 flex flex-col items-center flex-grow text-center">
              <Link to={`/profile/${person.id}`} className="-mt-12 mb-2 block">
                <Avatar src={person.avatarUrl} name={name} size="xl" className="border-4 border-white shadow-sm" />
              </Link>
              <Link to={`/profile/${person.id}`} className="font-bold text-slate-900 line-clamp-1 hover:text-primary-600 transition-colors text-sm">
                {name}
              </Link>
              <p className="text-xs text-slate-500 mb-3 line-clamp-1">{person.role}</p>
              {status === 'received' ? (
                // They sent you a request — link to Network page to accept it from Invitations
                <Link to="/network" className={`w-full py-1.5 flex justify-center items-center gap-1.5 font-bold border-2 rounded-full text-sm transition-colors ${buttonClass}`}>
                  {buttonContent}
                </Link>
              ) : (
                <button
                  onClick={() => status === 'none' && onConnect(person.id)}
                  disabled={status !== 'none'}
                  className={`w-full py-1.5 flex justify-center items-center gap-1.5 font-bold border-2 rounded-full text-sm transition-colors ${buttonClass}`}
                >
                  {buttonContent}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
