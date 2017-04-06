/*
 * Handles DynamoDB storage
 */

'use strict';

const AWS = require('aws-sdk');

// Run locally if told to do so
if (process.env.LOCALDB) {
  AWS.config.update({
    region: 'us-west-2',
    endpoint: 'http://localhost:8000',
  });
  } else {
    AWS.config.update({
    region: 'us-west-2',
  });
}

const storage = (() => {
  const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

  return {
    // Registers a new user in our User DB
    registerUser: function(userID, name, email, callback) {
      dynamodb.putItem({TableName: 'MyMessageUsers', Item: {UserID: {S: userID},
        name: {S: (name) ? name : ''}, email: {S: email}}}, (err, data) => {
        // We only need to pass the error back - no other data to return
        if (callback) {
          callback(err);
        }
      });
    },
    loadMessage: function(userid, callback) {
      dynamodb.getItem({TableName: 'MyMessageData', Key: {UserID: {S: userid}}}, (err, data) => {
        if (err) {
          console.log(err, err.stack);
          callback(null);
       } else if (data.Item === undefined) {
          callback(null);
        } else {
          callback(data.Item.Message.S);
        }
    });
  },
    saveMessage: function(userid, message, callback) {
      // Save a message associated with this user in our DB
      dynamodb.putItem({TableName: 'MyMessageData',
        Item: {UserID: {S: userid},
          TimeStamp: {S: Date.now().toString()},
          Message: {S: message}}}, (err, data) => {
        if (err) {
          console.log(err, err.stack);
        }
        if (callback) {
          callback();
        }
      });
    },
  };
})();

module.exports = storage;
