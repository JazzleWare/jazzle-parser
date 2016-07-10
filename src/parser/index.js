
var Parser = require('./constructor.js');

// context is autobound
Parser.prototype.assert = require('./util/assert.js');

['array', 'arrow', 'assignment', 'class', 'comment', 'esc-general', 'esc-unicode', 'export', 'for', 'fundef', 'identifier', 'idStatementOrId', 'import', 'let', 'loc', 'memname', 'new', 'nextlookahead', 'non-assig', 'number', 'obj-class-common', 'obj', 'pattern', 'primary', 'program', 'regex', 'semi', 'spread', 'statement', 'string', 'super', 'template', 'validate', 'var', 'yield'].forEach(function (uname) {
  var component = require('./prototype/' + uname + '.js');
  Object.keys(component).forEach(function (key) {
    Parser.prototype[key] = component[key];
  });
});


module.exports = Parser;
