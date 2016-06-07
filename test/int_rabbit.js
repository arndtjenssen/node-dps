/* jshint expr: true */
/* exported should */

process.env.NODE_ENV = 'test';

var chai = require('chai');
var expect = chai.expect;
var rabbit = require('../libs/rabbit');
var amqp = require('amqplib/callback_api');
var config = require('config');

describe('Rabbit', function() {
  var msg = Math.random() + '';
  const QUEUE = "int_test";

  // delete QUEUE
  before (function (done) {
    rabbit.deleteQueue(QUEUE, function(err) {
      done();
    });
  });

  beforeEach (function (done) {
    setTimeout(function() { done(); }, 500);
  });

  it('should send message', function(done) {
    rabbit.sendAsync(QUEUE, msg, function(err) {
      expect(err).to.be.null;
      done();
    });
  });

  it('should receive message', function(done) {
    amqp.connect(config.get('amqp'), function(err, conn) {
      expect(err).to.be.null;

      conn.createChannel(function(err, ch) {
        expect(err).to.be.null;

        ch.assertQueue(QUEUE, {durable: true});
        ch.prefetch(1);

        ch.consume(QUEUE, function(m) {
          var str = m.content.toString();
          expect(str).to.be.equal(msg);
          conn.close();
          done();
        }, {noAck: true});
      });
    });
  });

});
