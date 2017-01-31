/*
 * Handles DynamoDB storage
 */

"use strict";

var AWS = require("aws-sdk");

// Run locally if told to do so
if (process.env.LOCALDB) {
    AWS.config.update({
      region: "us-west-2",
      endpoint: "http://localhost:8000"
    });
}
else
{
    AWS.config.update({
      region: "us-west-2"
    });
}

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    return {
        loadMessage: function (username, callback) {
            dynamodb.getItem({ TableName: 'MyMessageData', Key: {UserID: {S: username} }}, (err, data) => {
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
        saveMessage: function(username, message, callback) {
            // Save a message associated with this user in our DB
            dynamodb.putItem({ TableName: 'MyMessageData',
                Item: { UserID: { S: username },
                    TimeStamp: { S: Date.now().toString() },
                    Message: { S: message } }}, (err, data) => {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };
})();

module.exports = storage;
