/* global PREC_WITH_NO_OP, CONTEXT_NONE */

module.exports.parseSpread = function() {
  var startc = this.c - 1 - 2; // FIXME: -3?
  var startLoc = this.locOn(1 + 2);
  this.next ();

  var e = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE);

  return {
    type: 'SpreadElement',
    loc: { start: startLoc, end: e.loc.end },
    start: startc, end: e.end,
    argument: core(e) // FIXME: this.core?
  };
}

module.exports.default =  parseSpread;
