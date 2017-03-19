// function component: function head or function body
Scope.prototype.isGlobal = function() { return this.type & ST_GLOBAL; };
Scope.prototype.isModule = function() { return this.type & ST_MODULE; };
Scope.prototype.isScript = function() { return this.type & ST_SCRIPT; };
Scope.prototype.isDecl = function() { return this.type & ST_DECL; };
Scope.prototype.isClass = function() { return this.type & ST_CLS; };
Scope.prototype.isAnyFnComp = function() { return this.type & ST_ANY_FN; };
Scope.prototype.isAnyFnHead = function() {
  return this.isAnyFnComp() && this.isHead();
};
Scope.prototype.isAnyFnBody = function() {
  return this.isAnyFnComp() && this.isBody();
};
Scope.prototype.isClassMem = function() { return this.type & ST_CLSMEM; };
Scope.prototype.isGetterComp = function() { return this.type & ST_GETTER; };
Scope.prototype.isSetterComp = function() { return this.type & ST_SETTER; };
Scope.prototype.isStaticMem = function() { return this.type & ST_STATICMEM; };
Scope.prototype.isCtorComp = function() { return this.type & ST_CTOR; };
Scope.prototype.isObjMem = function() { return this.type & ST_OBJMEM; };
Scope.prototype.isArrowComp = function() { return this.type & ST_ARROW; };
Scope.prototype.isBlock = function() { return this.type & ST_BLOCK; };
Scope.prototype.isCatchComp = function() { return this.type & ST_CATCH; };
Scope.prototype.isBody = function() { return this.type & ST_BODY; };
Scope.prototype.isMethComp = function() { return this.type & ST_METH; };
Scope.prototype.isExpr = function() { return this.type & ST_EXPR; };
Scope.prototype.isMem = function() { return this.isStaticMem() || this.isClassMem() || this.isObjMem(); };
Scope.prototype.isGenComp = function() { return this.type & ST_GEN; };
Scope.prototype.isAsyncComp = function() { return this.type & ST_ASYNC; };
Scope.prototype.isAccessorComp = function() { return this.isGetterComp() || this.isSetterComp(); };
Scope.prototype.isSpecialComp = function() { return this.isAccessorComp() || this.isGenComp(); };
Scope.prototype.isLexical = function() { return this.isCatchBody() || this.isBlock(); };
Scope.prototype.isTopLevel = function() { return this.type & ST_TOP; };
Scope.prototype.isHoistable = function() { return this.isSimpleFnComp() && this.isDecl(); };
Scope.prototype.isIndirect = function() { return this.isAnyFnComp() || this.isClass(); };
Scope.prototype.isConcrete = function() { return this.type & ST_CONCRETE; };
Scope.prototype.isSimpleFnComp = function() { return this.type & ST_FN; };
Scope.prototype.isBare = function() { return this.isBody() && !(this.isLexical() || this.isAnyFnComp()); };
Scope.prototype.isCatchBody = function() { return this.isCatchComp() && this.isBody(); };
Scope.prototype.isCatchHead = function() { return this.isCatchComp() && this.isHead(); };
Scope.prototype.isHead = function() { return this.type & ST_HEAD; };
Scope.prototype.isParen = function() { return this.type & ST_PAREN; };

Scope.prototype.insideIf = function() { return this.mode & SM_INSIDE_IF; };
Scope.prototype.insideLoop = function() { return this.mode & SM_LOOP; };
Scope.prototype.insideStrict = function() { return this.mode & SM_STRICT; };
Scope.prototype.insideBlock = function() { return this.mode & SM_BLOCK; };
Scope.prototype.insideFuncArgs = function() { return this.mode & SM_INARGS; };
Scope.prototype.insideForInit = function() { return this.mode & SM_FOR_INIT; };
Scope.prototype.insideUniqueArgs = function() { return this.mode & SM_UNIQUE; };

Scope.prototype.canReturn = function() { return this.allowed & SA_RETURN; };
Scope.prototype.canContinue = function() { return this.allowed & SA_CONTINUE; };
Scope.prototype.canBreak = function() { return this.allowed & SA_BREAK; };
Scope.prototype.canDeclareLetOrClass = function() {
  return this.isAnyFnBody() || this.isTopLevel() || this.isLexical() || this.insideForInit();
};
Scope.prototype.canDeclareFunc = function() {
  if (this.insideStrict())
    return false;

  return this.isTopLevel() ||
         this.isAnyFnBody() ||
         this.isLexical() ||
         this.insideIf();
};

Scope.prototype.canYield = function() { return this.allowed & SA_YIELD; };
Scope.prototype.canAwait = function() { return this.allowed & SA_AWAIT; };
Scope.prototype.canSupCall = function() {
  return this.isArrowComp() ?
    this.parent.canSupCall() :
    this.allowed & SA_CALLSUP
};

Scope.prototype.canSupMem = function() {
  return this.isArrowComp() ?
    this.parent.canSupMem() :
    this.allowed & SA_MEMSUP;
};

Scope.prototype.canHaveNewTarget = function() {
   return this.isArrowComp() ?
     this.parent.canHaveNewTarget() :
     this.isAnyFnComp();
};

Scope.prototype.canDup = function() {
  ASSERT.call(this, this.insideFuncArgs(),
    'it has no meaning to call canDup when not ' +
    'in func-arguments');
  return !this.insideStrict() &&
         !this.insideUniqueArgs();
};

Scope.prototype.enterForInit = function() {
  ASSERT.call(this, this.isBare(),
    'to enter for init mode, the scope has to be a bare one');

  this.mode |= SM_FOR_INIT;
};

Scope.prototype.exitForInit = function() {
  ASSERT.call(this, this.insideForInit(),
    'can not unset the for-init mode when it is not set');

  this.mode &= ~SM_FOR_INIT;
};

Scope.prototype.enterStrict = function() {
  this.mode |= SM_STRICT;
};

Scope.prototype.exitStrict = function() {
  ASSERT.call(this, this.insideStrict(),
    'can not unset strict when it is not set');
  this.mode &= ~SM_STRICT;
};

Scope.prototype.yieldIsKW = function() { return this.mode & SM_YIELD_KW; };
Scope.prototype.awaitIsKW = function() { return this.mode & SM_AWAIT_KW; };

Scope.prototype.hasHeritage = function() {
  ASSERT.call(this, this.isClass(),
    'only classes are allowed to be tested for '+
    'heritage');
  return this.mode & SM_CLS_WITH_SUPER;
};
