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

// Helper to create notifications
const createNotification = async (userId, notificationParams) => {
  try {
    await db.collection('users').doc(userId).collection('notifications').add({
      ...notificationParams,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error(`Failed to create notification for user ${userId}`, err);
  }
};

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

  await createNotification(requestData.userId, {
    senderId: context.auth.uid,
    type: 'role_approved',
    message: `approved your request for the role: ${requestData.requestedRole}.`
  });
  
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

  // Increment connectionsCount on both profiles
  batch.update(db.collection('users').doc(requestData.senderId), { connectionsCount: admin.firestore.FieldValue.increment(1) });
  batch.update(db.collection('users').doc(requestData.targetId), { connectionsCount: admin.firestore.FieldValue.increment(1) });
  
  await batch.commit();

  await createNotification(requestData.senderId, {
    senderId: context.auth.uid,
    type: 'connection_accepted',
    message: 'accepted your connection request.'
  });

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
  
  const snap = await requestRef.get();
  if (snap.exists) {
    await createNotification(snap.data().userId, {
      senderId: context.auth.uid,
      type: 'role_rejected',
      message: 'rejected your role change request.'
    });
  }

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
  
  const [likeSnap, postSnap] = await Promise.all([likeRef.get(), postRef.get()]);

  if (likeSnap.exists) {
    await likeRef.delete();
    await postRef.update({ likesCount: admin.firestore.FieldValue.increment(-1) });
    return { liked: false };
  } else {
    await likeRef.set({ likedAt: admin.firestore.FieldValue.serverTimestamp() });
    await postRef.update({ likesCount: admin.firestore.FieldValue.increment(1) });
    
    if (postSnap.exists && postSnap.data().authorId !== context.auth.uid) {
      await createNotification(postSnap.data().authorId, {
        senderId: context.auth.uid,
        type: 'post_like',
        message: 'liked your post.'
      });
    }

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

// 14. Triggers for generating notifications
exports.onConnectionRequestCreated = functions.firestore
  .document('connectionRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (data && data.targetId && data.senderId) {
      await createNotification(data.targetId, {
        senderId: data.senderId,
        type: 'connection_request',
        message: 'sent you a connection request.'
      });
    }
  });

exports.onCommentCreated = functions.firestore
  .document('posts/{postId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const postId = context.params.postId;
    
    try {
      const postSnap = await db.collection('posts').doc(postId).get();
      if (postSnap.exists) {
        const postAuthorId = postSnap.data().authorId;
        if (postAuthorId && postAuthorId !== data.authorId) {
          await createNotification(postAuthorId, {
            senderId: data.authorId,
            type: 'post_comment',
            message: 'commented on your post.'
          });
        }
      }
    } catch (err) {
      console.error(`Error notifying author of post ${postId} about new comment.`, err);
    }
  });

// Delete Account
exports.deleteAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const uid = context.auth.uid;

  // Delete subcollections
  const deleteCollection = async (colRef) => {
    const snap = await colRef.get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    if (!snap.empty) await batch.commit();
  };

  try {
    await deleteCollection(db.collection('users').doc(uid).collection('notifications'));
    await deleteCollection(db.collection('users').doc(uid).collection('connections'));
    // Delete user doc
    await db.collection('users').doc(uid).delete();
    // Delete the Firebase Auth account
    await admin.auth().deleteUser(uid);
    return { success: true };
  } catch (err) {
    console.error('Error deleting account for', uid, err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});

// 15. Parse ATS Resume (Backend)
exports.parseResume = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to parse resume.');
  }

  const { fileData, fileType } = data;
  if (!fileData || !fileType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing fileData or fileType.');
  }

  try {
    const buffer = Buffer.from(fileData, 'base64');
    let text = '';

    if (fileType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && !fileType.includes('docx') && !fileType.includes('word')) {
      throw new functions.https.HttpsError('invalid-argument', 'Unsupported file type. Please upload a .docx file.');
    }

    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: buffer });
    text = result.value;

    // --- Regex Logic ---
    const parsedData = {
      firstName: '', lastName: '', email: '', phone: '',
      linkedIn: '', jobTitle: '', university: '', company: '', skills: []
    };

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) parsedData.email = emailMatch[1].trim();

    const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/i;
    const simplePhoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const phoneMatch = text.match(phoneRegex) || text.match(simplePhoneRegex);
    if (phoneMatch) parsedData.phone = phoneMatch[0].trim();

    const linkedInRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i;
    const linkedInMatch = text.match(linkedInRegex);
    if (linkedInMatch) parsedData.linkedIn = 'https://' + linkedInMatch[1];

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,2}$/.test(line)) {
        const lower = line.toLowerCase();
        if (!lower.includes("resume") && !lower.includes("curriculum") && !lower.includes("cv")) {
          const parts = line.split(' ');
          parsedData.firstName = parts[0];
          parsedData.lastName = parts.slice(1).join(' ');
          break;
        }
      }
    }

    const jobTitleRegex = /(Software Engineer|Frontend Developer|Backend Developer|Full Stack Engineer|Data Scientist|Product Manager|Project Manager|UI\/UX Designer|Graphic Designer|Marketing Manager|Sales Executive|Accountant|Financial Analyst|HR Manager|Teacher|Nurse|Doctor|Electrician|Plumber)/i;
    const jobMatch = text.match(jobTitleRegex);
    if (jobMatch) parsedData.jobTitle = jobMatch[1];

    const uniRegex = /([A-Za-z\s]+ (University|College|Institute|Academy)(?: of [A-Za-z\s]+)?)/i;
    const uniMatch = text.match(uniRegex);
    if (uniMatch) parsedData.university = uniMatch[0].trim();

    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#', 
      'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
      'HTML', 'CSS', 'Tailwind', 'Git', 'Agile', 'Scrum', 'Figma', 'Photoshop',
      'Excel', 'Accounting', 'Salesforce', 'Marketing', 'SEO', 'Leadership', 'Management'
    ];
    const lowerText = text.toLowerCase();
    for (const skill of commonSkills) {
      const escapedSkill = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-z0-9])${escapedSkill}(?:[^a-z0-9]|$)`, 'i');
      if (regex.test(lowerText)) parsedData.skills.push(skill);
    }

    return { success: true, data: parsedData };
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to parse resume: ' + error.message);
  }
});
