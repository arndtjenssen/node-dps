var _ = require('lodash');
var log = require('./log');
var proc = require('child_process');
var config = require('config');

const JOBS_DIR = '/../jobs/';

var Jobs = function () {};

  // job definitions
  Jobs.prototype.init = function() {

  // get jobs from config and schedule them if scheduler is set to active
  if (config.scheduler.active) {
    _.forEach(config.scheduler.jobs, function(job) {
      if (job.active) {
        log.info('defining job %s in %s', job.name, job.file);
        Jobs.prototype.define(job.name, job.file, null);
      }
    });
  } else {
    log.warn('Scheduler is deactivated in config. No jobs will be scheduled.');
  }

  // system jobs
  Jobs.prototype.system();
};

// system jobs
Jobs.prototype.system = function() {
  global.agenda.define('agendaCleanUp', function(job, done) {
    log.info('agenda housekeeping');

    global.agenda._collection.remove({nextRunAt: null, lockedAt: null, type: 'normal' }, function(e, ret) {
      if (e) {
        log.error(e);
      } else {
        log.info("Removed " + ret.result.n + " run-once jobs.");
      }
      done();
    });
  });
};

// schedules all jobs
Jobs.prototype.setSchedule = function() {

  // get jobs from config and schedule them if scheduler is set to active
  if (config.scheduler.active) {
    _.forEach(config.scheduler.jobs, function(job) {
      if (job.active) {
        log.info('setting schedule for %s to %s', job.name, job.schedule);
        Jobs.prototype.schedule(job.name, job.schedule);
      }
    });
  }

  // system jobs
  Jobs.prototype.schedule('agendaCleanUp', '1 hour');
};

// schedules alls jobs and starts the scheduler
Jobs.prototype.start = function() {
  global.agenda.on('ready', function() {
    // unlock collections on startup
    global.agenda._collection.updateMany({lockedAt: {$exists: true} }, { $set : { lockedAt : null } }, function (e, ret) {
      if (e) {
        log.error(e);
      } else {
        log.info("Unlocked " + ret.result.n + " jobs.");
      }

      // schedule jobs
      Jobs.prototype.setSchedule();

      // purge old jobs
      global.agenda.purge(function(err, numRemoved) {
        if (err) {
          log.error(err);
        } else {
          log.info('removed %s old jobs', numRemoved);
        }
      });

      // start scheduler
      global.agenda.start();
    });

  });
};

// define external job and log output to logger
Jobs.prototype.define = function(jobName, fileName, args) {
  var jobArgs = _.concat([__dirname + JOBS_DIR + fileName], args);
  jobArgs = _.compact(jobArgs);

  global.agenda.define(jobName, function(job, done) {
    log.debug('start %s', jobName);

    var p = proc.spawn('node', jobArgs);

    p.stdout.on('data', function (data) {
      log.debug('%s stdout: %s', jobName, data);
    });

    p.stderr.on('data', function (data) {
      log.debug('%s stderr: %s', jobName, data);
    });

    p.on('close', function (code) {
      log.debug('%s exited with code %s', jobName, code);
      done();
    });

  });
};

// for re-scheduling the job needs to be cancelled first
Jobs.prototype.schedule = function(name, interval) {
  global.agenda.cancel({name: name}, function(err) {
    if (err) {
      log.error(err);
    } else {
      global.agenda.every(interval, name);
    }
  });
};


module.exports = new Jobs();
