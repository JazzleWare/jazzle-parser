
_class.parseYield = function(context) {
  var arg = null,
      deleg = false;

  var c = this.c, li = this.li, col = this.col;
  var startc = this.c0, startLoc = this.locBegin();

  this.next();
  if (  !this.newLineBeforeLookAhead  ) {
     if ( this.lttype === 'op' && this.ltraw === '*' ) {
            deleg = !false;
            this.next();
            arg = this.parseNonSeqExpr ( PREC_WITH_NO_OP, context & CONTEXT_FOR );
            this.assert(arg);
     }
     else
        arg = this. parseNonSeqExpr ( PREC_WITH_NO_OP, (context & CONTEXT_FOR)|CONTEXT_NULLABLE );
  }

  var endI, endLoc;

  if ( arg ) { endI = arg.end; endLoc = arg.loc.end; }
  else { endI = c; endLoc = { line: li, column: col }; }  

  var n = { type: 'YieldExpression', argument: arg && core(arg), start: startc, delegate: deleg,
           end: endI, loc: { start : startLoc, end: endLoc } }

  if ( !this.firstYS )
        this.firstYS = n;
 
  return n;
};


