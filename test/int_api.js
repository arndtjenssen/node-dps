/* jshint expr: true */
/* exported should */

process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app');
var should = chai.should();

chai.use(chaiHttp);

describe('Agenda', function() {

  // small delay to give express and agenda time to initialise
  before (function(done) {
    setTimeout(function() { done(); }, 1000);
  });

  it('should return name parameter on /test/job/:name GET', function(done) {
      chai.request(server)
      .get('/test/job/test')
      .end(function(err, res) {
        res.should.have.status(200);
        res.text.should.equal('test tested');
        done();
      });
  });

  it('should return job status on /api/job/status/externalTestJob GET', function(done) {
      chai.request(server)
      .get('/api/job/status/externalTestJob')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal('externalTestJob');
        done();
      });
  });

  it('should return 400 with invalid job on /api/job/status/idontexist GET', function(done) {
      chai.request(server)
      .get('/api/job/status/idontexist')
      .end(function(err, res) {
        res.should.have.status(400);
        done();
      });
  });

  it('should return 400 on job which is deactivated in config on /api/job/status/testQueueJob GET', function(done) {
      chai.request(server)
      .get('/api/job/status/testQueueJob')
      .end(function(err, res) {
        res.should.have.status(400);
        done();
      });
  });

  it('should re-schedule job on /api/job/schedule/:name POST', function(done) {
      chai.request(server)
      .post('/api/job/schedule/externalTestJob')
      .send({'interval': '120 minutes'})
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('ok');
        res.body.ok.should.equal(true);
        done();
      });
  });



});
