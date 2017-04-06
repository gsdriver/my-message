const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const Strategy = require('passport-facebook').Strategy;
const storage = require('./storage');
const FB = require('facebook-node');

// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_TOKEN,
    callbackURL: process.env.FB_CALLBACK + '/login/facebook/return',
    profileFields: ['id', 'displayName', 'email'],
  }, (accessToken, refreshToken, profile, cb) => {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    return cb(null, profile);
}));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Login pages to do OAuth
app.get('/login/facebook',
  passport.authenticate('facebook', {scope: ['email']}));

app.get('/login/facebook/return',
  passport.authenticate('facebook', {failureRedirect: '/'}), (req, res) => {
    // OK, register the user and show them the song
    storage.registerUser(req.user._json.id, req.user._json.name, req.user._json.email, (err) => {
      // Great, go back to the main page
      console.log('Registered user');
      res.redirect('/');
    });
});

app.get('/', (req, res, next) => {
  res.render('index', {title: 'My Message Console', fbAppID: process.env.CLIENT_ID});
});

app.post('/home', (req, res) => {
  // If we have a user - let's see register them in our DB and retrieve the message
  if (req.body.accessToken) {
    FB.setAccessToken(req.body.accessToken);
    FB.api('/me', {fields: ['id', 'name']}, (fbres) => {
      if (fbres && !fbres.error) {
        storage.loadMessage(fbres.id, (message) => {
          res.render('home', {title: 'My Message Console', userid: fbres.id,
            username: fbres.name, message: message});
        });
      } else {
        res.render('home', {title: 'My Message Console'});
      }
    });
  } else {
    res.render('home', {title: 'My Message Console'});
  }
});

app.get('/message', (req, res) => {
  storage.loadMessage(req.query.id, (message) => {
    res.render('message', {
      title: 'My Message Console',
      userid: req.query.id,
      message: message,
    });
  });
});

app.post('/savemessage', (req, res) => {
  storage.saveMessage(req.body.userid, req.body.message, () => {
    res.redirect('/');
  });
});

app.on('stormpath.ready', () => {
  console.log('Stormpath Ready');
});

app.listen(3000);


