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

const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const storage = (() => {
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
      const params = {};

      params.TableName = 'MyMessageData';
      params.KeyConditionExpression = '#D = :partitionkeyval';
      params.ExpressionAttributeValues = {':partitionkeyval': {S: userid}};
      params.ExpressionAttributeNames = {'#D': 'ToUserID'};
      dynamodb.query(params, (error, data) => {
        if (error || (data.Items == undefined)) {
          // Sorry, we don't have messages for this user
          console.log('Error ' + error + ' data ' + JSON.stringify(data));
          callback('No messages for ' + userid, null);
        } else {
          // Process into an array
          const messages = [];
          const userids = [];

          // Start by loading the names of all users
          data.Items.forEach((message) => {
            userids.push(message.FromUserID.S);
          });
          getUserNames(userids, (err, usernames) => {
            data.Items.forEach((message) => {
              let name;

              if (usernames && usernames[message.FromUserID.S]) {
                name = usernames[message.FromUserID.S];
              } else {
                name = 'Unknown user';
              }

              const msgData = {from: name, message: message.Message.S,
                timestamp: message.TimeStamp.S};
              messages.push(msgData);
            });

            callback(null, messages);
          });
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

// Internal functions
function getUserNames(userIDs, callback) {
  const params = {};
  const userKeys = [];
  const users = {};

  userIDs.forEach((userID) => userKeys.push({UserID: {S: userID}}));
  params.RequestItems = {};
  params.RequestItems.MyMessageUsers = {};
  params.RequestItems.MyMessageUsers.Keys = userKeys;
  dynamodb.batchGetItem(params, (error, data) => {
    if (error || (data.Responses == undefined)) {
      // Sorry, we weren't able to load these users
      console.log('batchGetItem failed ' + error);
      callback('Couldn\'t load users', null);
    } else {
      // Process into an array
      data.Responses.MyMessageUsers.forEach((userData) => {
        let name;

        if (userData.name && userData.name.S && (userData.name.S.length > 0)) {
          name = userData.name.S;
        } else {
          name = 'Unknown user';
        }

        users[userData.UserID.S] = name;
      });

      callback(null, users);
    }
  });
}

module.exports = storage;
