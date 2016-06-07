/* jshint expr: true */
/* exported should */

process.env.NODE_ENV = 'test';

var chai = require('chai');
var expect = chai.expect;
var rabbit = require('../libs/rabbit');
var amqp = require('amqplib/callback_api');
var config = require('config');
var spawn = require("child_process").spawn;
var MongoClient = require('mongodb').MongoClient;

describe.skip('GenericWorker', function() {
  var msg = Math.random() + '';
  const QUEUE = "int_test";
  var worker1, worker2, job, mongodb;

  before (function (done) {
    rabbit.deleteQueue(QUEUE, function(err) {
      worker1 = spawn('node', ['./workers/genericWorker.js', '--worker=test_worker1']);
      worker2 = spawn('node', ['./workers/genericWorker.js', '--worker=test_worker2']);
      MongoClient.connect(config.get('mongodb.agenda'), function(err, db) {
        mongodb = db;
        done();
      });
    });
  });

  beforeEach (function (done) {
    setTimeout(function() { done(); }, 1000);
  });

  afterEach (function (done) {
    setTimeout(function() { done(); }, 500);
  });

  after (function () {
    mongodb.collection(config.get('mongodb.jobstatecol')).drop(function() {
      mongodb.close();
    });
    worker1.kill();
    worker2.kill();
  });

  it('should send message', function(done) {
    done();
  });

  it('should receive message', function(done) {
    done();
  });

});
