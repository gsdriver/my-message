//
// Handles getting and reading a message
//

'use strict';

const request = require('request');
const FB = require('facebook-node');
const querystring = require('querystring');

module.exports = {
  handleIntent: function() {
    // Do they have an access token?  If not, prompt that they need one
    if (!this.event.session.user['accessToken']) {
      this.emit(':tellWithLinkAccountCard',
        'In order to use My Messages, please go to your Alexa app and link to your Facebook account');
    } else {
      // Get the ID and name from the access token so we can record the vote
      FB.setAccessToken(this.event.session.user['accessToken']);
      FB.api('/me', {fields: ['id']}, (res) => {
        if (!res || res.error) {
          if (res) {
            console.log(res.error);
          }
          this.emit(':tell', 'Sorry, an internal error occurred please try again later.');
        } else {
        console.log(res.id);
          loadMessages(res.id, (err, messages) => {
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
        }
      });
    }
  },
};

function loadMessages(userid, callback) {
  // Call the service to pull the song details
  let url = 'http://sample-env.4awvdjvbax.us-west-2.elasticbeanstalk.com/getmessages/?';

  url += querystring.stringify({userid: userid});
  request.get(url, (err, res, body) => {
    console.log(body);
    callback(err, JSON.parse(body));
  });
}
