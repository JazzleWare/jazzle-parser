this.declare = function(name, mode) {
  return this.declare_m(_m(name), mode);
};

this.declare_m = function(mname, mode) {
  if (mode & DM_LET)
    return this.let_m(mname, mode);
  if (mode & DM_FUNCTION)
    return this.function_m(mname, mode);
  if (mode & DM_CONST)
    return this.const_m(mname, mode);
  if (mode & DM_VAR)
    return this.var_m(mname, mode);
  if (mode & DM_CLS)
    return this.class_m(mname, mode);

  ASSERT.cal(this, false, 'declmode unknown');
};

this.findDecl = function(name) {
  return this.findDecl_m(_m(name));
};

this.let_m = function(mname, mode) {
  return this.declareLexical_m(mname, mode);
};

this.function_m = function(mname, mode) {
  return this.isLexical() ?
    this.declareLexical_m(mname, mode) :
    this.declareVarLike_m(mname, mode);
};

this.const_m = function(mname, mode) {
  return this.declareLexical_m(mname, mode);
};

this.var_m = function(mname, mode) {
  return this.declareVarLike_m(mname, mode);
};

this.class_m = function(mname, mode) {
  return this.declareLexical_m(mname, mode);
};

this.declareLexical_m = function(mname, mode) {
  var existing = this.findDecl_m(mname);
  if (existing)
    this.err('lexical.can.not.override.existing');

  var newDecl = new Decl().m(mode).n(_u(mname)).r(ref),
      ref = this.findRef_m(mname, true);

  this.insertDecl_m(mname, newDecl);
  return newDecl;
};

this.declareVarLike_m = function(mname, mode) {
  var existing = this.findDecl_m(mname);
  if (existing) {
    if (existing.isCatchArg()) {
      if (!(mode & DM_VAR))
        this.err('nonvar.can.not.override.catchparam');
      if (!existing.ref.scope.hasSimpleList)
        this.err('non.simple.catch.var.is.not.overridable');
    } else if (!existing.isVarLike())
      this.err('var.can.not.override.nonvarlike');

    if (!existing.isFunc() && (mode & DM_FUNC))
      existing.mode = mode;

    return existing;
  }

  var newDecl = new Decl().m(mode).n(_u(mname)).r(ref),
      ref = this.findRef_m(mname, true);

  this.insertDecl_m(mname, newDecl);
};

this.findDecl_m = function(mname) {
  return this.defs.has(mname) ?
    this.defs.get(mname) : null;
};

this.insertDecl_m = function(mname, decl) {
  this.defs.set(mname, decl);
};
