this.parseIfStatement = function () {
  if ( !this.ensureStmt_soft () && this.err('not.stmt') )
    return this.errorHandlerOutput;

  this.fixupLabels(false);
  this.enterLexicalScope(false); 

  var startc = this.c0,
      startLoc  = this.locBegin();
  this.next () ;
  !this.expectType_soft('(') &&
  this.err('if.has.no.opening.paren');

  var cond = core(this.parseExpr(CTX_NONE|CTX_TOP));

  !this.expectType_soft (')') &&
  this.err('if.has.no.closing.paren');

  var scopeFlags = this.scopeFlags ;
  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= SCOPE_FLAG_IN_IF;
  var nbody = this. parseStatement (false);
  var alt = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'else') {
     this.kw(), this.next() ;
     alt = this.parseStatement(false);
  }
  this.scopeFlags = scopeFlags ;

  var scope = this.exitScope(); 

  this.foundStatement = true;
  return { type: 'IfStatement', test: cond, start: startc, end: (alt||nbody).end,
     loc: { start: startLoc, end: (alt||nbody).loc.end }, consequent: nbody, alternate: alt/*,scope:  scope  ,y:-1*/};
};
