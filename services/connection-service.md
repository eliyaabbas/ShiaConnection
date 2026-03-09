# Connection Service

**Service name:** Connection Service

**Service description:** Manages the professional networking graph by handling connection requests, accepting/declining logic, and listing a user's connections.

**Service endpoints:** 
(Firestore Mutation Triggers)
- `POST /connections/request` - Dispatch connection request event
- `POST /connections/accept` - Morph request to 'connected' state
- `POST /connections/reject` - Nullify request state
- `GET /connections` - Query associated connected profiles

**Service database schema:** 
Firestore Collection: `connections`
Fields:
- `requesterId` (string)
- `receiverId` (string)
- `status` ('pending', 'connected', 'declined')
- `timestamp` (timestamp)

**Service security rules:** 
```javascript
match /connections/{connId} {
  allow read: if request.auth != null && (request.auth.uid == resource.data.requesterId || request.auth.uid == resource.data.receiverId);
  allow create: if request.auth != null && request.auth.uid == request.resource.data.requesterId;
  allow update: if request.auth != null && request.auth.uid == resource.data.receiverId; // Usually the receiver updates state
  allow delete: if request.auth != null && (request.auth.uid == resource.data.requesterId || request.auth.uid == resource.data.receiverId);
}
```

**Service testing procedures:** 
- Assert rejection when self-connecting or sending duplicate requests.
- Validate read streams correctly update when 'pending' changes to 'connected'.
- Assert users can successfully sever (delete) a connection from either side.
