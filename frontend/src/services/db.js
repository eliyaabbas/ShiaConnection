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
      resharesCount: 0,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'posts'), newPost);
    return { success: true, id: docRef.id, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const hasUserResharedPost = async (postId, userId) => {
  try {
    const snap = await getDoc(doc(db, 'posts', postId, 'reshares', userId));
    return snap.exists();
  } catch { return false; }
};

export const resharePost = async (post, uid) => {
  try {
    const targetPostId = post.isReshare ? post.originalPostId : post.id;
    const reshareRef = doc(db, 'posts', targetPostId, 'reshares', uid);
    const existing = await getDoc(reshareRef);
    if (existing.exists()) return { success: false, error: 'Already reshared' };

    const newPost = {
      authorId: uid,
      content: post.content,
      mediaUrl: post.mediaUrl || null,
      mediaType: post.mediaType || null,
      isReshare: true,
      originalPostId: targetPostId,
      originalAuthorId: post.isReshare ? post.originalAuthorId : post.authorId,
      likesCount: 0,
      commentsCount: 0,
      resharesCount: 0,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'posts'), newPost);
    
    await setDoc(reshareRef, { resharedAt: serverTimestamp(), newPostId: docRef.id });
    await updateDoc(doc(db, 'posts', targetPostId), { resharesCount: increment(1) });
    
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

export const getSentConnectionRequests = async (uid) => {
  try {
    const snap = await getDocs(query(collection(db, 'connectionRequests'), where('senderId', '==', uid), where('status', '==', 'pending')));
    return { data: snap.docs.map(d => d.data().targetId), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
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
      .filter(u => 
        u.id !== currentUid && 
        u.uid !== currentUid && 
        u.profileStatus === 'completed' &&
        !connectedIds.includes(u.id)
      );
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
        // Use a concrete timestamp so Firestore ordering works immediately
        lastMessageTime: new Date(0),
        readBy: {},
      });
    }
    return { chatId, error: null };
  } catch (error) {
    return { chatId: null, error: error.message };
  }
};

export const sendImageMessage = async (chatId, senderId, imageUrl) => {
  try {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId,
      text: '',
      imageUrl,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: '📷 Image',
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId,
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
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

// ─────────────────────────────────────────────────────────────
// SAVED POSTS
// ─────────────────────────────────────────────────────────────

export const savePost = async (uid, postId) => {
  try {
    await setDoc(doc(db, 'users', uid, 'savedPosts', postId), { savedAt: serverTimestamp() });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const unsavePost = async (uid, postId) => {
  try {
    await deleteDoc(doc(db, 'users', uid, 'savedPosts', postId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const isPostSaved = async (uid, postId) => {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'savedPosts', postId));
    return snap.exists();
  } catch { return false; }
};

export const getSavedPosts = async (uid) => {
  try {
    const savedSnap = await getDocs(query(collection(db, 'users', uid, 'savedPosts'), orderBy('savedAt', 'desc'), limit(30)));
    const postIds = savedSnap.docs.map(d => d.id);
    if (postIds.length === 0) return { data: [], error: null };
    const posts = await Promise.all(postIds.map(async pid => {
      const postSnap = await getDoc(doc(db, 'posts', pid));
      return postSnap.exists() ? { id: postSnap.id, ...postSnap.data() } : null;
    }));
    return { data: posts.filter(Boolean), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// CHAT READ RECEIPTS
// ─────────────────────────────────────────────────────────────

export const markChatRead = async (chatId, uid) => {
  try {
    await updateDoc(doc(db, 'chats', chatId), { [`readBy.${uid}`]: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// JOB APPLICATIONS (RECRUITER VIEW)
// ─────────────────────────────────────────────────────────────

export const getJobApplications = async (jobId) => {
  try {
    const snap = await getDocs(query(collection(db, 'jobs', jobId, 'applications'), orderBy('appliedAt', 'desc')));
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// POST EDITING & COMMENT DELETION
// ─────────────────────────────────────────────────────────────

export const updatePost = async (postId, content) => {
  try {
    await updateDoc(doc(db, 'posts', postId), { content, updatedAt: serverTimestamp() });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteComment = async (postId, commentId) => {
  try {
    await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
    await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(-1) });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// CONNECTIONS WITH PROFILES (for Messages new chat picker)
// ─────────────────────────────────────────────────────────────

export const getUserConnectionsWithProfiles = async (uid) => {
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'connections'));
    const ids = snap.docs.map(d => d.id);
    const profiles = await Promise.all(ids.map(async id => {
      const { data } = await getUserProfile(id);
      return data ? { id, ...data } : null;
    }));
    return { data: profiles.filter(Boolean), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN — JOBS MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const getAllJobs = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'jobs'), orderBy('postedAt', 'desc'), limit(100)));
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

export const closeJob = async (jobId) => {
  try {
    await updateDoc(doc(db, 'jobs', jobId), { status: 'closed' });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteJob = async (jobId) => {
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

