#!/usr/bin/env node

//
// Generic worker. Needs to be called with a parameter indicating the worker configuration
//
// Parameters:
// worker: name of worker configuration to use (needed)
//
// see ./config/default.json for default configuration
// set NODE_ENV to environmnt to use
//

var _ = require('lodash');
var config = require('config');
var argv = require('minimist')(process.argv.slice(2));

if (!argv.worker) {
  console.log('\nWorker configuration name needed. For example:');
  console.log('node ./workers/genericWorker.js --worker=NAME\n');
  process.exit();
}

if (!config.has('workers.' + argv.worker)) {
  console.log("Cannot find worker configuration '" + argv.worker + "'");
  process.exit();
}

var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var amqp = require('amqplib/callback_api');
var rabbit = require('../libs/rabbit');
var log = require('../libs/log');

// connect to db
require('../libs/db')(function(myerr, mydb) {

  if (myerr) {
    logErrorAndExit('Cannot connect to MongoDB', myerr);
  }

  // load services
  var services = {};
  var worker = config.get('workers.' + argv.worker);

  async.forEachSeries(worker.services, function(value, callback) {
    log.debug('loading service %s', value);
    var conf = config.services.get(value);
    services[value] = { module: require('../services/' + conf.module), func: conf.func };
    callback();

  }, function() {
    log.debug('services loaded');

    // connect to MongoDB
    MongoClient.connect(config.get('mongodb.agenda'), function(err, db) {
      if (err) {
        logErrorAndExit('Cannot connect to MongoDB', err);
      }

      // connect to RabbitMQ
      amqp.connect(config.get('amqp'), function(err, conn) {
        if (err) {
          logErrorAndExit('Cannot connect to RabbitMQ', err);
        }

        conn.createChannel(function(err, ch) {
          if (err) {
            logErrorAndExit('Cannot create channel', err);
          }

          ch.assertQueue(worker.queue, {durable: true});
          ch.prefetch(1); // only consume one message at a time
          log.info("Waiting for messages in %s. To exit press CTRL+C", worker.queue);

          // consume messages when they arrive
          ch.consume(worker.queue, function(msg) {

            var str = msg.content.toString();
            log.info("Received %s", str);

            var json = JSON.parse(str);
            var executionId = json.executionId;
            var serviceId = json.serviceId;

            if (config.has('services.' + serviceId)) {

              if (json.simulate) {
                // simulate call - good for testing
                log.debug('simulate calling %s', services[serviceId].func);

                // update state in job state collection
                updateState({executionId: executionId, worker: worker, db: db});

                if (worker.has('follow_queue')) {
                  rabbit.send(worker.get('follow_queue'), str);
                }
                ch.ack(msg);

              } else {

                // call services associated wih this worker
                var _result = {};
                async.eachSeries(worker.services, function(value, callback) {
                  log.debug('calling %s', services[value].func);

                  services[value].module[services[value].func](_.merge(json, _result), function(err, result) {
                    _result._last = result;
                    if (err) {
                      callback(err);
                    } else {
                      callback();
                    }
                  });

                }, function(err) {

                  // TODO: what to do in case of an error?
                  if (err) {
                    log.error(err);
                  } else {
                    log.debug('all services executed');
                  }

                  // update state in job state collection
                  updateState({executionId: executionId, worker: worker, db: db});

                  if (worker.has('follow_queue')) {
                    rabbit.send(worker.get('follow_queue'), str);
                  }

                  // acknowledge message
                  ch.ack(msg);
                });
              }

            } else {
              log.warn('Cannot find service mapping for %s. Bailing out..', serviceId);
              ch.ack(msg);
              return;
            }
          }, {noAck: false});
        });

      }); // RabbitMQ

    }); // MongoDB

  }); // async service loading - done

}); // App Mongodb via db.js

// update state in job state collection
function updateState(opt) {
  opt.db.collection(config.get('mongodb.jobstatecol')).update(
    { executionId: opt.executionId },
    { executionId: opt.executionId, state: opt.worker.get('job_state') },
    { multi: false, upsert: true },
    function(err) {
      if (err) {
        log.error(err);
      } else {
        log.info("Updated job state for executionId %s to %s.", opt.executionId, opt.worker.get('job_state'));
      }
  });
}

function logErrorAndExit(msg, err) {
  log.error(msg);
  log.error(err);
  process.exit();
}

