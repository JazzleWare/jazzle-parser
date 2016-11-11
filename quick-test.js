require('./test-runner.js')
    .runTestSuite.call(
       this,
       process.argv[2] || './test/tests',
       require('./dist/jazzle.js').Parser );
