var test = require('./test-util.js');
var util = require('./util.js');
var fs = require('fs');
var JazzleTest = test.JazzleTest;
var JazzleTestSuite = test.JazzleTestSuite;

function runTestSuite(testRoot, Parser) {
  var testSuite = new JazzleTestSuite(Parser);

  testSuite.exclude(function(test) { return test.testURI.indexOf('tolerant') !== -1 }, '.tolerant' );
  testSuite.exclude(function(test) { return test.testJSON.comments }, '.comments' );
  testSuite.exclude(function(test) { return false && test.testJSON.hasOwnProperty('lineNumber') }, '.lineNumber');
  testSuite.exclude(function(test) { return test.testURI.indexOf('JSX') !== -1 }, '.js.xml');
  testSuite.exclude(function(test) { return test.jsonType === 'tokens' }, '.tokens');

  fs.readFileSync('.ignore').toString().split('\n').forEach( function(item){
     if (item) {
       testSuite.exclude(item+'.js', 'ignore-js');
       testSuite.exclude(item+'.source.js', 'ignore-source.js');
     }
  });

  var listenerErr = null;
  testSuite.testListener = function(test, state) {
     if (state === 'unexpected-fail' || state === 'unexpected-pass') {
       listenerErr = state;
       console.log("================== ERROR ================");
       console.log("test: <"+test.testURI+">\nsource: <"+test.src+"> (raw <"+test.rawSource+">)");
       console.log("================== END ==================\n");
     }
  };

  function onItem(itemPath, iter) {
     var stat = fs.statSync(itemPath);
     if (stat.isFile(itemPath) && 
       util.tailIndex(itemPath, '.js') !== -1) {
       var test = new JazzleTest(itemPath);
       listenerErr = null;
       var testState = testSuite.push(test); 
       if (listenerErr !== null)
         throw new Error( "ERROR IS NOT TOLERATED: " + listenerErr + "; test <" + test.testURI + ">");

       console.log(testState, "<" + itemPath +">" ); 
     }
     else if (stat.isDirectory())
       iter(itemPath, onItem);
  } 
   
  console.log("STARTED");
  var aborted = false;
  try {
    util.dirIter(testRoot, onItem);
    console.log("FINISHED WITH NO ERRORS.");
  }
  catch (e) {
    console.log("ABORTED:", e);
  }
    
  console.log("\nSTATS:");
  console.log( testSuite.str());
  
  return testSuite.summary();
}

 module.exports.runTestSuite = runTestSuite;

