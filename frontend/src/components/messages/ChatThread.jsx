import { useState } from 'react';
import { Send, ArrowLeft, MessageSquare, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import { formatTime } from '../../utils/time';
import { sendMessage } from '../../services/db';

export default function ChatThread({ currentUser, activeChatId, activeOtherId, activeOtherProfile, messages, messagesEndRef, setActiveChatId }) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const activeOtherName = activeOtherProfile ? `${activeOtherProfile.firstName} ${activeOtherProfile.lastName}` : 'Chat';

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !activeChatId || sending) return;
    setSending(true);
    await sendMessage(activeChatId, currentUser.uid, messageText.trim());
    setMessageText('');
    setSending(false);
  };

  return (
    <div className="flex flex-col flex-1 w-full">
      {!activeChatId ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">Select a conversation</h3>
          <p className="text-slate-400 text-sm mt-1">Choose from your existing conversations or start a new one</p>
        </div>
      ) : (
        <>
          {/* Thread Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
            <button onClick={() => setActiveChatId(null)} className="md:hidden text-slate-500 hover:text-slate-800 p-1 mr-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            {activeOtherProfile && (
              <Link to={`/profile/${activeOtherId}`}>
                <Avatar src={activeOtherProfile?.avatarUrl} name={activeOtherName} size="md" />
              </Link>
            )}
            <div>
              <p className="font-bold text-slate-900 text-sm">{activeOtherName}</p>
              {activeOtherProfile?.role && <p className="text-xs text-slate-500">{activeOtherProfile.role}</p>}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-400 text-sm">No messages yet. Say hello! 👋</p>
              </div>
            )}
            {messages.map(msg => {
              const isMine = msg.senderId === currentUser.uid;
              const time = msg.createdAt?.seconds ? formatTime(msg.createdAt.seconds * 1000) : '';
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isMine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    {time && <p className={`text-[10px] mt-0.5 ${isMine ? 'text-primary-200' : 'text-slate-400'}`}>{time}</p>}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 flex gap-2 items-center">
            <input
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
            />
            <button type="submit" disabled={!messageText.trim() || sending}
              className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-full disabled:opacity-50 transition-colors flex-shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
