var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;

module.exports .memberID = function() { return this.v > 5 ? this.id() : this.validateID(null) ; };
module.exports .memberExpr = function() {
  var startc = this.c - 1, startLoc = this.locOn(1);
  this.next() ;
  var e = this.parseExpr(CONTEXT.NONE);
  this.assert(e);
  var n = { type: CONST.PAREN, expr: e, start: startc, end: this.c, loc: { start: startLoc, end: this.loc() } } ;
  this.expectType (']');
  return n;
};
