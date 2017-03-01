this.calculateAllowedActions = function() {
  var a = SA_NONE;
  if (this.isLexical() || this.isBare())
    a |= this.parent.allowed;
  else if (this.isFunc()) {
    a |= SA_RETURN;
    if (this.isCtor())
      a |= (SA_CALLSUP|SA_MEMSUP);
    else if (this.isGen())
      a |= SA_YIELD;
    else {
      a |= SA_MEMSUP;
      if (this.isAsync())
        a |= SA_AWAIT;
    }
  }

  return a;
};

this.calculateScopeMode = function() {
  var m = SM_NONE;
  if (!this.parent) {
    ASSERT.call(this, this.isGlobal(),
      'global scope is the only scope that ' +
      'can have a null parent');
    return m;
  }

  if (this.isClass() || this.isModule() ||
      this.parent.insideStrict())
    m |= SM_STRICT;

  if (this.isLexical() && this.parent.insideLoop())
    m |= SM_LOOP;

  return m;
};

this.setName = function(name) {
  ASSERT.call(this, this.isExpr(),
    'the current scope is not an expr scope, and can not have a name');
  ASSERT.call(this, this.exprName === "",
    'the current scope has already got a name');
  this.exprName = name;
};
