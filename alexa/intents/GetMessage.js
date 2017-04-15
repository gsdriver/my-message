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
      console.log(this.event.session.user['accessToken']);
      FB.setAccessToken(this.event.session.user['accessToken']);
      FB.api('/me', {fields: ['id']}, (res) => {
        if (!res || res.error) {
          if (res) {
            console.log(res.error);
          }
          this.emit(':tell', 'Sorry, an internal error occurred. Please try again later.');
        } else {
          loadMessages(res.id, (err, messages) => {
            if (err) {
              this.emit(':tell', 'Sorry, an internal error occurred. Please try again later.');
            } else {
              // Just "replay" the first message
              this.attributes['messages'] = messages;
              this.attributes['read'] = 0;
              this.emit('AMAZON.RepeatIntent');
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
