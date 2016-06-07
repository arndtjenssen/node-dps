#!/usr/bin/env node

//
// see ./config/default.json for default configuration
// set NODE_ENV to environmnt to use
//

var config = require('config');

var express = require('express');
var auth = require('./www/auth');
var app = express();
var log = require('./libs/log');

var Agenda = require('agenda');
var Agendash = require('agendash');

require('./libs/db')(function(err, db) {
	if (err) {
		log.error(err);
		process.exit();
	}

	var agenda = new Agenda({db: {address: config.get('mongodb.agenda')}});

	// TODO: use module.exports instead
	global.agenda = agenda;

	// jobs and scheduler
	var jobs = require('./libs/jobs.js');
	jobs.init();
	jobs.start();

	// express routes (not authenticated)
	// app.use('/api', require('./www/api_webhooks'));

	// authenticate routes
	app.use(auth);

	// express routes (authenticated)
	app.use('/agendash', Agendash(agenda));
	app.use('/api', require('./www/api'));
	app.use('/test', require('./www/api_test'));

	// start the app
	app.listen(config.get('port'), function () {
	  log.info('App listening on port %s', config.get('port'));
	});
});

module.exports = app;
