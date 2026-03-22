import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeChats, subscribeMessages, getOrCreateChat, getUserProfile, markChatRead } from '../services/db';

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
  // Track the other user's ID independently — so it's known even before subscribeChats fires
  const [activeOtherId, setActiveOtherId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  
  const messagesEndRef = useRef(null);
  const msgUnsubRef = useRef(null);

  // Handle ?newChat=uid from the Profile page "Message" button
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newChatUid = params.get('newChat');
    if (newChatUid) {
      openOrCreateChat(newChatUid);
      navigate('/messages', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Subscribe to chat list
  useEffect(() => {
    const unsub = subscribeChats(currentUser.uid, async (newChats) => {
      setChats(newChats);
      setLoadingChats(false);

      // Load the other user's profile for each chat if not already loaded
      const profileMap = {};
      await Promise.all(newChats.map(async chat => {
        const otherId = chat.participants?.find(p => p !== currentUser.uid);
        if (otherId && !chatProfiles[otherId]) {
          const { data } = await getUserProfile(otherId);
          if (data) profileMap[otherId] = data;
        }
      }));
      if (Object.keys(profileMap).length > 0) {
        setChatProfiles(prev => ({ ...prev, ...profileMap }));
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.uid]);

  // Subscribe to active chat messages
  useEffect(() => {
    if (msgUnsubRef.current) { msgUnsubRef.current(); msgUnsubRef.current = null; }
    if (!activeChatId) return;
    setMessages([]); // clear previous messages immediately
    msgUnsubRef.current = subscribeMessages(activeChatId, setMessages);
    markChatRead(activeChatId, currentUser.uid);
    return () => { msgUnsubRef.current?.(); };
  }, [activeChatId, currentUser.uid]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load profile for other user when activeOtherId changes, if not already in chatProfiles
  useEffect(() => {
    if (activeOtherId && !chatProfiles[activeOtherId]) {
      getUserProfile(activeOtherId).then(({ data }) => {
        if (data) setChatProfiles(prev => ({ ...prev, [activeOtherId]: data }));
      });
    }
  }, [activeOtherId, chatProfiles]);

  // Core function: open an existing or create a new chat with a given user
  const openOrCreateChat = async (otherUid) => {
    setActiveOtherId(otherUid);
    const { chatId } = await getOrCreateChat(currentUser.uid, otherUid);
    if (chatId) {
      setActiveChatId(chatId);
    }
  };

  const handleSetActiveChat = (chatId) => {
    setActiveChatId(chatId);
    // Derive the other user ID from the chats list
    const chat = chats.find(c => c.id === chatId);
    const otherId = chat?.participants?.find(p => p !== currentUser.uid);
    if (otherId) setActiveOtherId(otherId);
  };

  const activeOtherProfile = activeOtherId ? chatProfiles[activeOtherId] : null;

  return (
    <div className="flex h-[calc(100dvh-7rem)] md:h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Chat List — on mobile, hide when a chat is open */}
      <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 flex-shrink-0`}>
        <ChatSidebar
          currentUser={currentUser}
          chats={chats}
          chatProfiles={chatProfiles}
          activeChatId={activeChatId}
          setActiveChatId={handleSetActiveChat}
          loadingChats={loadingChats}
          onStartChat={openOrCreateChat}
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
          setActiveChatId={(id) => { if (!id) { setActiveChatId(null); setActiveOtherId(null); } else handleSetActiveChat(id); }}
        />
      </div>
    </div>
  );
}
