import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeChats, subscribeMessages, getOrCreateChat, getUserProfile } from '../services/db';

import ChatSidebar from '../components/messages/ChatSidebar';
import ChatThread from '../components/messages/ChatThread';

export default function Messages() {
  const { currentUser } = useAuth();
  const { chatId: urlChatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [chatProfiles, setChatProfiles] = useState({});
  const [activeChatId, setActiveChatId] = useState(urlChatId || null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  
  const messagesEndRef = useRef(null);
  const msgUnsubRef = useRef(null);

  // Handle ?newChat=uid from Profile page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newChatUid = params.get('newChat');
    if (newChatUid) {
      getOrCreateChat(currentUser.uid, newChatUid).then(({ chatId }) => {
        if (chatId) { setActiveChatId(chatId); navigate('/messages', { replace: true }); }
      });
    }
  }, [location.search, currentUser.uid, navigate]);

  // Subscribe to chat list
  useEffect(() => {
    const unsub = subscribeChats(currentUser.uid, async (newChats) => {
      setChats(newChats);
      setLoadingChats(false);
      // Load the other user's profile for each chat
      const profileMap = {};
      await Promise.all(newChats.map(async chat => {
        const otherId = chat.participants.find(p => p !== currentUser.uid);
        if (otherId && !chatProfiles[otherId]) {
          const { data } = await getUserProfile(otherId);
          if (data) profileMap[otherId] = data;
        }
      }));
      setChatProfiles(prev => ({ ...prev, ...profileMap }));
    });
    return unsub;
  }, [currentUser.uid]);

  // Subscribe to active chat messages
  useEffect(() => {
    if (msgUnsubRef.current) { msgUnsubRef.current(); msgUnsubRef.current = null; }
    if (!activeChatId) return;
    msgUnsubRef.current = subscribeMessages(activeChatId, setMessages);
    return () => { msgUnsubRef.current?.(); };
  }, [activeChatId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeOtherId = activeChat?.participants?.find(p => p !== currentUser.uid);
  const activeOtherProfile = chatProfiles[activeOtherId];

  return (
    <div className="flex h-[calc(100dvh-7rem)] md:h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Chat List — on mobile, hide when a chat is open */}
      <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 flex-shrink-0`}>
        <ChatSidebar
          currentUser={currentUser}
          chats={chats}
          chatProfiles={chatProfiles}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          loadingChats={loadingChats}
        />
      </div>

      {/* Message Thread — on mobile, show full width when chat is open */}
      <div className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
        <ChatThread
          currentUser={currentUser}
          activeChatId={activeChatId}
          activeOtherId={activeOtherId}
          activeOtherProfile={activeOtherProfile}
          messages={messages}
          messagesEndRef={messagesEndRef}
          setActiveChatId={setActiveChatId}
        />
      </div>
    </div>
  );
}
