this.isGlobal = function() { return this.type & ST_GLOBAL; };
this.isModule = function() { return this.type & ST_MODULE; };
this.isScript = function() { return this.type & ST_SCRIPT; };
this.isDecl = function() { return this.type & ST_DECL; };
this.isClass = function() { return this.type & ST_CLS; };
this.isAnyFunc = function() { 
  return this.type & ST_ANY_FN;
};
this.isClassMem = function() {
  return this.type & ST_CLSMEM;
};
this.isGetter = function() {
  return this.type & ST_GETTER;
};
this.isSetter = function() {
  return this.type & ST_SETTER;
};
this.isStatic = function() {
  return this.type & ST_STATICMEM;
};
this.isCtor = function() { return this.type & ST_CTOR; };
this.isObjMem = function() {
  return this.type & ST_OBJMEM;
};
this.isArrow = function() { return this.type & ST_ARROW; };
this.isBlock = function() { return this.type & ST_BLOCK; };
this.isCatch = function() { return this.type & ST_CATCH; };
this.isBare = function() { return this.type & ST_BARE; };
this.isMeth = function() { return this.type & ST_METH; };
this.isExpr = function() { return this.type & ST_EXPR; };
this.isAccessor = function() {
  return this.type & ST_ACCESSOR;
};
this.isSpecial = function() {
  return this.type & ST_SPECIAL;
};
this.isLexical = function() {
  return this.type & ST_LEXICAL;
};
this.isTopLevel = function() {
  return this.type & ST_TOP;
};
this.isHoistable = function() { return this.isDecl(); };
this.isIndirect = function() { 
  return this.isAnyFunc() || this.isClass();
};
this.isConcrete = function() {
  return this.type & ST_CONCRETE;
};
this.isSimpleFunc = function() {
  return this.type & ST_FN;
};

this.insideIf = function() {
  return this.mode & SM_INSIDE_IF;
};

this.insideLoop = function() {
  return this.mode & SM_LOOP;
};

this.insideStrict = function() {
  return this.mode & SM_STRICT;
};

this.insideBlock = function() {
  return this.mode & SM_BLOCK;
};

this.insideFuncArgs = function() {
  return this.mode & SM_INARGS;
};

this.insideForInit = function() {
  return this.mode & SM_FOR_INIT;
};

this.canReturn = function() {
  return this.mode & SA_RETURN;
};

this.canContinue = function() {
  return this.mode & SA_CONTINUE;
};

this.canBreak = function() {
  return this.mode & SA_BREAK;
};

this.canDeclareLet = function() {
  return this.isBlock();
};

this.canDeclareFunc = function() {
  return this.isTopLevel() ||
         this.isLexical() ||
         this.insideIf();
};

this.canYield = function() {
  return this.mode & SA_YIELD;
};

this.canAwait = function() {
  return this.mode & SA_AWAIT;
};

this.canSupCall = function() {
 if (!(this.mode & SA_CALLSUP))
   return false;

 ASSERT.call(this, this.isCtor(),
   'SA_CALLSUP set on a scope that is not a ctor');
 return this.parent.mode & SM_CLS_WITH_SUPER;
};

this.canSupMem = function() {
  return this.mode & SA_MEMSUP;
};

this.canHaveNewTarget = function() {
  return !this.isArrow() && this.isAnyFunc();
};

this.canDup = function() {
  ASSERT.call(this, this.insideFuncArgs(),
    'it has no meaning to call canDup when not ' +
    'in func-arguments');
  return !this.insideStrict() &&
         !this.insideUnique();
};

this.enterForInit = function() {
  ASSERT.call(this, this.type === ST_BARE,
    'to enter for init mode, the scope has to be a bare one');
  
  this.mode |= SM_FOR_INIT;
};

this.exitForInit = function() {
  ASSERT.call(this, this.insideForInit(),
    'can not unset the for-init mode when it is not set');

  this.mode &= ~SM_FOR_INIT;
};
