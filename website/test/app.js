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

function createMessages(callback) {
  var dynamodb = new AWS.DynamoDB();
  var params = {
    TableName : 'MyMessageData',
    KeySchema: [
      { AttributeName: 'ToUserID', KeyType: 'HASH'},
      { AttributeName: 'FromUserID', KeyType: 'RANGE'},
    ],
    AttributeDefinitions: [
      { AttributeName: 'FromUserID', AttributeType: 'S'},
      { AttributeName: 'ToUserID', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  dynamodb.createTable(params, callback);
}

function createUsers(callback) {
  var dynamodb = new AWS.DynamoDB();
  var params = {
    TableName : 'MyMessageUsers',
    KeySchema: [
      { AttributeName: 'UserID', KeyType: 'HASH'}
    ],
    AttributeDefinitions: [
      { AttributeName: 'UserID', AttributeType: 'S'}
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  dynamodb.createTable(params, callback);
}

function deleteMessages(callback) {
  var dynamodb = new AWS.DynamoDB();

  dynamodb.deleteTable({TableName: 'MyMessageData'}, callback);
}

function GetAllMessages(callback)
{
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    dynamodb.scan({TableName: 'MyMessageData'}, function (error, data) {
        var userData;

        if (error || (data.Items == undefined))
        {
            callback(error, null);
        }
        else
        {
            callback(null, data.Items);
        }
    });
}

//deleteMessages((err) => console.log("Delete Messages " + err));
createMessages((err) => console.log("Create Messages " + err));
createUsers((err) => console.log("Create Users " + err));
//GetAllMessages((err, messages) => {
//  if (messages) {
//   messages.forEach(message => console.log(JSON.stringify(message)));
//  }
//});