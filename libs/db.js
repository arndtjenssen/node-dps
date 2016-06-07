/**
 * @fileOverview Use this to have a single MongoDB connection pool in your app.
 *
 * @example
 * require('db')(function(err, db) {
 *   if (err) {
 *      console.log('Cannot connect to MongoDB');
 *    }
 * });
 * // once initialised, get the db directly with
 * vsr db = require('db')();
 *
 */

var config = require('config');
var log = require('./log');
var MongoClient = require('mongodb').MongoClient;

function MongoSingle (cb) {

  var addr = config.get('mongodb.dps');

  if (MongoSingle.prototype.db) {
    if (cb !== undefined) {
      log.silly('callback for db');
      return cb(null, MongoSingle.prototype.db);
    } else {
      log.silly('return db');
      return MongoSingle.prototype.db;
    }
  } else {
    log.debug('opening a connection to: %s', addr);
  }

  MongoClient.connect(addr, function (err, db) {
    if (db) {
      MongoSingle.prototype.db = db;
    }

    if (err) {
      log.error(err);
    } else {
      log.info('connected to database: %s', addr);
    }

    db.on('close', function() {
      MongoSingle.prototype.db = null;
      log.info('connection to database closed: %s', addr);
    });

    if (cb !== undefined) cb(err, db);
  });
}

MongoSingle.prototype.db = null;

module.exports = MongoSingle;
