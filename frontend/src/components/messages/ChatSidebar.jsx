import { Search, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/time';
import Avatar from '../../components/ui/Avatar';

export default function ChatSidebar({ currentUser, chats, chatProfiles, activeChatId, setActiveChatId, loadingChats }) {
  return (
    <div className="flex flex-col w-full border-r border-slate-200">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900 text-lg mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search conversations..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {loadingChats && (
          <div className="space-y-0">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-200 rounded w-28" />
                  <div className="h-3 bg-slate-200 rounded w-36" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingChats && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">No conversations yet</p>
            <p className="text-sm text-slate-400 mt-1">Visit someone's profile and click Message</p>
          </div>
        )}

        {chats.map(chat => {
          const otherId = chat.participants?.find(p => p !== currentUser.uid);
          const profile = chatProfiles[otherId];
          const name = profile ? `${profile.firstName} ${profile.lastName}` : '...';
          const isActive = chat.id === activeChatId;
          const lastTime = chat.lastMessageTime?.seconds ? formatDistanceToNow(chat.lastMessageTime.seconds * 1000) : '';

          return (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${isActive ? 'bg-primary-50 border-r-2 border-primary-600' : 'hover:bg-slate-50'}`}
            >
              <Avatar src={profile?.avatarUrl} name={name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary-700' : 'text-slate-900'}`}>{name}</p>
                  {lastTime && <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{lastTime}</span>}
                </div>
                <p className="text-xs text-slate-500 truncate">{chat.lastMessage || 'Start a conversation'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
