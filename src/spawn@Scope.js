this.clsScope = function(t) {
  return new ClassScope(this, ST_CLS|t);
};

this.genScope = function(t) {
  return new Scope(this, ST_GEN|t);
};

this.fnScope = function(t) {
  return new Scope(this, ST_FN|t);
};

this.blockScope = function() {
  ASSERT.call(this, !this.isBody(),
    'a body scope must not have a descendant '+
    'lock scope; rather, it should be converted '+
    'to an actual block scope');
  return new LexicalScope(this, ST_BLOCK);
};

this.bodyScope = function() {
  return new LexicalScope(this, ST_BODY);
};

this.catchScope = function() {
  return new CatchScope(this, ST_CATCH);
};

this.arrowScope = function() {
  return new Scope(this, ST_ARROW);
};

this.ctorScope = function() {
  ASSERT.call(this, this.isClass(),
    'only class scopes');
  return new Scope(this, ST_CTOR);
};
