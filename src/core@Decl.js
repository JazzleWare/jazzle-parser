Decl.prototype.isHoistedInItsScope = function() {
  return this.mode & DM_FUNCTION;
};

Decl.prototype.isVarLike = function() {
  if (this.isFunc())
    return this.ref.scope.isConcrete();
  return this.isVName() ||
         this.isFuncArg();
};

Decl.prototype.isLexical = function() {
  if (this.isFunc())
    return this.ref.scope.isLexical();
  return this.isClass() ||
         this.isLName() ||
         this.isCName();
};

Decl.prototype.isTopmostInItsScope = function() {
  return this.isFuncArg() ||
         this.isCatchArg() ||
         this.isHoistedInItsScope() ||
         this.isVarLike();
};

Decl.prototype.isClass = function() {
  return this.mode & DM_CLS;
};

Decl.prototype.isCatchArg = function() {
  return this.mode & DM_CATCHARG;
};

Decl.prototype.isFunc = function() {
  return this.mode & DM_FUNCTION;
};

Decl.prototype.isFuncArg = function() {
  return this.mode & DM_FNARG;
};

Decl.prototype.isVName = function() {
  return this.mode & DM_VAR;
};

Decl.prototype.isLName = function() {
  return this.mode & DM_LET;
};

Decl.prototype.isCName = function() {
  return this.mode & DM_CONST;
};

Decl.prototype.isName = function() {
  return this.mode &
    (DM_VAR|DM_LET|DM_CONST);
};

Decl.prototype.absorbRef = function(otherRef) {
  ASSERT.call(this, !otherRef.resolved,
    'a resolved reference must not be absorbed by a declref');

  var fromScope = otherRef.scope;
  var cur = this.ref;

  if (fromScope.isIndirect()) {
    if (fromScope.isHoisted() &&
        !this.isTopmostInItsScope())
      cur.indirect.fw += ref.total();
    else
      cur.indirect.ex += ref.total()
  } else {
    cur.indirect.ex += ref.indirect.total();
    cur.direct.ex += ref.direct.total();
  }

  return cur;
};

Decl.prototype.m = function(mode) {
  ASSERT.call(this, this.mode === DM_NONE,
    'can not change mode');
  this.mode = mode;
  return this;
};

Decl.prototype.r = function(ref) {
  ASSERT.call(this, this.ref === null,
    'can not change ref');
  this.ref = ref;
  this.i = this.ref.scope.iRef.v++;
  return this;
};

Decl.prototype.n = function(name) {
  ASSERT.call(this, this.name === "",
    'can not change name');
  this.name = name;
  return this;
};

Decl.prototype.s = function(site) {
  ASSERT.call(this, this.site === null,
    'can not change site');
  this.site = site;
  return this;
};
