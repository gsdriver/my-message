'use strict';

const Alexa = require('alexa-sdk');
const request = require('request');

// Handlers for our skill
const handlers = {
  'LaunchRequest': function() {
    this.emit('HelloWorldIntent');
  },
  'GetMessageIntent': function() {
    this.emit(':tell', 'Here\'s your message!');
  },
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);

  alexa.registerHandlers(handlers);
  alexa.execute();
};

function loadSong(callback) {
  // Call the service to pull the song details
  request.get('http://localhost:3000/song', (err, res, body) => {
    console.log(body);
    callback(err, JSON.parse(body));
  });
}
