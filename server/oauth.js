import Express from 'express';
import passport from 'passport';
import SpotifyPassport from 'passport-spotify'

const router = Express.Router();

const { env } = process;
const SpotifyStrategy = SpotifyPassport.Strategy;


const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    URL
} = env;

passport.use(
    new SpotifyStrategy({
        clientID: SPOTIFY_CLIENT_ID,
        clientSecret: SPOTIFY_CLIENT_SECRET,
        callbackURL: URL + '/callback',
        scope:'playlist-modify-public'
    },
        (accessToken, refreshToken, expires_in, profile, done) => {
            return done(null, { profile, accessToken });
        })
)

router.get('/', passport.authenticate('spotify'))
router.get('/callback',
    passport.authenticate('spotify', {
        failureRedirect: '/auth'
    }),
    (req, res) => {
        res.json({ user: req.user });
    }
)

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})

router.get('/session', (req, res) => {
    res.json({ user: req.user })
})

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

export default router;