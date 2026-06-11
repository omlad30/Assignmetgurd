const admin = require('./firebaseAdmin');

const clearUsers = async () => {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const uids = listUsersResult.users.map((userRecord) => userRecord.uid);
    
    if (uids.length > 0) {
      await admin.auth().deleteUsers(uids);
      console.log(`Successfully deleted ${uids.length} users from Firebase.`);
    } else {
      console.log('No users found in Firebase to delete.');
    }
  } catch (error) {
    console.error('Error deleting users:', error);
  } finally {
    process.exit();
  }
};

clearUsers();
