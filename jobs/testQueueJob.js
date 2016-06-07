#!/usr/bin/env node

var rabbit = require('../libs/rabbit');
const QUEUE = 'task_queue';

//
// test jobs to create entries in the rabbitmq task_queue
//

rabbit.sendAsync(QUEUE, 'Hello World!...', function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Message sent');
  }
});
