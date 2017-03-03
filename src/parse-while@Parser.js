this.parseWhileStatement = function () {
   this.enterLexicalScope(true);
   if ( ! this.ensureStmt_soft () &&
          this.err('not.stmt') )
     return this.errorHandlerOutput;

   this.fixupLabels(true);

   var startc = this.c0,
       startLoc = this.locBegin();
   this.next();

   !this.expectType_soft ('(') &&
   this.err('while.has.no.opening.paren');
 
   var cond = core( this.parseExpr(CTX_NONE|CTX_TOP) );

   !this.expectType_soft (')') &&
   this.err('while.has.no.closing.paren');

   var scopeFlags = this.scopeFlags;
   this.scopeFlags &= CLEAR_IB;
   this.scopeFlags |= (SCOPE_FLAG_CONTINUE|SCOPE_FLAG_BREAK );
   var nbody = this.parseStatement(false);
   this.scopeFlags = scopeFlags ;
   this.foundStatement = true;

   var scope = this.exitScope();
   return { type: 'WhileStatement', test: cond, start: startc, end: nbody.end,
       loc: { start: startLoc, end: nbody.loc.end }, body:nbody/*,scope:  scope ,y:-1*/ };
};
