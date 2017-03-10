function FuncHeadScope(sParent, st) {
  Scope.call(this, sParent, st|ST_HEAD);
  this.paramList = [];
  this.firstNonSimple = null;
  this.scopeName = "";
  this.paramMap = {};
  this.firstDup = null;

  this.mode |= SM_INARGS;
}

