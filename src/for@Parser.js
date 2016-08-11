
this . parseFor = function() {
  this.ensureStmt();
  this.fixupLabels(!false) ;

  var startc = this.c0,
      startLoc = this.locBegin();

  this.next () ;
  if ( !this.expectType_soft ('(' ) )
     this['for.with.no.opening.paren'](startc, startLoc);

  var head = null;
  var headIsExpr = false;

  var scopeFlags = this.scopeFlags;

  if ( this.lttype === 'Identifier' ) switch ( this.ltval ) {
     case 'var':
        this.canBeStatement = !false;
        head = this.parseVariableDeclaration(CONTEXT_FOR);
        break;

     case 'let':
        if ( this.v >= 5 ) {
          this.canBeStatement = !false;
          head = this.parseLet(CONTEXT_FOR);
        }

        break;

     case 'const' :

        if ( this.v < 5 )
          this['const.not.in.v5'](startc, startLoc);

        this.canBeStatement = !false;
        head = this. parseVariableDeclaration(CONTEXT_FOR);
           break ;
  }

  if ( head === null ) {
       headIsExpr = !false;
       head = this.parseExpr( CONTEXT_NULLABLE|CONTEXT_ELEM|CONTEXT_FOR ) ;
  }
  else 
     this.foundStatement = false;

  var kind = 'ForOfStatement';
  var nbody = null;
  var afterHead = null;

  if ( head !== null /* && // if we have a head
       ( headIsExpr || // that is an expression
       (head.declarations.length === 1  && !head.declarations[0].init ) ) */ && // or one and only one lone declarator
       this.lttype === 'Identifier' ) { // then if the token ahead is an id
    switch ( this.ltval ) {
       case 'in':
          kind = 'ForInStatement';

       case 'of':
          if (!headIsExpr && head.declarations.length !== 1 )
            this['for.in.or.of.multi'](startc, startLoc,head);

          if ( this.unsatisfiedAssignment )
            this.unsatisfiedAssignment = null;

          if (headIsExpr) this.toAssig(core(head));

          this.next();
          afterHead = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE) ;
          if ( ! this.expectType_soft (')') )
              this['for.iter.no.end.paren'](start,startLoc);

          this.scopeFlags |= ( SCOPE_BREAK|SCOPE_CONTINUE );
          nbody = this.parseStatement(!false);
          if ( !nbody ) this['null.stmt']('for.iter',startc,startLoc);

          this.scopeFlags = scopeFlags;

          this.foundStatement = !false;
          return { type: kind, loc: { start: startLoc, end: nbody.loc.end },
            start: startc, end: nbody.end, right: core(afterHead), left: core(head), body: nbody };

       default:
          return this['for.iter.not.of.in'](startc, startLoc);
    }
  }

  if ( this.unsatisfiedAssignment )
    this['for.simple.head.is.unsatisfied'](startc,startLoc);

/*
  if ( head && !headIsExpr ) {
    head.end = this.c;
    head.loc.end = { line: head.loc.end.line, column: this.col };
  }
*/
  if ( !this.expectType_soft (';') )
      this['for.simple.no.init.comma'](startc,startLoc);

  afterHead = this.parseExpr(CONTEXT_NULLABLE );
  if ( ! this.expectType_soft (';') )
      this['for.simple.no.test.comma'](startc,startLoc);

  var tail = this.parseExpr(CONTEXT_NULLABLE );

  if ( ! this.expectType_soft (')') )
      this['for.simple.no.end.paren'](startc,startLoc);

  this.scopeFlags |= ( SCOPE_CONTINUE|SCOPE_BREAK );
  nbody = this.parseStatement(! false);
  if ( !nbody )
    this['null.stmt']('for.simple', startc, startLoc);  

  this.scopeFlags = scopeFlags;

  this.foundStatement = !false;
  return { type: 'ForStatement', init: head && core(head), start : startc, end: nbody.end,
         test: afterHead && core(afterHead),
         loc: { start: startLoc, end: nbody.loc.end },
          update: tail && core(tail),
         body: nbody };
};


