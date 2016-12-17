
this . parseFor = function() {
  this.ensureStmt();
  this.fixupLabels(true) ;

  var startc = this.c0,
      startLoc = this.locBegin();

  this.next () ;
  if ( !this.expectType_soft ('(' ) &&
        this.err('for.with.no.opening.paren',startc, startLoc) )
    return this.errorHandlerOutput ;

  var head = null;
  var headIsExpr = false;

  var scopeFlags = this.scopeFlags;

  this.scopeFlags = SCOPE_FLAG_IN_BLOCK;

  this.enterLexicalScope(true);

  if ( this.lttype === 'Identifier' ) switch ( this.ltval ) {
     case 'var':
        this.canBeStatement = true;
        head = this.parseVariableDeclaration(CTX_FOR);
        break;

     case 'let':
        if ( this.v >= 5 ) {
          this.canBeStatement = true;
          head = this.parseLet(CTX_FOR);
        }

        break;

     case 'const' :

        if ( this.v < 5 && this.err('const.not.in.v5',startc, startLoc) )
          return this.errorHandlerOutput ;

        this.canBeStatement = true;
        head = this. parseVariableDeclaration(CTX_FOR);
           break ;
  }
  this.scopeFlags = scopeFlags;

  if ( head === null ) {
       headIsExpr = true;
       head = this.parseExpr( CTX_NULLABLE|CONTEXT_ELEM|CTX_FOR ) ;
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
          if (!headIsExpr) {
             if ( head.declarations.length !== 1 &&
                  this.err('for.in.or.of.multi',startc, startLoc,head) )
                return this.errorHandlerOutput;
//           if ( head.kind === 'const' &&
//                this.err( 'for.in.or.of.const', startc, starLoc, head) )
//              return this.errorHandlerOutput;
          }

          if (kind === 'ForOfStatement')
            this.ensureVarsAreNotResolvingToCatchParams();

          if ( this.unsatisfiedAssignment )
            this.unsatisfiedAssignment = null;

          if (headIsExpr) this.toAssig(core(head));

          this.next();
          afterHead = kind === 'ForOfStatement' ? 
            this.parseNonSeqExpr(PREC_WITH_NO_OP, CTX_NONE|CTX_PAT) :
            this.parseExpr(CTX_NONE|CTX_PAT);

          if ( ! this.expectType_soft (')') &&
                 this.err('for.iter.no.end.paren',start,startLoc,head,afterHead) )
            return this.errorHandlerOutput ;

          this.scopeFlags &= CLEAR_IB;
          this.scopeFlags |= ( SCOPE_FLAG_BREAK|SCOPE_FLAG_CONTINUE );
          nbody = this.parseStatement(true);
          if ( !nbody && this.err('null.stmt','for.iter',
               { s:startc, l:startLoc, h: head, iter: afterHead, scopeFlags: scopeFlags }) )
            return this.errorHandlerOutput;

          this.scopeFlags = scopeFlags;

          this.foundStatement = true;
          this.exitScope();
          return { type: kind, loc: { start: startLoc, end: nbody.loc.end },
            start: startc, end: nbody.end, right: core(afterHead), left: core(head), body: nbody/* ,y:-1*/ };

       default:
          return this.err('for.iter.not.of.in',startc, startLoc,head);
    }
  }

  if ( this.unsatisfiedAssignment &&
       this.err('for.simple.head.is.unsatisfied',startc,startLoc,head) )
    return this.errorHandlerOutput ;

/*
  if ( head && !headIsExpr ) {
    head.end = this.c;
    head.loc.end = { line: head.loc.end.line, column: this.col };
  }
*/
  if ( ! this.expectType_soft (';') &&
         this.err('for.simple.no.init.comma',startc,startLoc,head) )
    return this.errorHandlerOutput ;

  afterHead = this.parseExpr(CTX_NULLABLE );
  if ( ! this.expectType_soft (';') &&
         this.err('for.simple.no.test.comma',startc,startLoc,head,afterHead) )
    return this.errorHandlerOutput ;

  var tail = this.parseExpr(CTX_NULLABLE );

  if ( ! this.expectType_soft (')') &&
         this.err('for.simple.no.end.paren',startc,startLoc,head,afterHead,tail) )
    return this.errorHandlerOutput ;

  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= ( SCOPE_FLAG_CONTINUE|SCOPE_FLAG_BREAK );
  nbody = this.parseStatement(true);
  if ( !nbody && this.err('null.stmt','for.simple',
      { s:startc, l:startc, h: head, t: afterHead, u: tail, scopeFlags: scopeFlags } ) )
    return this.errorhandlerOutput;  

  this.scopeFlags = scopeFlags;

  this.foundStatement = true;

  this.exitScope();
  return { type: 'ForStatement', init: head && core(head), start : startc, end: nbody.end,
         test: afterHead && core(afterHead),
         loc: { start: startLoc, end: nbody.loc.end },
          update: tail && core(tail),
         body: nbody/* ,y:-1*/ };
};

this.ensureVarsAreNotResolvingToCatchParams = function() {
// #if V
  var list = this.scope.nameList, e = 0;
  while (e < list.length) {
    if (list[e].type & DECL_MODE_CATCH_PARAMS)
      this.err('for.of.var.overrides.catch', list[e].name);
    e++;
  }
// #else
  for (var name in this.scope.definedNames) {
    if (this.scope.definedNames[name] & DECL_MODE_CATCH_PARAMS)
      this.err('for.of.var.overrides.catch', name.substr(0, name.length-1));
  }
// #end
};
