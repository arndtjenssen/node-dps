//
// API methods to test stuff
//

var express = require('express');
var router = express.Router();
var log = require('winston');

// api test
router.get('/job/:name', function (req, res) {
  var jobName = req.params.name;
  log.info('API test job: %s', jobName);
  res.send(jobName + ' tested');
});

module.exports = router;
