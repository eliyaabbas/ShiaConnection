import { useState, useRef } from 'react';
import { Send, ArrowLeft, MessageSquare, Loader2, Image, Smile, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import { formatTime } from '../../utils/time';
import { sendMessage, sendImageMessage } from '../../services/db';
import { uploadPostMedia } from '../../services/storage';

const EMOJI_LIST = ['😊','😂','❤️','👍','🎉','🙏','🔥','😍','✨','😢','😮','👏','💪','🤝','😎','🥳'];

export default function ChatThread({ currentUser, activeChatId, activeOtherId, activeOtherProfile, messages, messagesEndRef, setActiveChatId }) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const activeOtherName = activeOtherProfile ? `${activeOtherProfile.firstName} ${activeOtherProfile.lastName}` : 'Chat';

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !activeChatId || sending) return;
    setSending(true);
    await sendMessage(activeChatId, currentUser.uid, messageText.trim());
    setMessageText('');
    setSending(false);
  };

  const handleImageSend = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;
    if (!file.type.startsWith('image/')) return;
    setUploadingImage(true);
    const { url, error } = await uploadPostMedia(currentUser.uid, `chat_${Date.now()}`, file, () => {});
    if (url) {
      await sendImageMessage(activeChatId, currentUser.uid, url);
    }
    setUploadingImage(false);
    e.target.value = '';
  };

  const addEmoji = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <div className="flex flex-col flex-1 w-full">
      {!activeChatId ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">Select a conversation</h3>
          <p className="text-slate-400 text-sm mt-1">Choose from your existing conversations, or use the ✏️ icon to start a new one with a connection</p>
        </div>
      ) : (
        <>
          {/* Thread Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 flex-shrink-0 bg-white">
            <button onClick={() => setActiveChatId(null)} className="md:hidden text-slate-500 hover:text-slate-800 p-1 mr-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            {activeOtherProfile && (
              <Link to={`/profile/${activeOtherId}`} className="flex-shrink-0">
                <Avatar src={activeOtherProfile?.avatarUrl} name={activeOtherName} size="md" />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{activeOtherName}</p>
              {activeOtherProfile?.role && <p className="text-xs text-slate-500 truncate">{activeOtherProfile.role}</p>}
            </div>
            <Link
              to={`/profile/${activeOtherId}`}
              className="flex-shrink-0 px-3 py-1.5 text-xs text-primary-600 border border-primary-200 rounded-full font-semibold hover:bg-primary-50 transition-colors"
            >
              View Profile
            </Link>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="p-4 bg-slate-50 rounded-full">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-600 text-sm">Start the conversation!</p>
                  <p className="text-slate-400 text-xs mt-0.5">Say hello to {activeOtherName} 👋</p>
                </div>
              </div>
            )}
            {messages.map(msg => {
              const isMine = msg.senderId === currentUser.uid;
              const time = msg.createdAt?.seconds ? formatTime(msg.createdAt.seconds * 1000) : '';
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {!isMine && (
                    <Link to={`/profile/${msg.senderId}`} className="flex-shrink-0 mb-1">
                      <Avatar src={activeOtherProfile?.avatarUrl} name={activeOtherName} size="xs" />
                    </Link>
                  )}
                  <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {msg.imageUrl ? (
                      <div className={`rounded-2xl overflow-hidden ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                        <img src={msg.imageUrl} alt="Sent image" className="max-w-[240px] max-h-[320px] object-cover" />
                      </div>
                    ) : (
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isMine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    )}
                    {time && (
                      <p className={`text-[10px] px-1 ${isMine ? 'text-slate-400 text-right' : 'text-slate-400'}`}>{time}</p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Upload Loading */}
          {uploadingImage && (
            <div className="px-4 pb-2 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
              Sending image...
            </div>
          )}

          {/* Emoji Picker */}
          {showEmoji && (
            <div className="absolute bottom-20 right-4 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600">Quick Emojis</p>
                <button onClick={() => setShowEmoji(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_LIST.map(e => (
                  <button key={e} onClick={() => addEmoji(e)} className="text-xl hover:scale-125 transition-transform p-0.5">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 flex gap-2 items-center flex-shrink-0 relative">
            <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageSend} className="hidden" />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-primary-500 transition-colors flex-shrink-0"
              title="Send image"
            >
              <Image className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowEmoji(v => !v)}
              className="p-2 text-slate-400 hover:text-primary-500 transition-colors flex-shrink-0"
              title="Emoji"
            >
              <Smile className="w-4.5 h-4.5" />
            </button>
            <input
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
            />
            <button type="submit" disabled={!messageText.trim() || sending}
              className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-full disabled:opacity-50 transition-all flex-shrink-0 active:scale-95">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
