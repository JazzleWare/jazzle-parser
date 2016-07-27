'use strict';

var fs = require( 'fs' );
var util = require( 'util' );
var src = './src';
var dist = './dist/lube.js';

function Builder() {

   this.moduleNames = {};
   this.moduleList = [];
   this.strExports = "";  
   this.str = "";
}

Builder.prototype.addModule = function(name, path) {
  var entry = this.moduleNames[name];
  if ( entry ) entry.path = path;
  else {
     this.moduleNames[name] = entry = { path: path, submodules: [], name: name };
     this.moduleList.push(entry);
  }
};

Builder.prototype.subModuleFor = function(name, path) {
   if ( !this.moduleNames[name] )
         this.addModule(name, null);

   this.moduleNames[name].submodules.push(path);
};

Builder.prototype.setExports = function(strExports) {
   this.strExports = strExports;
};

Builder.prototype.write = function(output) {
   console.log("WRITING MODULES");
   this.  write_string(  '(function(_exports){\n"use strict";\n' );
   
   var e = 0;
   while ( e < this.moduleList.length )
      this.writeModule(  this.moduleList[e++ ] );

   this. write_string(  ';\n' + this.strExports + ';})(this)' );
   
   fs .writeSync(output, this.str, 0, this.str.length);
   fs .closeSync(output);

   console.log("FINISHED ALL.");
};

Builder.prototype.writeModule = function(  module ) {
   console.log( "--WRITING MODULE", module.name );
   this. write_string(  ';\n');
   this. write_string(  fs .readFileSync( module.path ) );
   console.log( "--FINISHED MODULE" );
   if ( module.submodules.length === 0 ) {
     console.log( "----(NO SUBMODULES)\n" ) ;
     return;

   }

   console.log( "----SUBMODULES" );
   this. write_string(  ';\n' );

   var e = 0;

   while ( e < module.submodules.length ) {
     console.log( "----WRITING SUBMODULE", module.submodules[e] );
     this.write_string( ';(function(){\n' );
     this. write_string(  fs .readFileSync(module.submodules[e] ) );
     this.write_string( '\n}).call(' + module.name + '.prototype);\n')   ;
 
     console.log( "----FINISHED", module.submodules[e] );
     e++;
   }

   console.log( "----(FINISHED SUBMODULES)\n" );
};          
  
Builder.prototype.write_string = function ( str) {
  this.str += str;

}

var builder = new Builder();
var files = fs .readdirSync(src);

var e = 0;
while ( e < files.length ) {
  if ( fs .statSync(src+'/'+files[e]).isFile() ) {
    var name = files[e];
    name = name.substring(0, name.indexOf('.js') );
    if ( name.charAt(0) === '@' )
      builder.addModule(name.substring(1),src + '/' + files[e]);

    else if ( name === 'mexport' )
      builder.setExports(fs. readFileSync(src + '/' + files[e]) );

    else {
        var l = name.indexOf('@');
        if ( l >= 0 ) 
          builder.subModuleFor (name.substring( l +  1 ), src + '/' + files[e] );
        
        else
           builder.addModule(name, src + '/' + files[e] ) ;
    }
  }
  
  e ++ ;
}

builder.write(fs .openSync(dist, 'w+'));

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

