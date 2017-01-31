var express = require('express');
var path = require('path');
var stormpath = require('express-stormpath');
var storage = require('./storage');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));

app.use(stormpath.init(app, {
  expand: {
    customData: true
  }
}));

app.get('/', stormpath.getUser, function(req, res) {
  // If we have a user - let's see register them in our DB and retrieve the message
  var message;

  if (req.user) {
    storage.loadMessage(req.user.username, (message) => {
      res.render('home', {
        title: 'My Message Console',
        message: message.message
      });
    });
  }
  else {
    res.render('home', {
      title: 'My Message Console'
    });
  }
});

app.get('/message', function(req, res) {
  storage.loadMessage(req.query.username, (message) => {
      res.render('message', {
        title: 'My Message Console',
        username: req.query.username,
        message: message.message
      });
  });
});

app.on('stormpath.ready',function(){
  console.log('Stormpath Ready');
});

app.listen(3000);