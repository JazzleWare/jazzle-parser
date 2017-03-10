function FuncBodyScope(sParent, sType) {
  Scope.call(this, sParent, sType|ST_BODY);

  this.prologue = null;
  this.funcHead = null;
}

