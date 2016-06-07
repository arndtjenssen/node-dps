#!/usr/bin/env node

var rabbit = require('../libs/rabbit');
var crypto = require('crypto');

const QUEUE = 'stage1_test';
var msg = {serviceId: 'integration_test_service1', executionId: crypto.randomBytes(10).toString('hex')};
var msgString = JSON.stringify(msg);

// send message
rabbit.sendAsync(QUEUE, msgString, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Message sent');
  }
});
