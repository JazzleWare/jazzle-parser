
var Parser = require('./constructor.js');

function mixin(mainClass, sub) {
  Object.keys(sub).forEach(function (key) {
     mainClass [key] = sub[key];
  });
}

// context is autobound
Parser.prototype.assert = require('./util/assert.js');

mixin(Parser.prototype, require('./prototype/array') );
mixin(Parser.prototype, require('./prototype/arrow') );
mixin(Parser.prototype, require('./prototype/assignment') );
mixin(Parser.prototype, require('./prototype/class') );
mixin(Parser.prototype, require('./prototype/comment') );
mixin(Parser.prototype, require('./prototype/esc-general') );
mixin(Parser.prototype, require('./prototype/esc-unicode') );
mixin(Parser.prototype, require('./prototype/export') );
mixin(Parser.prototype, require('./prototype/for') );
mixin(Parser.prototype, require('./prototype/fundef') );
mixin(Parser.prototype, require('./prototype/identifier') );
mixin(Parser.prototype, require('./prototype/idStatementOrId') );
mixin(Parser.prototype, require('./prototype/import') );
mixin(Parser.prototype, require('./prototype/let') );
mixin(Parser.prototype, require('./prototype/loc') );
mixin(Parser.prototype, require('./prototype/memname') );
mixin(Parser.prototype, require('./prototype/new') );
mixin(Parser.prototype, require('./prototype/nextlookahead') );
mixin(Parser.prototype, require('./prototype/non-assig') );
mixin(Parser.prototype, require('./prototype/number') );
mixin(Parser.prototype, require('./prototype/obj-class-common') );
mixin(Parser.prototype, require('./prototype/obj') );
mixin(Parser.prototype, require('./prototype/pattern') );
mixin(Parser.prototype, require('./prototype/primary') );
mixin(Parser.prototype, require('./prototype/program') );
mixin(Parser.prototype, require('./prototype/regex') );
mixin(Parser.prototype, require('./prototype/semi') );
mixin(Parser.prototype, require('./prototype/spread') );
mixin(Parser.prototype, require('./prototype/statement') );
mixin(Parser.prototype, require('./prototype/string') );
mixin(Parser.prototype, require('./prototype/super') );
mixin(Parser.prototype, require('./prototype/template') );
mixin(Parser.prototype, require('./prototype/validate') );
mixin(Parser.prototype, require('./prototype/var') );
mixin(Parser.prototype, require('./prototype/yield') );

module.exports = Parser;

