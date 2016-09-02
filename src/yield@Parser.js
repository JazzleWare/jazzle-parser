
this.parseYield = function(context) {
  var arg = null,
      deleg = false;

  var c = this.c, li = this.li, col = this.col;
  var startc = this.c0, startLoc = this.locBegin();

  var y = 1;
  this.next();
  if (  !this.newLineBeforeLookAhead  ) {
     if ( this.lttype === 'op' && this.ltraw === '*' ) {
            deleg = !false;
            this.next();
            this.y = 0;
            arg = this.parseNonSeqExpr ( PREC_WITH_NO_OP, context & CONTEXT_FOR );
            y += this.y;
            if (!arg )
              this['yield.has.no.expr.deleg'](startc,startLoc);
     }
     else {
        this.y = 0;
        arg = this. parseNonSeqExpr ( PREC_WITH_NO_OP, (context & CONTEXT_FOR)|CONTEXT_NULLABLE );
        y += this.y;
     }
  }

  var endI, endLoc;

  if ( arg ) { endI = arg.end; endLoc = arg.loc.end; }
  else { endI = c; endLoc = { line: li, column: col }; }  

  var n = { type: 'YieldExpression', argument: arg && core(arg), start: startc, delegate: deleg,
           end: endI, loc: { start : startLoc, end: endLoc }, y: y }

  if ( !this.firstYS )
        this.firstYS = n;
 
  this.y = y;
  return n;
};


