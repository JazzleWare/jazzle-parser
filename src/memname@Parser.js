this .memberID = function() { return this.v > 5 ? this.id() : this.validateID(null) ; };
this .memberExpr = function() {
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next() ;
  var e = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE); // TODO: should be CONTEXT_NULLABLE, or else the next line is in vain 
  if (!e && this.err('prop.dyna.no.expr',startc,startLoc) ) // 
    return this.errorHandlerOutput ;

  var n = { type: PAREN, expr: e, start: startc, end: this.c, loc: { start: startLoc, end: this.loc() } } ;
  if ( !this.expectType_soft (']') &&
        this.err('prop.dyna.is.unfinished',n) )
    return this.errorHandlerOutput ;
 
  return n;
};


