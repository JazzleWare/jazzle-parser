this.parseSwitchStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false) ;

  var startc = this.c0,
      startLoc = this.locBegin(),
      cases = [],
      hasDefault = false ,
      scopeFlags = this.scopeFlags,
      elem = null;

  this.next() ;
  if ( !this.expectType_soft ('(') &&
       this.err('switch.has.no.opening.paren') )
    return this.errorHandlerOutput;

  var switchExpr = core(this.parseExpr(CTX_NONE|CTX_TOP));
  !this.expectType_soft (')') &&
  this.err('switch.has.no.closing.paren');

  !this.expectType_soft ('{') &&
  this.err('switch.has.no.opening.curly');

  this.enterLexicalScope(false); 
  this.scopeFlags |=  (SCOPE_FLAG_BREAK|SCOPE_FLAG_IN_BLOCK);
  while ( elem = this.parseSwitchCase()) {
    if (elem.test === null) {
       if (hasDefault ) this.err('switch.has.a.dup.default');
       hasDefault = true ;
    }
    cases.push(elem);
  }

  this.scopeFlags = scopeFlags ;
  this.foundStatement = true;

  var scope = this.exitScope(); 
  var n = { type: 'SwitchStatement', cases: cases, start: startc, discriminant: switchExpr,
            end: this.c, loc: { start: startLoc, end: this.loc() }/*,scope:  scope  ,y:-1*/};
  if ( !this.expectType_soft ('}' ) &&
        this.err('switch.unfinished') )
    return this.errorHandlerOutput ;

  return n;
};


