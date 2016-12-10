var jazzle = require('./dist/jazzle.js');
var util = require('./util.js');
var fs = require('fs');
var esprima = require('esprima');

var i = 2;
var testFile = process.argv[i++];
var contents = "";

contents = testFile[0] === ':' ?
  testFile.substr(1) :
  fs.readFileSync(testFile, 'utf-8');

var isModule = process.argv[i] !== 'n';
var ast_esprima = esprima.parse(contents,
  {loc: true, range: true, sourceType: isModule ? 'module' : 'script'});
var ast_jazzle = jazzle.parse(contents, isModule);

var comp = util.compare(ast_esprima, ast_jazzle);
if (comp === null)
  console.log('equal parses.');
else {
  console.log('incompatible parses; comparison:');
  console.log(util.obj2str(comp));
}

