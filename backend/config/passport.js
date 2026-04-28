const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Find existing user by Google ID or Email
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });

      if (!user) {
        // Register new user - defaults to 'student' role if created via Google, or gets it from state if possible
        // Actually, state parameter isn't easily accessible here if not passed correctly. We can let the frontend 
        // handle role selection after login, or default to student.
        // Automatically make the admin email a teacher, others become students
        const userEmail = profile.emails[0].value;
        const assignedRole = userEmail === process.env.EMAIL_USER ? 'teacher' : 'student';

        user = await User.create({
          googleId: profile.id,
          fullName: profile.displayName,
          email: userEmail,
          authMethod: 'google',
          profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          role: assignedRole 
        });
      } else if (!user.googleId) {
        // Link google account to existing email user
        user.googleId = profile.id;
        user.authMethod = 'google';
        if (!user.profilePicture && profile.photos && profile.photos[0]) {
          user.profilePicture = profile.photos[0].value;
        }
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
));

// Typically not needed since we use JWT, but good to have if we use session in future
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});
