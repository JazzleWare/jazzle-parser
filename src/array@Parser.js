_class.parseArrayExpression = function (context ) {
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  var elem = null,
      list = [];

  this.next () ;

  if ( context & CONTEXT_UNASSIGNABLE_CONTAINER )
      context = (context & CONTEXT_PARAM)|CONTEXT_NULLABLE;

  else
      context = (context & CONTEXT_PARAM)|CONTEXT_NULLABLE|CONTEXT_ELEM;

  var firstEA = null;
  var firstUnassignable = null, firstParen = null;
  var unsatisfiedAssignment = this.unsatisfiedAssignment;
  do {
     this.firstUnassignable = this.firstParen = null;
     this.unsatisfiedAssignment = null ;

     this.firstEA = null;

     elem = this.parseNonSeqExpr (PREC_WITH_NO_OP, context );
     if ( elem ) {
        if ( !unsatisfiedAssignment && this.unsatisfiedAssignment ) {
              this.assert ( context & CONTEXT_ELEM );
              unsatisfiedAssignment =  this.unsatisfiedAssignment;
        }
     }
     else if ( this.lttype === '...' )
         elem = this.parseSpreadElement();
 
     if ( !firstParen && this.firstParen )
           firstParen =  this.firstParen ;

     if ( !firstUnassignable && this.firstUnassignable )
           firstUnassignable =  this.firstUnassignable ;

     if ( !firstEA && this.firstEA )
           firstEA =  this.firstEA ;

     if ( this.lttype === ',' ) { 
        list.push(elem) ;
        this.next();
     }
     else  {
        if ( elem ) list.push(elem);
        break ;
     }
 
  } while ( !false );

  if ( firstParen ) this.firstParen = firstParen ;
  if ( firstUnassignable ) this.firstUnassignable = firstUnassignable;

  this.firstEA = firstEA;
  this.unsatisfiedAssignment = unsatisfiedAssignment;
  elem = { type: 'ArrayExpression', loc: { start: startLoc, end: this.loc() },
           start: startc, end: this.c, elements : list};

  this. expectType ( ']' ) ;

  return elem;
};

_class . parseSpreadElement = function() {
  var startc = this.c-1-2,
      startLoc = this.locOn(1+2);
  this.next ();
  
  var e = this.parseNonSeqExpr(PREC_WITH_NO_OP,CONTEXT_NONE );
  return { type: 'SpreadElement',
          loc: { start: startLoc, end: e.loc.end },
          start: startc,
           end: e.end,
          argument: core(e) };
};


