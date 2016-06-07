/* jshint expr: true */
/* exported should */

process.env.NODE_ENV = 'test_auth';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../../app');
var should = chai.should();

chai.use(chaiHttp);

describe('Agenda Auth', function() {

  const WRONG_CREDENTIALS = new Buffer('admin:wrongpass').toString('base64');
  const RIGHT_CREDENTIALS = new Buffer('admin:test').toString('base64');

  // small delay to give express and agenda time to initialise
  before (function(done) {
    setTimeout(function() { done(); }, 1000);
  });

  it('should fail with 401 (not-authenticated) when called with missing credentials on /api/job/status/:name GET', function(done) {
      chai.request(server)
      .get('/api/job/status/externalTestJob')
      .end(function(err, res) {
        res.should.have.status(401);
        done();
      });
  });

  it('should fail with 401 (not-authenticated) when called with wrong credentials on /api/job/status/:name GET', function(done) {
      chai.request(server)
      .get('/api/job/status/externalTestJob')
      .set('Authorization', 'Basic ' + WRONG_CREDENTIALS)
      .end(function(err, res) {
        res.should.have.status(401);
        done();
      });
  });

  it('should fail with 401 (not-authenticated) when called with missing credentials on /api/job/start/:name GET', function(done) {
      chai.request(server)
      .get('/api/job/start/externalTestJob')
      .end(function(err, res) {
        res.should.have.status(401);
        done();
      });
  });

  it('should fail with 401 (not-authenticated) when called with wrong credentials on /api/job/start/:name GET', function(done) {
      chai.request(server)
      .get('/api/job/start/externalTestJob')
      .set('Authorization', 'Basic ' + WRONG_CREDENTIALS)
      .end(function(err, res) {
        res.should.have.status(401);
        done();
      });
  });


  it('should succeed with 200 (ok) when called with right credentials on /api/job/status/:name GET', function(done) {
      chai.request(server)
      .get('/api/job/status/externalTestJob')
      .set('Authorization', 'Basic ' + RIGHT_CREDENTIALS)
      .end(function(err, res) {
        res.should.have.status(200);
        done();
      });
  });

});
