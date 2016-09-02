this .memberID = function() { return this.v > 5 ? this.id() : this.validateID(null) ; };
this .memberExpr = function() {
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next() ;
  this.y = 0;
  var e = this.parseExpr(CONTEXT_NONE);
  if (!e) this['prop.dyna.no.expr'](startc,startLoc);

  var n = { type: PAREN, expr: e, start: startc, end: this.c, loc: { start: startLoc, end: this.loc() } } ;
  if ( !this.expectType_soft (']') )
        this['prop.dyna.is.unfinished'](n);
 
  return n;
};


