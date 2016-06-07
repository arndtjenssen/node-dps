var log = require('./log');
var config = require('config');
var amqp = require('amqplib/callback_api');

//
// RabbitMQ module
//

var Rabbit = function () {};

var MSG_TIMEOUT = 500;

Rabbit.prototype.send = function(queue, msg) {
  // queue a message
  amqp.connect(config.get('amqp'), function(err, conn) {
    conn.createChannel(function(err, ch) {
      ch.assertQueue(queue, {durable: true});
      ch.sendToQueue(queue, new Buffer(msg), {persistent: true});
      log.info("Message queued to %s: '%s'", queue, msg);
    });
    setTimeout(function() { conn.close(); }, MSG_TIMEOUT);
  });
};

Rabbit.prototype.sendAsync = function(queue, msg, cb) {
  // queue a message
  amqp.connect(config.get('amqp'), function(err, conn) {
    if (err) return cb(err);

    conn.createChannel(function(err, ch) {
      if (err) return cb(err);

      ch.assertQueue(queue, {durable: true});
      ch.sendToQueue(queue, new Buffer(msg), {persistent: true});
      log.info("Message queued to %s:", queue, msg);
      cb(null);
    });
    setTimeout(function() { conn.close(); }, MSG_TIMEOUT);
  });
};

Rabbit.prototype.deleteQueue = function(queue, cb) {
  amqp.connect(config.get('amqp'), function(err, conn) {
    if (err) return cb(err);

    conn.createChannel(function(err, ch) {
      if (err) return cb(err);

      ch.deleteQueue(queue, {}, function(err) {
        conn.close();

        if (err) {
          log.error('Cannot delete queue %s', queue, err);
          return cb(err);
        } else {
          log.debug('Queue %s deleted', queue);
          return cb();
        }
      });
    });
  });
};


module.exports = new Rabbit();
