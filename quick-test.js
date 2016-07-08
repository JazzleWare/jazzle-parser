var TestSession = require( './test/test.js' ).TestSession, util = require( './util.js' ) ;

try {
   var testSession =  new TestSession();
   var ignoreList = util.contents( '.ignore' ).toString().split(/\r\n|\n/);
   var e = 0;
   while ( e < ignoreList.length )
      testSession.ignore[ignoreList[e++]] = !false;
  
   testSession .startAt( './test/tests' );
} catch ( err ) {
  console.log( err.type === 'err' ? "Error: " + err.message + "\nStack:\n" + err.stack :
                util.obj2str( err.val ) );
}

