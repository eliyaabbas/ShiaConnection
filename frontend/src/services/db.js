import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './firebase';

// ─────────────────────────────────────────────────────────────
// USER PROFILES
// ─────────────────────────────────────────────────────────────

export const getUserProfile = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    return { data: null, error: 'User not found' };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const updateUserProfile = async (uid, data) => {
  try {
    await updateDoc(doc(db, 'users', uid), data);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const ensureUserProfile = async (uid, defaultData) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) {
      await setDoc(doc(db, 'users', uid), { ...defaultData, createdAt: serverTimestamp() });
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const searchUsers = async (queryText, currentUid) => {
  try {
    // Simple prefix search on firstName
    const snap = await getDocs(
      query(collection(db, 'users'), orderBy('firstName'), limit(20))
    );
    const lower = queryText.toLowerCase();
    const results = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u =>
        u.id !== currentUid &&
        (`${u.firstName} ${u.lastName}`.toLowerCase().includes(lower))
      );
    return { data: results, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100)));
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// POSTS & FEED
// ─────────────────────────────────────────────────────────────

export const getFeedPosts = async (limitCount = 20) => {
  try {
    const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount)));
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { data: posts, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const getPostsByUser = async (uid, limitCount = 20) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'posts'), where('authorId', '==', uid), orderBy('createdAt', 'desc'), limit(limitCount))
    );
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { data: posts, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const subscribeFeedPosts = (callback, limitCount = 20) => {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const createPost = async (uid, content, mediaUrl = null, mediaType = null) => {
  try {
    const newPost = {
      authorId: uid,
      content,
      mediaUrl,
      mediaType,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'posts'), newPost);
    return { success: true, id: docRef.id, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deletePost = async (postId) => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const likePost = async (postId, userId) => {
  try {
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const likeSnap = await getDoc(likeRef);
    const postRef = doc(db, 'posts', postId);
    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { likesCount: increment(-1) });
      return { liked: false, error: null };
    } else {
      await setDoc(likeRef, { likedAt: serverTimestamp() });
      await updateDoc(postRef, { likesCount: increment(1) });
      return { liked: true, error: null };
    }
  } catch (error) {
    return { liked: false, error: error.message };
  }
};

export const hasUserLikedPost = async (postId, userId) => {
  try {
    const snap = await getDoc(doc(db, 'posts', postId, 'likes', userId));
    return snap.exists();
  } catch { return false; }
};

export const getPostComments = (postId, callback) => {
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const addComment = async (postId, authorId, text) => {
  try {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      authorId,
      text,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────────────────────

export const getJobs = async (limitCount = 30) => {
  try {
    const snap = await getDocs(query(collection(db, 'jobs'), where('status', '==', 'open'), orderBy('postedAt', 'desc'), limit(limitCount)));
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

export const createJob = async (recruiterId, jobData) => {
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      recruiterId,
      ...jobData,
      status: 'open',
      postedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const applyToJob = async (jobId, applicantId, coverNote = '') => {
  try {
    const appRef = doc(db, 'jobs', jobId, 'applications', applicantId);
    const existing = await getDoc(appRef);
    if (existing.exists()) return { success: false, error: 'Already applied' };
    await setDoc(appRef, {
      applicantId,
      coverNote,
      status: 'pending',
      appliedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const hasApplied = async (jobId, applicantId) => {
  try {
    const snap = await getDoc(doc(db, 'jobs', jobId, 'applications', applicantId));
    return snap.exists();
  } catch { return false; }
};

export const getRecruiterJobs = async (recruiterId) => {
  try {
    const snap = await getDocs(query(collection(db, 'jobs'), where('recruiterId', '==', recruiterId), orderBy('postedAt', 'desc')));
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// CONNECTIONS
// ─────────────────────────────────────────────────────────────

export const getPendingConnectionRequests = (uid, callback) => {
  const q = query(collection(db, 'connectionRequests'), where('targetId', '==', uid), where('status', '==', 'pending'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const sendConnectionRequest = async (senderId, targetId) => {
  try {
    // Check if already exists
    const existing = await getDocs(
      query(collection(db, 'connectionRequests'),
        where('senderId', '==', senderId),
        where('targetId', '==', targetId))
    );
    if (!existing.empty) return { success: false, error: 'Request already sent' };
    await addDoc(collection(db, 'connectionRequests'), {
      senderId,
      targetId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const rejectConnectionRequest = async (requestId) => {
  try {
    await updateDoc(doc(db, 'connectionRequests', requestId), { status: 'rejected' });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getConnectionStatus = async (currentUid, targetUid) => {
  try {
    // Check if connected
    const connSnap = await getDoc(doc(db, 'users', currentUid, 'connections', targetUid));
    if (connSnap.exists()) return 'connected';

    // Check if pending outgoing
    const sentSnap = await getDocs(
      query(collection(db, 'connectionRequests'),
        where('senderId', '==', currentUid),
        where('targetId', '==', targetUid),
        where('status', '==', 'pending'))
    );
    if (!sentSnap.empty) return 'pending_sent';

    // Check if pending incoming
    const recvSnap = await getDocs(
      query(collection(db, 'connectionRequests'),
        where('senderId', '==', targetUid),
        where('targetId', '==', currentUid),
        where('status', '==', 'pending'))
    );
    if (!recvSnap.empty) return 'pending_received';

    return 'none';
  } catch { return 'none'; }
};

export const getUserConnections = async (uid) => {
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'connections'));
    return { data: snap.docs.map(d => d.id), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

export const getSuggestedUsers = async (currentUid, connectedIds = [], limitCount = 9) => {
  try {
    const snap = await getDocs(query(collection(db, 'users'), limit(50)));
    const all = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.id !== currentUid && !connectedIds.includes(u.id));
    return { data: all.slice(0, limitCount), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// MESSAGING / CHATS
// ─────────────────────────────────────────────────────────────

export const getOrCreateChat = async (uid1, uid2) => {
  try {
    const participants = [uid1, uid2].sort();
    const chatId = participants.join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
      });
    }
    return { chatId, error: null };
  } catch (error) {
    return { chatId: null, error: error.message };
  }
};

export const subscribeChats = (uid, callback) => {
  const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid), orderBy('lastMessageTime', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const subscribeMessages = (chatId, callback) => {
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const sendMessage = async (chatId, senderId, text) => {
  try {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId,
      text,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId,
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

export const subscribeNotifications = (uid, callback) => {
  const q = query(
    collection(db, 'users', uid, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const markNotificationRead = async (uid, notifId) => {
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', notifId), { read: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markAllNotificationsRead = async (uid) => {
  try {
    const snap = await getDocs(query(collection(db, 'users', uid, 'notifications'), where('read', '==', false)));
    const updates = snap.docs.map(d => updateDoc(d.ref, { read: true }));
    await Promise.all(updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────

export const getRoleChangeRequests = (callback) => {
  const q = query(collection(db, 'roleChangeRequests'), where('status', '==', 'pending'), orderBy('requestDate', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const rejectRoleChange = async (requestId) => {
  try {
    await updateDoc(doc(db, 'roleChangeRequests', requestId), { status: 'rejected' });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const suspendUser = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), { profileStatus: 'suspended' });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const activateUser = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), { profileStatus: 'active' });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFlaggedContent = (callback) => {
  const q = query(collection(db, 'posts'), where('flagged', '==', true), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const getAdminUsers = (callback) => {
  const q = query(collection(db, 'adminUsers'), orderBy('promotedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};
