
var Parser = require('./constructor.js');

// context is autobound
Parser.prototype.assert = require('./util/assert.js');


Parser.prototype.parseArrayExpression = require('./parse/array.js');
Parser.prototype.parseSpreadElement = require('./parse/spread.js');

Parser.prototype.parseClass = require('./parse/class.js');
Parser.prototype.parseSuper = require('./parse/super.js');

Parser.prototype.parseArrowFunctionExpression = require('./parse/arrow.js');

module.exports = Parser;
