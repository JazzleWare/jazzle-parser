function ParenScope(sParent) {
  Scope.call(this, sParent, ST_PAREN);
  this.target = sParent;
}

ParenScope.prototype = createObj(Scope.prototype);
