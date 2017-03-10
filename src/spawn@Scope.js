this.clsScope = function(t) {
  return new ClassScope(this, t);
};

this.fnHeadScope = function(t) {
  return new FuncHeadScope(this, t);
};

this.fnBodyScope = function(t) {
  return new FuncBodyScope(this, t);
};

this.blockScope = function() {
  ASSERT.call(this, !this.isBare(),
    'a body scope must not have a descendant '+
    'block scope; rather, it should be converted '+
    'to an actual block scope');
  return new LexicalScope(this, ST_BLOCK);
};

this.catchBodyScope = function() {
  return new CatchBodyScope(this);
};

this.catchHeadScope = function() {
  return new CatchHeadScope(this);
};

this.bodyScope = function() {
  return new LexicalScope(this, ST_BODY);
};

this.parenScope = function() {
  return new ParenScope(this);
};
