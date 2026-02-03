const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const prisma = require('@/models/prisma');
const bcrypt = require('bcrypt');
const { asyncHandler } = require('@/middlewares/asyncHandler');

// Cấu hình Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
                googleId: profile.id,
                authType: 'google'
            },
            create: {
                googleId: profile.id,
                authType: 'google',
                email: profile.emails[0].value,
                username: profile.displayName,
                password: 'google_password'
            }
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// Cấu hình Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = await prisma.user.upsert({
            where: { facebookId: profile.id },
            update: {
                facebookId: profile.id,
                authType: 'facebook'
            },
            create: {
                facebookId: profile.id,
                authType: 'facebook',
                email: profile.emails[0].value,
                username: profile.name.givenName + ' ' + profile.name.familyName,
                password: 'facebook_password'
            }
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// Cấu hình Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return done(null, false, { message: 'Email not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
        }
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;