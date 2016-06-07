var log = require('../libs/log');

// used for integration tests
module.exports = {
  test1: function(opts, cb){
    log.info('test1 called:', opts);
    cb(null, 'test1');
  },
  test2: function(opts, cb){
    log.info('test2_0 called:', opts);
    cb(null, 'test2_0');
  },
  test2_1: function(opts, cb){
    log.info('test2_1 called:', opts);
    cb(null, 'test2_1');
  }
};
