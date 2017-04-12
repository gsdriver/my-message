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
    // Loads the message that a user has created (for now, just the one they created for themselves)
    loadSavedMessage: function(userid, callback) {
      dynamodb.getItem({TableName: 'MyMessageData',
        Key: {FromUserID: {S: userid}, ToUserID: {S: userid}}}, (err, data) => {
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
    // Loads all messages for a given user (could be from multiple users)
    loadMyMessages: function(userid, callback) {
      var params = {};

      params.TableName = 'MyMessageData';
      params.KeyConditionExpression = '#D = :partitionkeyval';
      params.ExpressionAttributeValues = {':partitionkeyval': {S: userid}};
      params.ExpressionAttributeNames = {'#D': 'ToUserID'};
      dynamodb.query(params, function(error, data) {
        if (error || (data.Items == undefined)) {
          // Sorry, we don't have messages for this user
          console.log("Error " + error + " data " + JSON.stringify(data));
          callback("No messages for " + userid, null);
        } else {
          // Process into an array
          const votes = [];

          data.Items.forEach(vote => {
            const voteData = {date: vote.date.S, userID: vote.userID.S, vote: vote.vote.S};
            votes.push(voteData);
          });

          callback(null, votes);
        }
      });
    },
    saveMessage: function(fromUserID, toUserID, message, callback) {
      // Save a message associated with this user in our DB
      dynamodb.putItem({TableName: 'MyMessageData',
        Item: {FromUserID: {S: fromUserID},
          ToUserID: {S: toUserID},
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
