
var Parser = require('./constructor.js');

// context is autobound
Parser.prototype.assert = require('./util/assert.js');


Parser.prototype.parseArrayExpression = require('./parse/array.js');
Parser.prototype.parseSpreadElement = require('./parse/spread.js');

Parser.prototype.parseClass = require('./parse/class.js');
Parser.prototype.parseSuper = require('./parse/super.js');

Parser.prototype.parseArrowFunctionExpression = require('./parse/arrow.js');

['array', 'arrow', 'assignment', 'class', 'comment', 'esc-general', 'esc-unicode', 'export', 'for', 'fundef', 'identifier', 'idStatementOrld', 'import', 'let', 'loc', 'memname', 'new', 'nextlookahead', 'non-assig', 'number', 'obj-class-common', 'obj', 'pattern', 'primary', 'program', 'regex', 'semi', 'spread', 'statement', 'string', 'super', 'template', 'validate', 'var', 'yield'].forEach(function (uname) {
  var component = require('./prototype/' + uname + '.js');
  Object.keys(component).forEach(function (key) {
    Parser.prototype[key] = component[key];
  });
});


module.exports = Parser;
