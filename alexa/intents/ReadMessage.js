//
// Handles reading more (or the next) message
//

'use strict';

module.exports = {
  readNext: function() {
    readMessage(this.attributes, this.emit, 1);
  },
  readSame: function() {
    readMessage(this.attributes, this.emit, 0);
  },
  readPrevious: function() {
    readMessage(this.attributes, this.emit, -1);
  },
};

function readMessage(attributes, emit, readIncrement) {
  // See if we have messages that we can read
  let speech = attributes['speech'] ? attributes['speech'] : '';
  let reprompt;
  const messages = attributes['messages'];

  attributes['speech'] = undefined;
  if (!messages) {
    emit(':tell', 'You haven\'t started reading messages yet.');
  } else {
    let read = parseInt(attributes['read']);

    if (isNaN(read)) {
      read = 0;
    }
    read += readIncrement;

    // Can they say previous, repeat, next?
    reprompt = 'You can say repeat to hear this message again';
    if (read < (messages.length - 1)) {
      reprompt += ' or next to hear the next message';
    }
    if (read > 0) {
      reprompt += ' or previous to hear the previous message';
    }
    reprompt += '.';

    if (read >= messages.length) {
      speech += 'You have already read all messages. ' + reprompt;
    } else if (read < 0) {
      speech += 'You were already on the first message. ' + reprompt;
    } else {
      // OK, we're going to read a message
      if (readIncrement > 0) {
        speech += 'Your next message is ';
      } else if (readIncrement == 0) {
        speech += 'You have a message ';
      } else if (readIncrement < 0) {
        speech += 'Your previous message is ';
      }

      speech += ('from ' + messages[read].from + '. ');
      speech += '<break time="200ms"/>';
      speech += messages[read].message;
      attributes['read'] = read;

      speech += ('.<break time="200ms"/> ' + reprompt);
    }

    emit(':ask', speech, reprompt);
  }
}
