# Role Service

**Service name:** Role Service

**Service description:** Handles dynamic role assignment, role-specific feature enablement, and role transition requests which require backend Administrative approval.

**Service endpoints:** 
(Cloud Functions)
- `POST /requestRoleChange` (Payload: { newRole, justification })
- `GET /roleChangeRequests` (Admin privileged fetch)
- `POST /approveRoleChange` (Admin approval mutation)

**Service database schema:** 
Firestore Collection: `roleChangeRequests`
Document ID: Assigned via `addDoc`
Fields:
- `userId` (string)
- `requestedRole` (string)
- `status` ('pending', 'approved', 'rejected')
- `requestDate` (timestamp)
- `adminId` (string, filled when acted upon)
- `justification` (string)

**Service security rules:** 
```javascript
match /roleChangeRequests/{requestId} {
  // Only the creator or an Admin can read the request
  allow read: if request.auth != null && (request.auth.uid == resource.data.userId || request.auth.token.admin == true);
  // Any authenticated user can submit a request for themselves
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
  // Only Admins can update/delete the request
  allow update, delete: if request.auth != null && request.auth.token.admin == true;
}
```

**Service testing procedures:** 
- Validate full role-transition flow (User Requests -> Submits Form -> Admin Reviews -> Approve -> Auth Claims update).
- Verify custom Firebase Auth Claims are modified correctly via Cloud Functions after approval.
- Ensure restricted read access to `roleChangeRequests` table.
