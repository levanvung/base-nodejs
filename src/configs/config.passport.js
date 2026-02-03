const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('@/dbs/init.prisma'); 

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/v1/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: googleId },
                    { email: email }
                ]
            }
        });

        if (user) {
            if (!user.googleId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { 
                        googleId: googleId,
                        authType: 'google' 
                    }
                });
            }
            return done(null, user);
        }

        user = await prisma.user.create({
            data: {
                username: profile.displayName,
                email: email,
                googleId: googleId,
                authType: 'google',
                isVerified: true,
                password: ''
            }
        });

        done(null, user);

    } catch (error) {
        done(error, null);
    }
}));


passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, id));

module.exports = passport;