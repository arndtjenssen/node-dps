# Node DPS

Scalable data processing service framework with NodeJS. It allows the easy set-up of decoupled and scalable processing chains with the help of RabbitMQ and MongoDB. It also includes Agenda to optionally schedule jobs and an API to talk to the scheduler.

## Intro

This is not attempt to replicate great event processing frameworks, like [Apache Storm](http://storm.apache.org/), but an excercise to make use of several core concepts in event or data processing:

* Use queues to store events when services are down or being maintained
* Use queues and workers for scaling and load-balancing
* Use services to separate concerns and improve maintainability
* Use service chains
* Use queues to build process chains

This project has been kindly allowed to be created from work for [Gominga](http://www.gominga.com/en/index.html), a company that aims to maximise online brand awareness and customer service, and is distributed under the [MIT license](https://opensource.org/licenses/MIT).

## Planned features

* Optional delayed retry on service error
* Optional store and manual replay on service error

## Dependencies

* [RabbitMQ](https://www.rabbitmq.com/) with the [Management Plugin](https://www.rabbitmq.com/management.html)
* [MongoDB](https://www.mongodb.org/)

## Libraries

* [Express](http://expressjs.com/) web framework
* [Agenda](https://github.com/rschmukler/agenda) scheduler
* [Agendash](https://github.com/joeframbach/agendash) scheduler frontend
* [Winston](https://github.com/winstonjs/winston) logging
* [Config](https://github.com/lorenwest/node-config) configuration framework

## Testing

* [Mocha](https://mochajs.org/) test framework
* [Chai](http://chaijs.com/) assertion library
* [Sinon](http://sinonjs.org/) mocking library

## Getting started

### Setup

For the initial setup run:
```
npm install
```

You need to have MongoDB and RabbitMQ running locally. After starting the application point your browser to the [scheduler frontend](http://localhost:3000/agendash/). Config files are stored in the _config_ subdirectory.

```
npm start
```

### Configuration

See _./config/default.json_ for configuration options. If you need to adjust values for your local development, e.g. if your MongoDB or RabbitMQ server is running somewhere else than localhost, you can add your own config file and adjust the values accordingly. Set _NODE_ENV_ to the name of your configuration.

### Scheduler and job definitions

_./libs/jobs.js_ creates job definitions and schedules from config files definitions, for example:
```
"scheduler": {
  "active": true,
  "jobs": [
    {"name": "externalTestJob",     "file": "testJob.js",           "schedule": "90 minutes",     "active": true},
    {"name": "testQueueJob",        "file": "testQueueJob.js",      "schedule": "00 02,10 * * *",    "active": true}
  ]
}
```
The _scheduler.active_ enables jobs globally. Additionally, every job can be activated/deactivated independently. The jobs itself are placed into the _jobs_ subdirectory. Jobs don't need to be scheduled via Agenda, they can be executed by other means, e.g. cron or via the API.

### Queues

Queues carry messages for worker processes.
```
{"mydata": {}, "executionId": "uniqueId", "simulate": false}
```
The _simulate_ key is optional. When set to true, a generic worker consuming the message does not call the associated service. See [Generic Worker](#markdown-header-generic-worker) for more details.

### Workers

Workers are currently started as seperate processes and consume messages from a queue. Workers are placed into the _workers_ subdirectory. Workers can be started more than once for load-balancing purposes. See also [Generic Worker](#markdown-header-generic-worker) further below.

### Job -> Queue -> Worker example

Jobs are defined in jobs subdirectory and are spawned from the scheduler or run manually for testing. Workers that are attached to a queue are defined in the workers subdirectory.

_jobs/testQueueJob.js_ is an example for a scheduled job that queues a task to be executed from _workers/testWorker.js_
After starting the application you need to start _testWorker.js_ in a separate shell/process to see messages consumed. You can also start more than one worker, the messages are then distributed among them. _testQueueJob.js_ can be executed manually to create more messages.

### Process chaining example

Workers and jobs for this example are already configured in _default.json_.

Start a predefined generic worker to consume messages from the _stage1_test_ queue and call the associated services.
```
node ./workers/genericWorker.js --worker=test_worker1
```

Start a second generic worker (in another terminal) to consume messages from the _stage2_test_ queue and to call the associates services.
```
node ./workers/genericWorker.js --worker=test_worker2
```

Finally create messages (again in another terminal) for the _stage1_test_ queue.
```
node ./jobs/testStage1.js
```

Observe the log outputs. See how messages are passed between the two workers and services are called. The last worker calls two services, passing the result of the first service to the second one.

## Generic worker

A generic worker (genericWorker.js) needs a command-line parameter, that points to a key in the workers config section. This defines the queue to attach to, services to call and more. Generic workers handle these things:

1. connect to a queue
2. consume a message
3. call associated services
4. update job state in mongodb collection depending on outcome
5. optionally send message two another queue for further processing

### Generic worker configuration example

Services that are called in the generic workers needs to be defined, for example:
```
"services": {
  "integration_test_service": {"module": "IntegrationTestService", "func": "test"}
},
```
The key is the id of the service, the value contains the module name and the function name, that is being called. The first line above translates roughly to:
```
var x = require(services/IntegrationTestService);
x['test'](json);
```
The _json_ parameter is the JSON from the queue, which contains (at least) the service id and a unique execution id.

Finally, the worker needs to be configured:
```
"workers": {
  "test_worker": {
    "queue": "stage1",
    "follow_queue": "stage2",
    "job_state": 1,
    "services": [integration_test_service]
  }
}
```
* queue: the queue name to consume messages from
* follow_queue: an optional parameter. if defined a message will be send to this queue at the end
* job_state: the job state entry in the job state collection will be updated to that value
* services: an array of service ids. services will be called in order and results will be passed from one service call to the next.

### Service chaining

When more than one service is defined, the results from one service call is passed onto the next one. The result is stored in the __last_ key.

### Starting a worker
```
node ./workers/genericWorker.js --worker=test_worker
```

## API
The server creates URL endpoints to start, monitor and schedule jobs. This allows to launch jobs independant from the scheduler and to re-schedule jobs externally. The API is defined in **api.js**

### Basic Authentification

The API is username:password protected with basic-auth if the _auth_ config parameter is not set to null, for example to:
```
"auth": {"admin": {"password": "test"}},
```
The API is by default not protected for the development environment.

### Start job
```
http://localhost:3000/api/job/start/JOBNAME
```

GET request. This will run the job _JOBNAME_ immediately

### Job status

```
http://localhost:3000/api/job/status/JOBNAME
```

GET request. This will return a JSON object with the jobs attributes, e.g.

```
{ _id: ObjectID { _bsontype: 'ObjectID', id: 'test' },
name: 'JOBNAME',
type: 'single',
data: null,
priority: 0,
repeatInterval: '2 minutes'
}
```

### Re-schedule job

```
http://localhost:3000/api/job/schedule/JOBNAME

{"interval" : "30 minutes"}
```

POST request. The body should contain a JSON with a _interval_ key that defines the new schedule.

## Deployment

TODO - docker
