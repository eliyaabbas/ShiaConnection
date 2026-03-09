const admin = require('firebase-admin');

// 1. Initialize Firebase Admin SDK
// Required: process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
// Required: process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({ projectId: 'shia-connection-local' });

const emailToPromote = process.argv[2];

if (!emailToPromote) {
  console.error('❌ Please provide the email address you want to make Super Admin.');
  console.error('Usage: node setupSuperAdmin.js <email@example.com>');
  process.exit(1);
}

async function makeSuperAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found user: ${user.uid}`);
    
    // Grant the ultimate custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      superAdmin: true
    });
    
    console.log(`✅ Granted '{ admin: true, superAdmin: true }' custom claims.`);

    // Add to the admin tracking collection so it appears in the UI
    const db = admin.firestore();
    await db.collection('adminUsers').doc(user.uid).set({
      email: user.email,
      name: user.displayName || 'The Creator',
      type: 'super_admin',
      promotedAt: admin.firestore.FieldValue.serverTimestamp(),
      systemGenerated: true
    });

    console.log(`✅ Added to 'adminUsers' Firestore collection.`);
    console.log(`\n🎉 Success! ${email} is now a Super Admin.`);
    console.log(`You can now log in at http://localhost:5174/admin/login`);

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User with email ${email} does not exist. Please register them in the browser first.`);
    } else {
      console.error('❌ Error:', error);
    }
  }
}

makeSuperAdmin(emailToPromote);
