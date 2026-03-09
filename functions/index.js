const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// Shared utility: check if caller has any type of admin privilege
const isAnyAdmin = (context) => {
  return context.auth && (context.auth.token.admin === true || context.auth.token.superAdmin === true);
};

// Shared utility: check if caller is specifically a superAdmin
const isSuperAdmin = (context) => {
  return context.auth && context.auth.token.superAdmin === true;
};

admin.initializeApp();
const db = admin.firestore();

// 1. Trigger when a new user registers
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    // Use merge:true so we don't overwrite data already written by the frontend
    // (Auth.jsx writes firstName, lastName, role, phone, etc. immediately after signup)
    const userDoc = {
      contactEmail: user.email || '',
      phoneNumber: user.phoneNumber || '',
      profileStatus: 'pending',       // will be upgraded to 'completed' by onboarding
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await db.collection('users').doc(user.uid).set(userDoc, { merge: true });
    
    // Set default custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: false, superAdmin: false });
    
    return null;
  } catch (error) {
    console.error('Error in onUserCreated:', error);
    return null;
  }
});

// 2. Request a role change
exports.requestRoleChange = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }
  
  const { newRole, justification } = data;
  
  if (!newRole || !justification) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing newRole or justification.');
  }
  
  const requestDoc = {
    userId: context.auth.uid,
    requestedRole: newRole,
    status: 'pending',
    requestDate: admin.firestore.FieldValue.serverTimestamp(),
    justification: justification
  };
  
  await db.collection('roleChangeRequests').add(requestDoc);
  return { success: true, message: 'Role request submitted.' };
});

// 3. Admin: Approve Role Change
exports.approveRoleChange = functions.https.onCall(async (data, context) => {
  if (!isAnyAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can approve role changes.');
  }
  
  const { requestId } = data;
  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing requestId.');
  }
  
  const requestRef = db.collection('roleChangeRequests').doc(requestId);
  const requestSnap = await requestRef.get();
  
  if (!requestSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Role request not found.');
  }
  
  const requestData = requestSnap.data();
  if (requestData.status !== 'pending') {
    throw new functions.https.HttpsError('failed-precondition', 'Request is already processed.');
  }
  
  const batch = db.batch();
  
  // Update Role Request
  batch.update(requestRef, {
    status: 'approved',
    adminId: context.auth.uid,
    processedDate: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Update User Core Document
  const userRef = db.collection('users').doc(requestData.userId);
  batch.update(userRef, { role: requestData.requestedRole });
  
  // Update Auth Custom Claims
  await admin.auth().setCustomUserClaims(requestData.userId, { 
    role: requestData.requestedRole,
  });
  
  await batch.commit();
  
  return { success: true, message: 'Role changed to ' + requestData.requestedRole };
});

// 4. Admin: Suspend User
exports.suspendUser = functions.https.onCall(async (data, context) => {
  if (!isAnyAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can suspend users.');
  }
  
  const { targetUid, reason } = data;
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing targetUid.');
  }
  
  // Update User Profile
  await db.collection('users').doc(targetUid).update({
    profileStatus: 'suspended'
  });
  
  // Log Admin Action
  await db.collection('adminLogs').add({
    adminId: context.auth.uid,
    action: 'suspendUser',
    targetId: targetUid,
    reason: reason || 'No reason provided',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
});

// 5. Admin: Delete Content Globally
exports.deleteContent = functions.https.onCall(async (data, context) => {
  if (!isAnyAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete content.');
  }
  
  const { collectionPath, docId, reason } = data;
  if (!collectionPath || !docId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing collectionPath or docId.');
  }
  
  await db.collection(collectionPath).doc(docId).delete();
  
  // Log Admin Action
  await db.collection('adminLogs').add({
    adminId: context.auth.uid,
    action: 'deleteContent',
    targetPath: `${collectionPath}/${docId}`,
    reason: reason || 'Moderation',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
});

// 6. Messaging: Update chat metadata on new message
exports.onMessageCreated = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const newMessage = snap.data();
    const chatId = context.params.chatId;

    await db.collection('chats').doc(chatId).set({
      lastMessage: newMessage.text || '📸 Media',
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
      lastSenderId: newMessage.senderId
    }, { merge: true });

    return null;
  });

// 7. Connections: Accept Connection Request
exports.acceptConnection = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  
  const { requestId } = data;
  const requestRef = db.collection('connectionRequests').doc(requestId);
  const requestSnap = await requestRef.get();
  
  if (!requestSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Request not found.');
  }
  
  const requestData = requestSnap.data();
  if (requestData.targetId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized to accept this request.');
  }

  const batch = db.batch();
  
  // Update request status
  batch.update(requestRef, { status: 'accepted', acceptedAt: admin.firestore.FieldValue.serverTimestamp() });
  
  // Create connection for both users
  const user1Ref = db.collection('users').doc(requestData.senderId).collection('connections').doc(requestData.targetId);
  const user2Ref = db.collection('users').doc(requestData.targetId).collection('connections').doc(requestData.senderId);
  
  batch.set(user1Ref, { 
    connectedSince: admin.firestore.FieldValue.serverTimestamp(),
    connectedTo: requestData.targetId
  });
  
  batch.set(user2Ref, {
    connectedSince: admin.firestore.FieldValue.serverTimestamp(),
    connectedTo: requestData.senderId
  });
  
  await batch.commit();
  return { success: true };
});

// 8. Jobs: Create Job Posting (Recruiter Only)
exports.createJobPosting = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  
  // Validate role from custom claims
  const userRole = context.auth.token.role;
  if (userRole !== 'Recruiter' && !isAnyAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Only recruiters can post jobs.');
  }
  
  const { title, company, description, location, type } = data;
  
  if (!title || !company || !description) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing job details.');
  }
  
  const jobDoc = {
    recruiterId: context.auth.uid,
    title,
    company,
    description,
    location: location || 'Remote',
    type: type || 'Full-time',
    status: 'open',
    postedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  const docRef = await db.collection('jobs').add(jobDoc);
  return { success: true, jobId: docRef.id };
});

// 9. Reject Role Change
exports.rejectRoleChange = functions.https.onCall(async (data, context) => {
  if (!isAnyAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can reject role changes.');
  }
  const { requestId } = data;
  if (!requestId) throw new functions.https.HttpsError('invalid-argument', 'Missing requestId.');

  const requestRef = db.collection('roleChangeRequests').doc(requestId);
  await requestRef.update({
    status: 'rejected',
    adminId: context.auth.uid,
    processedDate: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, message: 'Role request rejected.' };
});

// 10. Like/Unlike Post (atomic)
exports.likePost = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const { postId } = data;
  if (!postId) throw new functions.https.HttpsError('invalid-argument', 'Missing postId.');

  const likeRef = db.collection('posts').doc(postId).collection('likes').doc(context.auth.uid);
  const postRef = db.collection('posts').doc(postId);
  const likeSnap = await likeRef.get();

  if (likeSnap.exists) {
    await likeRef.delete();
    await postRef.update({ likesCount: admin.firestore.FieldValue.increment(-1) });
    return { liked: false };
  } else {
    await likeRef.set({ likedAt: admin.firestore.FieldValue.serverTimestamp() });
    await postRef.update({ likesCount: admin.firestore.FieldValue.increment(1) });
    return { liked: true };
  }
});

// 11. Flag Content
exports.flagContent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const { postId, reason } = data;
  if (!postId) throw new functions.https.HttpsError('invalid-argument', 'Missing postId.');

  await db.collection('posts').doc(postId).update({ flagged: true, flagReason: reason || '' });
  await db.collection('adminLogs').add({
    action: 'flagContent',
    reporterId: context.auth.uid,
    targetId: postId,
    reason: reason || '',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

// 12. SuperAdmin/Admin: Make User an Admin
exports.makeAdmin = functions.https.onCall(async (data, context) => {
  if (!isAnyAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can promote users to admin.');
  }
  
  const { email } = data;
  if (!email) throw new functions.https.HttpsError('invalid-argument', 'Missing email.');

  try {
    const user = await admin.auth().getUserByEmail(email);
    const existingClaims = user.customClaims || {};
    
    // Safety check: Cannot alter a superAdmin's claims using this function
    if (existingClaims.superAdmin === true) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot modify super admin privileges.');
    }

    await admin.auth().setCustomUserClaims(user.uid, { ...existingClaims, admin: true });
    
    // Store in adminUsers collection for the frontend dashboard
    await db.collection('adminUsers').doc(user.uid).set({
      email: user.email,
      name: user.displayName || 'Unnamed User',
      type: 'admin',
      promotedAt: admin.firestore.FieldValue.serverTimestamp(),
      promotedBy: context.auth.uid
    });
    
    // Log Admin Action
    await db.collection('adminLogs').add({
      adminId: context.auth.uid,
      action: 'makeAdmin',
      targetEmail: email,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: `Successfully made ${email} an admin.` };
  } catch (error) {
    if (error.code === 'auth/user-not-found') throw new functions.https.HttpsError('not-found', 'User not found.');
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 13. SuperAdmin: Remove an Admin
exports.removeAdmin = functions.https.onCall(async (data, context) => {
  if (!isSuperAdmin(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Only Super Admins can revoke admin privileges.');
  }
  
  const { uid } = data;
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'Missing user ID.');

  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError('invalid-argument', 'You cannot revoke your own super admin privileges.');
  }

  try {
    const user = await admin.auth().getUser(uid);
    const existingClaims = user.customClaims || {};

    if (existingClaims.superAdmin === true) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot revoke another super admin.');
    }
    
    // Strip the admin claim
    await admin.auth().setCustomUserClaims(user.uid, { ...existingClaims, admin: false });
    
    // Remove from frontend tracker
    await db.collection('adminUsers').doc(user.uid).delete();
    
    // Log Admin Action
    await db.collection('adminLogs').add({
      adminId: context.auth.uid,
      action: 'removeAdmin',
      targetUid: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: `Successfully removed admin privileges from ${user.email}.` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});


