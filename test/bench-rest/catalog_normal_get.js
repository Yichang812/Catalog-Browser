'use strict';
require('../../server');
var benchrest = require('bench-rest');
var flow = {post: 'http://localhost:3000/api/getEntries', json: {lower: 0, type: "FU", upper: 15}};
  var runOptions = {
    limit: 100,         // concurrent connections
    iterations: 10000,  // number of iterations to perform
    prealloc: 1000      // only preallocate up to 100 before starting
  };
  var errors = [];
  setTimeout(start, 2000);
  function start() {
    benchrest(flow, runOptions)
      .on('error', function (err, ctxName) { console.error('Failed in %s with err: ', ctxName, err); })
      .on('progress', function (stats, percent, concurrent, ips) {
        console.log('Progress: %s complete', percent);
      })
      .on('end', function (stats, errorCount) {
        console.log('Error Count: ', errorCount);
        console.log('Stats', stats);
        process.exit();
    });
  }