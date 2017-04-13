//
// Handles getting and reading a message
//

'use strict';

const request = require('request');

module.exports = {
  handleIntent: function() {
    const garrett = 0;

    loadMessages(garrett, (err, messages) => {
      if (messages.length == 1) {
        this.emit(':tell', 'You have a message from ' + messages[0].from + ' - ' + messages[0].message);
      } else if (messages.length > 1) {
        let speech = 'You have ' + messages.length + ' messages. First message from ' + messages[0].from;
        const reprompt = 'Say more to hear more messages.';

        speech += (' - ' + messages[0].message + '. ' + reprompt);
        this.attributes['messages'] = messages;
        this.attributes['read'] = 0;
        this.emit(':ask', speech, reprompt);
      } else {
        this.emit(':tell', 'You have no messages');
      }
    });
  },
};

function loadMessages(userid, callback) {
  // Call the service to pull the song details
  request.get('http://localhost:3000/getmessages/?userid=' + userid, (err, res, body) => {
    console.log(body);
    callback(err, JSON.parse(body));
  });
}
