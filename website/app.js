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
  passport.authenticate('facebook', {scope: ['user_friends', 'email']}));

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
        loadFriends(fbres.id, fbres.name, (friendList) => {
          res.render('home', {title: 'My Message Console', userid: fbres.id,
            username: fbres.name, friendList: friendList});
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
  storage.loadSavedMessage(req.query.fromid, req.query.toid, (message) => {
    res.render('message', {
      title: 'My Message Console',
      fromid: req.query.fromid,
      toid: req.query.toid,
      toname: req.query.toname,
      message: message,
    });
  });
});

app.post('/savemessage', (req, res) => {
  // For now, we only support saving a message to yourself
  storage.saveMessage(req.body.fromid, req.body.toid, req.body.message, () => {
    res.redirect('/');
  });
});

// Return the list of messages for the given user
// This returns up to the last 100 messages in a single list
app.get('/getmessages', (req, res, next) => {
  storage.loadMyMessages(req.query.userid, (err, messages) => {
    if (err) {
      res.json(err);
    } else {
      const myMessages = [];
      let i;

      messages.sort((a, b) => (a.timestamp - b.timestamp));
      for (i = 0; i < Math.min(100, messages.length); i++) {
        myMessages.push(messages[i]);
      }
      res.json(myMessages);
    }
  });
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// Internal functions
function loadFriends(id, name, callback) {
  let friendList = [];

  FB.api('/me/friends', {fields: ['id', 'name']}, (fbres) => {
    if (fbres && !fbres.error) {
      friendList = fbres.data;
    } else if (fbres.error) {
      console.log('Error loading friends ' + JSON.stringify(fbres.error));
    }

    // Include you too in case you want to message yourself
    friendList.unshift({'name': name, 'id': id});
    callback(friendList);
  });
}
