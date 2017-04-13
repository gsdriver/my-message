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
  let speech;
  const messages = attributes['messages'];

  if (!messages) {
    emit(':tell', 'You haven\'t started reading messages yet.');
  } else {
    let read = parseInt(attributes['read']);

    if (isNaN(read)) {
      read = 0;
    }
    read += readIncrement;

    if (read >= messages.length) {
      emit(':tell', 'You have already read all messages.');
    } else {
      // OK, we're going to read a message
      if (readIncrement > 0) {
        speech = 'Your next message is ';
      } else if (readIncrement == 0) {
        speech = 'You have a message ';
      } else if (readIncrement < 0) {
        speech = 'Your previous message is ';
      }

      speech += ('from ' + messages[read].from + ' - ');
      speech += messages[read].message;
      attributes['read'] = read;

      if (read == (messages.length - 1)) {
        // Now reading the last one
        emit(':tell', speech);
      } else {
        // There are still more messages
        const reprompt = 'Say more to hear more messages.';
        speech += ('. ' + reprompt);
        emit(':ask', speech, reprompt);
      }
    }
  }
}
