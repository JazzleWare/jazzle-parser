this.parseBlockStatement = function () {
  this.fixupLabels(false);

  this.enterLexicalScope(false); 
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next();
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= SCOPE_FLAG_IN_BLOCK;

  var n = { type: 'BlockStatement', body: this.blck(), start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() }/*,scope:  this.scope  ,y:-1*/};

  if ( !this.expectType_soft ('}' ) &&
        this.err('block.unfinished',{tn:n,extra:{delim:'}'}}))
    return this.errorHandlerOutput ;

  this.exitScope(); 
  this.scopeFlags = scopeFlags;
  return n;
};
