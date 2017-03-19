Scope.prototype.clsScope = function(t) {
  return new ClassScope(this, t);
};

Scope.prototype.fnHeadScope = function(t) {
  return new FuncHeadScope(this, t);
};

Scope.prototype.fnBodyScope = function(t) {
  return new FuncBodyScope(this, t);
};

Scope.prototype.blockScope = function() {
  return new LexicalScope(this, ST_BLOCK);
};

Scope.prototype.catchBodyScope = function() {
  return new CatchBodyScope(this);
};

Scope.prototype.catchHeadScope = function() {
  return new CatchHeadScope(this);
};

Scope.prototype.bodyScope = function() {
  return new LexicalScope(this, ST_BODY);
};

Scope.prototype.parenScope = function() {
  return new ParenScope(this);
};
