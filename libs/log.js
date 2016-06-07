var log = require('winston');
var config = require('config');

//
// log module
//

if (config.get('log.file')) {
  log.add(log.transports.File, { filename: config.get('log.filepath') });
}

if (!config.get('log.console')) {
	log.remove(log.transports.Console);
}
log.level = config.get('log.level');
if (config.get('log.file')) {
  log.info('logging to %s with level %s', config.get('log.filepath'), config.get('log.level'));
} else {
  log.info('logging with level %s', config.get('log.level'));
}


module.exports=log;