var express = require('express');
var path = require('path');
var stormpath = require('express-stormpath');

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
  res.render('home', {
    title: 'My Message Console'
  });
});

app.on('stormpath.ready',function(){
  console.log('Stormpath Ready');
});

app.listen(3000);