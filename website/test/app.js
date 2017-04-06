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

createMessages((err) => console.log("Create Messages " + err));
createUsers((err) => console.log("Create Users " + err));