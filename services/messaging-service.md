# Messaging Service

**Service name:** Messaging Service

**Service description:** Provides low-latency, real-time peer-to-peer and group messaging utilizing Firestore real-time snapshot listeners.

**Service endpoints:** 
(Firestore Real-Time Subscriptions)
- `GET /conversations` - List active chat channels for the user
- `GET /conversations/{chatId}/messages` - Load history and stream new messages
- `POST /conversations/{chatId}/messages` - Append a new message

**Service database schema:** 
Firestore Collection: `conversations`
Fields:
- `participants` (array of `userId` strings)
- `lastMessageSnippet` (string)
- `lastUpdatedAt` (timestamp)
Subcollection: `messages`
Fields:
- `senderId` (string)
- `text` (string)
- `readBy` (array of `userId` strings)
- `timestamp` (timestamp)

**Service security rules:** 
```javascript
match /conversations/{chatId} {
  // Only users in the participant list can interact with the thread
  allow read, update: if request.auth != null && request.auth.uid in resource.data.participants;
  allow create: if request.auth != null && request.auth.uid in request.resource.data.participants;
  
  match /messages/{messageId} {
    allow read: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/conversations/$(chatId)).data.participants;
    allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
  }
}
```

**Service testing procedures:** 
- Setup multiple authenticated emulator sessions and verify cross-session message delivery.
- Ensure that users cannot spoof `senderId` in message writes.
- Validate conversation boundary security (User A cannot subscribe to User B's independent chats).
