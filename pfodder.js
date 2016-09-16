   var pLube = require( './dist/lube.js' );
   var jsRube = function( src, withLoc ) {
      return new pLube.Parser(src).parseProgram();
   }
var fs = require( 'fs' ), util = require( './util.js' ) ;

function readFile(filePath) {
   try {
     return fs.readFileSync(filePath,'utf-8').toString();
   } catch ( e ) {
     console.log( "COULD NOT LOAD", filePath );
     return "";
   }
}

var SOURCES_ROOT = './bench/sources';
var sources = {};

var files = fs .readdirSync ( SOURCES_ROOT );

var e = 0;

while ( e < files.length ) {
   if ( !fs.statSync (SOURCES_ROOT + '/' + files[e]).isDirectory() )  { 
     sources[files[e]] = readFile(SOURCES_ROOT+ '/' + files[e]);
     console.log( 'LOAD', files[e] );
   }

   e++ ;
}
  
sources['lube'] = readFile( './dist/lube.js' );
 
for ( sourceName in sources ) {
      console.log( "PARSING", sourceName );
      var l = 120;
      while ( l-- ) jsRube(sources[sourceName]);
      console.log( "--------------");
} 



