var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseSpreadElement = function() {
  var startc = this.c - 1 - 2; // FIXME: -3?
  var startLoc = this.locOn(1 + 2);
  this.next ();

  var e = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE);

  return {
    type: 'SpreadElement',
    loc: { start: startLoc, end: e.loc.end },
    start: startc, end: e.end,
    argument: core(e) // FIXME: this.core?
  };
};
