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

    function Message(username, message) {
        this._username = username;
        this.message = message;
    }

    Message.prototype = {
        save: function (callback) {
            // Save a message associated with this user in our DB
            dynamodb.putItem({
                TableName: 'MyMessageData',
                Item: {
                    UserID: {
                        S: this._username
                    },
                    TimeStamp: {
                        S: Date.now().toString()
                    },
                    Message: {
                        S: this.message
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        loadMessage: function (username, callback) {
            dynamodb.getItem({
                TableName: 'MyMessageData',
                Key: {
                    UserID: {
                        S: username
                    }
                }
            }, function (err, data) {
                var message;
                if (err) {
                    console.log(err, err.stack);
                    callback(new Message(username));
                } else if (data.Item === undefined) {
                    callback(new Message(username));
                } else {
                    callback(new Message(username, data.Item.Message.S));
                }
            });
        }
    };
})();

module.exports = storage;
