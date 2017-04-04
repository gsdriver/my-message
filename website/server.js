const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const stormpath = require('express-stormpath');
const storage = require('./storage');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(stormpath.init(app, {
  expand: {
    customData: true,
  },
}));

app.get('/', stormpath.getUser, (req, res) => {
  // If we have a user - let's see register them in our DB and retrieve the message
  if (req.user) {
    storage.loadMessage(req.user.username, (message) => {
      res.render('home', {
        title: 'My Message Console',
        message: message,
      });
    });
  } else {
    res.render('home', {
      title: 'My Message Console',
    });
  }
});

app.get('/message', (req, res) => {
  storage.loadMessage(req.query.username, (message) => {
    res.render('message', {
      title: 'My Message Console',
      username: req.query.username,
      message: message,
    });
  });
});

app.post('/savemessage', (req, res) => {
  storage.saveMessage(req.body.username, req.body.message, () => {
    res.redirect('/');
  });
});

app.on('stormpath.ready', () => {
  console.log('Stormpath Ready');
});

app.listen(3000);
