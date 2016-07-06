( function(_exports) {

var util = require( '../util.js' ), lube = require('../lube.js'  ) , fs = require( 'fs' ) ;

function compareAST(expected, actual) {
  return util.compare(expected, actual);
}

var _assert = util.assert;
var lube = require( '../lube.js' );	 

function getTestSource (name) {
    try {
      return [ util.contents (name+ '.js' ).toString(), false ] ;
    } catch ( err ) {
      var source = util.contents(name + '.source.js').toString();
      return [ eval( "(function(){" + source + "; return source;})()" ), source ] ;
    }
}

function TestSession() {
  this.sessionPass = 0;
  this.passTarget = 0;
  this.sessionFail = 0;
  this.failTarget = 0;
  this.passError = {};
  this.failError = {};
  this.Parser = lube.Parser
  this.ignore = {};
}

TestSession.prototype = {
  mustFail: function(testName) {
    var referenceError = util.readJSON(testName + '.failure.json' );
    
    console.log( "SKIPPING FAIL ON", testName);
    return;

    var fail = false;
    try { 
   
      var source = getTestSource(testName);
      fail = !false; 
      this.failTarget++;
      var syn = this.parse(source[0]);
      fail = false;
      throw { type: 'mustFail', expected: referenceError, src: source }; 
    } catch ( err ) {
      if ( !fail ) throw err;
      console.log( "TESTING FAIL ON", testName ) ;
     
      return;
      var comp = compareErrors(referenceError, err);

      if ( !comp )
         this.sessionFail++;
      else
         this.failError[testName] = comp;
    }
  },
  
  mustPass: function(testName) {
    if ( this.ignore[testName] ) {
      console.log( "IGNORING", testName );
      return ;
    }
    
    if ( testName.search ( /\/(JSX|tokenize|comment)\// ) >= 0 ) {
      console.log( "IGNORING unsupported ", testName );
      return ;
    }
    
    var referenceAST = util.readJSON(testName   +   '.tree.json' );

    if ( referenceAST.errors ) {
      console.log( "SKIPPING TEST WITH SOFT ERROR" ) ;
      return ;
    }

    if ( referenceAST.sourceType === 'module' ) {
      console.log( "SKIPPING MODULE" );
      return;
    }

    try {
      var source = getTestSource(testName);
      this.passTarget++; 
      var syn = this.parse(source[0]);
      var comp = compareAST( referenceAST, syn );
      if ( !comp )
         this.sessionPass++;
      else {
         this.passError[testName] = comp;
         throw { type: 'comp', test: testName, val: comp, expected: referenceAST, actual: syn, src: source  }  ;
      }
    } catch ( err ) { 
      if ( err.type === 'comp' ) throw err;

      this.passError[testName] = err;
      throw { type: 'err', test: testName, val: err, src: source, expected: referenceAST };
    }
  },

  runTest: function(testPath ) {
      var i = util.endsWith ( testPath, '.failure.json' ) ;
      if ( i > 0 )
        return this.mustFail(testPath.substring(0,i));

      if ( util.endsWith(testPath, '.tokens.json' ) >= 0 ) {
        console.log( "SKIPPING TOKENS", testPath );
        return;
      }
    
      i = util.endsWith( testPath, '.tree.json' );
      _assert(i>0, [testPath, i] );
       
      console.log("TESTING", testPath )    ;
      return this.mustPass(testPath.substring(0,i) );
  },

  startAt: function(loc) {
    var testSession = this, testDir;
    var testFile = function(file) {
       if ( util.endsWith(file, '.json' ) >= 0 &&
            util.endsWith(file, '.module.json') < 0 )
         try {
           testSession.runTest(file);
         } catch ( err ) {

          if ( err.type === 'comp' ) {
            console.log( util.obj2str(err ) );
            throw new Error( 'Incompatible parsing' ) ;
          }
          else {
            console.log( "ERROR: ", err );
            console.log( "STACK: ", err );
            throw util.obj2str( err );
          }
        } 
    };

    testDir = function(dir) { util.each( dir, testDir, testFile ) ; }
    
    util.each(loc, testDir, testFile ) ;
  },

  parse: function(src) {
    return new this.Parser(src).parseProgram();
  }
};

_exports.TestSession = TestSession;

}) (this);
