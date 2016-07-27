var parsers = {};

try {
   var pEsprima = require( 'esprima' );
   parsers.esprima = function(src, withLoc) {
      return pEsprima.parse(src, { loc: withLoc, ranges: withLoc });
   };
} catch ( e ) {}

try {
   var pAcorn = require( 'acorn' );
   parsers.acorn = function( src, withLoc ) {
      return pAcorn.parse(src, { locations: withLoc });
   };
} catch ( e ) {} 

try {
   var pLube = require( './dist/lube.js' );
   parsers.jsRube = function( src, withLoc ) {
      return new pLube.Parser(src).parseProgram();
   }
} catch ( e ) {}

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

var Benchmark = require( 'benchmark' ).Benchmark ;
var parserName, sourceName;

function parseLater( parserName, sourceName ) {
  return function() { return parsers[parserName](sources[sourceName], !false ); };

}
 
var JEA = 'jea';
function randJEA() {
   var str = "";
   var jea = JEA;
   while ( str.length < JEA.length ) {
      var i = (Math.random()*jea.length)|0;
      str += jea.charAt(i);
      if ( i < jea.length - 1 ) 
         jea = jea.substring(0,i) + jea.substring(i+1);
      else
         jea = jea.substring(0,jea.length);
  
   }

   return str;
}
   
var parserNames = { e: 'esprima', a: 'acorn', j: 'jsRube' };

for ( sourceName in sources ) {
 var l = 1;
 while ( l-- ) {
     if ( parsers.esprima ) {
          var comp =  util.compare(parsers.esprima(sources[sourceName],!false),
                                  parsers.jsRube(sources[sourceName],!false));
          if ( comp ) {
            console.log( util.obj2str(comp) );
            throw new Error( 'Incompatible Parsing for ' + sourceName );
          }
     }     

     var benchmarkSet = new Benchmark.Suite();
     var str = process.argv[2] || randJEA() ;
     var e = 0;
     while ( e < str.length ) { 
       var parserName = parserNames[str[e]];
       benchmarkSet.add( parserName, parseLater(parserName, sourceName) );
       e++ ;
     }

     benchmarkSet.on( 'complete', function(r) {
        var currentTargets = r.currentTarget, i;
        i = 0;
        console.log( "-----------START---------\n",
                     "source: ", sourceName );
        while ( i < currentTargets.length ) { 
          console.log( currentTargets[i].stats.mean, "(" + currentTargets[i].name + ')' )
          i++;
        }
        console.log( "------------DONE---------\n\n");
     });
     
     benchmarkSet.run();
  }
}


