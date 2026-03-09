# User Service

**Service name:** User Service

**Service description:** Centralizes management of user profile information, personal details, education, experience, and certifications. Acts as the core identity record beyond basic authentication.

**Service endpoints:** 
(Firestore SDK Methods and potential Cloud Functions for aggregations)
- `GET /users/{userId}` - Fetch user document
- `PUT /users/{userId}` - Update user profile attributes
- `POST /users` - Initialize profile after Auth trigger

**Service database schema:** 
Firestore Collection: `users`
Document ID: `{userId}` (Mapped from Auth UID)
Core Fields:
- `firstName`, `lastName`, `gender`, `dateOfBirth`, `phoneNumber`, `contactEmail`
- `role` (e.g., 'Professional', 'Skilled Worker', 'Student', 'Recruiter')
- `profileStatus` ('pending', 'active', 'suspended')
- Subcollections: `education`, `experience`, `skills`, `certifications`, `portfolio`

**Service security rules:** 
```javascript
match /users/{userId} {
  allow read: if request.auth != null; // Registered users can view profiles
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && request.auth.uid == userId;
  allow delete: if request.auth != null && request.auth.token.admin == true; // Admin only deletion
}
```

**Service testing procedures:** 
- Assert user creation triggers profile population.
- Verify read/write permissions via Firebase Emulator tests (ensure users can only update their own profile).
- Test limits on array updates/subcollections (e.g., maximum skills allowed).
