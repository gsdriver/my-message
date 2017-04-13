'use strict';

const Alexa = require('alexa-sdk');
const GetMessage = require('./intents/GetMessage');
const ReadMessage = require('./intents/ReadMessage');

// Handlers for our skill
const handlers = {
  'LaunchRequest': function() {
    this.emit('GetMessageIntent');
  },
  'GetMessageIntent': GetMessage.handleIntent,
  'AMAZON.NextIntent': ReadMessage.readNext,
  'AMAZON.PreviousIntent': ReadMessage.readPrevious,
  'AMAZON.RepeatIntent': ReadMessage.readSame,
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);

  alexa.registerHandlers(handlers);
  alexa.execute();
};
