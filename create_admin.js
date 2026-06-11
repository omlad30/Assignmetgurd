const admin = require('./backend/firebaseAdmin');

async function createAdmin() {
  try {
    const userRecord = await admin.auth().createUser({
      email: 'ladom3003@gmail.com',
      password: 'om3003',
      emailVerified: true,
      displayName: 'Admin User',
    });
    console.log('Successfully created new user:', userRecord.uid);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists, updating password...');
      const user = await admin.auth().getUserByEmail('ladom3003@gmail.com');
      await admin.auth().updateUser(user.uid, {
        password: 'om3003'
      });
      console.log('Successfully updated password for existing user');
    } else {
      console.error('Error creating new user:', error);
    }
  }
}

createAdmin().then(() => process.exit(0));
