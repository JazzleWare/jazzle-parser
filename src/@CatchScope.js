function CatchScope(sParent) {
  LexicalScope.call(this, sParent, ST_CATCH);
  
  this.paramList = new SortedObj();
  this.hasSimpleList = true;
  this.catchVarName = "";
}
