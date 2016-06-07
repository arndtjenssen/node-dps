var auth = require('basic-auth');
var config = require('config');

var admins = config.get('auth');

module.exports = function(req, res, next) {
	// skip authentification if admins is null
	if (!admins) return next();

	var user = auth(req);
  if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
		res.set('WWW-Authenticate', 'Basic realm="Api"');
		return res.status(401).send();
  }
  return next();
};
