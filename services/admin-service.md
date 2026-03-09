# Admin Service

**Service name:** Admin Service

**Service description:** Centralized moderation and platform-level operations capabilities securely gated by admin tokens.

**Service endpoints:** 
(Cloud Functions / Admin REST integrations)
- `POST /admin/suspendUser` - Banish actor
- `POST /admin/deleteContent` - Global delete override
- `GET /admin/platformMetrics` - Retrieve site-wide stats

**Service database schema:** 
Firestore Collection: `adminLogs` (Audit trail)
Fields:
- `adminId` (string)
- `action` (string)
- `targetId` (string)
- `timestamp` (timestamp)

Document: `platformStats/global`
- `totalUsers` (number)
- `activeJobs` (number)
- `totalPosts` (number)

**Service security rules:** 
```javascript
match /adminLogs/{logId} {
  // Completely locked out from client writes. Written exclusively by Backend SDKs.
  allow read: if request.auth != null && request.auth.token.admin == true;
  allow write: if false; 
}

// Global rule placement (handled carefully based on rule precedence)
match /{document=**} {
  allow read, write: if request.auth != null && request.auth.token.admin == true; 
}
```

**Service testing procedures:** 
- Force verify regular client tokens cannot ever read or write the `adminLogs`.
- Trigger backend admin event and assert cloud function generates the corresponding audit log.
- Ensure 'Global Rule Override' properly manages content irrespective of original authors.
