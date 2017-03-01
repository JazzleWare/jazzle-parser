function FunctionScope(sParent, sType) {
  Scope.call(this, sParent, sType|ST_FN);

  this.prologue = null;
  this.firstDup = null;
  this.firstNonSimple = null;
  this.paramList = [];
  this.paramMap = {};
  this.exprName = "";
}
