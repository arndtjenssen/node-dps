//
// API for web hooks
//

var express = require('express');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var router = express.Router();
var log = require('winston');
var config = require('config');
var crypto = require('crypto');
var rabbit = require('../libs/rabbit.js');
var async = require('async');


// example web hook
router.post('/webhook/example', jsonParser, function (req, res) {

  if (!req.body) {
    log.error('Webhook: missing body');
    log.debug('body: ' + req.body);

    return res.sendStatus(400);
  }

  var body = JSON.stringify(req.body);
  var type = req.body.type;
  var status = req.body.status;
  var runId = req.body.runId;
  var executionId = req.body.executionId;
  var simulate = req.body.simulate;

  log.info('Web hook call from runId: %s, executionId: %s, status: %s, type: %s', runId, executionId, status, type);

  if (type == 'execution-completed') {
    if (status == 'ok') {
      async.auto({
        findRunId: function(callback){
          dexi.getRunIdKey(runId, function(key){
            if (!key) {
              log.warn('Dexi web hook call: Cannot continue because of unknown runId');
              return callback('unknown runid');
            } else {
              return callback(null, key);
            }
          });
        },
        findPlatform: ['findRunId', function(results, callback){
          dexi.getPlatform(runId, function(platform){
            if (!platform) {
              log.warn('Dexi web hook call: Cannot continue because of unknown platform');
              return callback('unknown platform');
            } else {
              return callback(null, platform);
            }
          });
        }],
        getWebhookQueueName: ['findPlatform', function(results, callback){
          dexi.getWebhookQueueName(results.findRunId, function(queueName){
            if (!queueName) {
              log.warn('Dexi web hook call: Cannot continue because cannot match runIdKey with a queue name');
              return callback('unknown mapping');
            } else {
              return callback(null, queueName);
            }
          });
        }],
        sendMessage: ['getWebhookQueueName', function(results, callback){
          var key = results.findRunId;
          var queueName = results.getWebhookQueueName;
          var platform = results.findPlatform;

          var msg = JSON.stringify({
            status: status,
            runId: runId,
            runIdKey: key,
            executionId: executionId,
            simulate: simulate,
            platform: platform
          });

          rabbit.send(queueName, msg);
          callback(null);
        }]
      }, function(err, results){
        if (err) {
          res.json({msg: err});
        } else {
          res.json({msg: 'ok'});
        }
      });
    } else {
      log.warn('Web hook call completed but with status: ' + status);
      res.json({msg: 'unknown status'});
    }
  } else {
      log.warn('Web hook call ignored with type: ' + type);
      res.json({msg: 'unknown type'});
    }

});

module.exports = router;
