//
// API for the scheduler
//

var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var router = express.Router();
var log = require('winston');
var jobs = require('../libs/jobs.js');

// start job immediately
router.get('/job/start/:name', function (req, res) {
  var jobName = req.params.name;
  global.agenda.now(jobName);
  log.info('API start job: %s', jobName);
  res.send(jobName + ' started');
});

// get job status
router.get('/job/status/:name', function (req, res) {
  var jobName = req.params.name;
  log.info('API job status: %s', jobName);
  global.agenda.jobs({name: jobName}, function(err, jobs) {
    var job = jobs[0];
    if (job) {
      var json = _.merge(job.toJSON(), {isRunning: job.isRunning()});
      return res.json(json);
    } else {
      return res.sendStatus(400);
    }
  });
});

// re-schedule job on the fly
router.post('/job/schedule/:name', jsonParser, function (req, res) {
  if (!req.body || !req.body.interval) return res.sendStatus(400);

  var jobName = req.params.name;
  var interval = req.body.interval;
  log.info('API re-schedule job %s to %s', jobName, interval);

  jobs.schedule(jobName, interval);
  res.json({ok: true});
});

module.exports = router;
