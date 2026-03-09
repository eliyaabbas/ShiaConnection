# Auth Service

**Service name:** Authentication Service (Firebase Auth)

**Service description:** Manages user registration, login, session management, and password recovery. It integrates directly with Firebase Authentication to handle identity securely without custom token management overhead.

**Service endpoints:** 
(Firebase Client SDK Methods)
- `createUserWithEmailAndPassword(email, password)`
- `signInWithEmailAndPassword(email, password)`
- `signOut()`
- `sendPasswordResetEmail(email)`

**Service database schema:** 
No direct Firestore collections for raw credentials. Handled via Firebase Auth System.
- Fields managed by Firebase: `UID`, `Email`, `Password Hash`, `Display Name`, `Custom Claims (e.g., admin: true, role: 'Professional')`.

**Service security rules:** 
Built-in via Firebase Authentication. Only authenticated users can access the system's private Firestore collections.

**Service testing procedures:** 
- Verify sign-up with both valid and invalid email formats.
- Verify sign-in and session persistence mechanisms.
- Test password reset email delivery and fulfillment.
- Utilize Firebase Emulator Suite for local authentication flow verification.
