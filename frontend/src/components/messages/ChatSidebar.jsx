import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Edit3, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/time';
import Avatar from '../../components/ui/Avatar';
import { getUserConnectionsWithProfiles } from '../../services/db';

export default function ChatSidebar({ currentUser, chats, chatProfiles, activeChatId, setActiveChatId, loadingChats, onStartChat }) {
  const [searchText, setSearchText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [creatingChat, setCreatingChat] = useState(null);
  const [connSearch, setConnSearch] = useState('');
  const newChatRef = useRef(null);

  const openNewChatPicker = async () => {
    setShowNewChat(true);
    if (connections.length === 0) {
      setLoadingConnections(true);
      const { data } = await getUserConnectionsWithProfiles(currentUser.uid);
      setConnections(data || []);
      setLoadingConnections(false);
    }
  };

  const handleStartChat = async (person) => {
    setCreatingChat(person.id);
    try {
      await onStartChat(person.id); // calls openOrCreateChat in Messages.jsx
    } finally {
      setCreatingChat(null);
      setShowNewChat(false);
      setConnSearch('');
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (newChatRef.current && !newChatRef.current.contains(e.target)) {
        setShowNewChat(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredChats = searchText.trim()
    ? chats.filter(chat => {
        const otherId = chat.participants?.find(p => p !== currentUser.uid);
        const profile = chatProfiles[otherId];
        if (!profile) return false;
        return `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(searchText.toLowerCase());
      })
    : chats;

  const filteredConnections = connSearch.trim()
    ? connections.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(connSearch.toLowerCase()))
    : connections;

  return (
    <div className="flex flex-col w-full border-r border-slate-200 relative h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 text-lg">Messages</h2>
          <button
            onClick={openNewChatPicker}
            title="New message"
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search conversations..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </div>

      {/* New Chat Dropdown */}
      {showNewChat && (
        <div
          ref={newChatRef}
          className="absolute top-[5.5rem] left-2 right-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ maxHeight: '18rem' }}
        >
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">New Message</h3>
            <button onClick={() => setShowNewChat(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 border-b border-slate-100">
            <input
              placeholder="Search your connections..."
              value={connSearch}
              onChange={e => setConnSearch(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '12rem' }}>
            {loadingConnections && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              </div>
            )}
            {!loadingConnections && filteredConnections.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4 px-3">
                {connections.length === 0
                  ? "No connections yet. Connect with people first!"
                  : "No matching connections."}
              </p>
            )}
            {filteredConnections.map(person => {
              const name = `${person.firstName} ${person.lastName}`;
              const isCreating = creatingChat === person.id;
              return (
                <button
                  key={person.id}
                  onMouseDown={e => { e.stopPropagation(); }}
                  onClick={() => handleStartChat(person)}
                  disabled={!!creatingChat}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-50 transition-colors text-left disabled:opacity-60"
                >
                  <Avatar src={person.avatarUrl} name={name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                    <p className="text-xs text-slate-500 truncate">{person.role}</p>
                  </div>
                  {isCreating
                    ? <Loader2 className="w-4 h-4 animate-spin text-primary-500 flex-shrink-0" />
                    : <span className="text-xs text-primary-500 font-semibold flex-shrink-0">Chat</span>
                  }
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat list */}
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

        {!loadingChats && filteredChats.length === 0 && !showNewChat && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">
              {searchText ? 'No matching conversations' : 'No conversations yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {searchText
                ? 'Try a different name'
                : 'Click the ✏️ icon above to start one'}
            </p>
          </div>
        )}

        {filteredChats.map(chat => {
          const otherId = chat.participants?.find(p => p !== currentUser.uid);
          const profile = chatProfiles[otherId];
          const name = profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...';
          const isActive = chat.id === activeChatId;
          const lastTime = chat.lastMessageTime?.seconds
            ? formatDistanceToNow(chat.lastMessageTime.seconds * 1000)
            : '';
          const hasUnread = chat.lastSenderId
            && chat.lastSenderId !== currentUser.uid
            && !chat.readBy?.[currentUser.uid];

          return (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                isActive ? 'bg-primary-50 border-r-2 border-primary-600' : 'hover:bg-slate-50'
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar src={profile?.avatarUrl} name={name} size="md" />
                {hasUnread && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className={`text-sm truncate ${
                    isActive ? 'text-primary-700 font-bold'
                    : hasUnread ? 'text-slate-900 font-bold'
                    : 'text-slate-900 font-semibold'
                  }`}>{name}</p>
                  {lastTime && <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{lastTime}</span>}
                </div>
                <p className={`text-xs truncate ${hasUnread && !isActive ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                  {chat.lastMessage || 'Start a conversation'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
