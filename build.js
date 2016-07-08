var fs = require( 'fs' );
var util = require( 'util' );
var src = './src';
var dist = './dist/lube.js';

function Builder() {

   this.moduleNames = {};
   this.moduleList = [];
   this.strExports = "";  

}

Builder.prototype.addModule = function(name, path) {
  var entry = this.modulesNames[name];
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
   write_string( output, '(function(_exports){\n"use strict";\n' );
   
   var e = 0;
   while ( e < this.moduleList.length )
      this.writeModule( output, this.moduleList[e++ ] );

   write_string( output, ';\n(function(){\n' + this.strExports + '\n})();\n})(this);' );
};

Builder.prototype.writeModule = function( output, module ) {
   write_string( output, ';\n');
   write_string( output, fs .readFileSync( module.path ) );
   if ( module.submodules.length === 0 )
     return;

   write_string( output, ';\n' );
   write_string( output, '(function(_class){\n' );

   var e = 0;

   while ( e < module.submodules.length ) {

     write_string( output, '(function(_class){\n' );
     write_string( output, fs .readFileSync(module.submodules[e] );
     write_string( output, '})(_class);\n' );
     
     e++;
   }

   write_string( output, '})(' );
   write_string( output, module.name + '.prototype);\n' );
};          
  
function write_string(output, str) {
  return fs.write(output, str, 0, str.length);

}


