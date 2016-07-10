_class .memberID = function() { return this.v > 5 ? this.id() : this.validateID(null) ; };
_class .memberExpr = function() {
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next() ;
  var e = this.parseExpr(CONTEXT_NONE);
  this.assert(e);
  var n = { type: PAREN, expr: e, start: startc, end: this.c, loc: { start: startLoc, end: this.loc() } } ;
  this.expectType (']');
  return n;
};


