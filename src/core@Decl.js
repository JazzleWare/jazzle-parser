this.isHoistedInItsScope = function() {
  return this.mode & DM_FUNCTION;
};

this.isVarLike = function() {
  if (this.isFunc())
    return this.scope.isConcrete();
  return this.isVName() ||
         this.isFuncArg();
};

this.isLexical = function() {
  if (this.isFunc())
    return this.scope.isLexical();
  return this.isClass() ||
         this.isLName() ||
         this.isCName();
};

this.isTopmostInItsScope = function() {
  return this.isFuncArg() ||
         this.isCatchArg() ||
         this.isHoistedInItsScope() ||
         this.isVarLike();
};

this.isClass = function() {
  return this.mode & DM_CLS;
};

this.isCatchArg = function() {
  return this.mode & DM_CATCHARG;
};

this.isFunc = function() {
  return this.mode & DM_FUNCTION;
};

this.isFuncArg = function() {
  return this.mode & DM_FNARG;
};

this.isVName = function() {
  return this.mode & DM_VAR;
};

this.isLName = function() {
  return this.mode & DM_LET;
};

this.isCName = function() {
  return this.mode & DM_CONST;
};

this.isName = function() {
  return this.mode &
    (DM_VAR|DM_LET|DM_CONST);
};

this.absorbRef = function(otherRef) {
  ASSERT.call(this, otherRef.unresolved,
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
