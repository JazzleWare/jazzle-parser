this.receiveRef_m = function(mname, ref) {
  var decl = null;
  if (ref.scope.isClassMem()) {
    if (ref.isCalledSuper())
      decl = this.getCalledSuper();
    else if (ref.isMemSuper())
      decl = this.getMemSuper();
  }

  if (decl !== null)
    decl.absorbRef(ref);
  else
    this.findRef_m(mname, true).absorb(ref);
};
