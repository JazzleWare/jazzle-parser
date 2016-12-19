this.enterFuncScope = function(decl) { this.scope = this.scope.spawnFunc(decl); };

// TODO: it is no longer needed
this.enterComplex = function() {
   if (this.declMode === DECL_MODE_FUNC_PARAMS ||
       this.declMode & DECL_MODE_CATCH_PARAMS)
     this.makeComplex();
};

this.enterLexicalScope = function(loop) { this.scope = this.scope.spawnLexical(loop); };

this.setDeclModeByName = function(modeName) {
  this.declMode = modeName === 'var' ? DECL_MODE_VAR : DECL_MODE_LET;
};

this.exitScope = function() {
  var scope = this.scope;
  this.scope.finish();
  this.scope = this.scope.parent;
  if (this.scope.synth)
    this.scope = this.scope.parent;
  return scope;
};

this.declare = function(id) {
   ASSERT.call(this, this.declMode !== DECL_NONE, 'Unknown declMode');
   if (this.declMode & DECL_MODE_EITHER) {
     this.declMode |= this.scope.isConcrete() ?
       DECL_MODE_VAR : DECL_MODE_LET;
   }
   else if (this.declMode & DECL_MODE_FCE)
     this.declMode = DECL_MODE_FCE;

   if (this.declMode === DECL_MODE_FUNC_PARAMS) {
     if (!this.addParam(id)) // if it was not added, i.e., it is a duplicate
       return;
   }
   else if (this.declMode === DECL_MODE_LET) {
     // TODO: eliminate it because it must've been verified in somewhere else,
     // most probably in parseVariableDeclaration
     if ( !(this.scopeFlags & SCOPE_FLAG_IN_BLOCK) )
       this.err('let.decl.not.in.block', id );

     if ( id.name === 'let' )
       this.err('lexical.name.is.let');
   }

   this.scope.declare(id, this.declMode);
};

this.makeComplex = function() {
  // complex params are treated as let by the emitter
  if (this.declMode & DECL_MODE_CATCH_PARAMS) {
    this.declMode |= DECL_MODE_LET; 
    return;
  }

  ASSERT.call(this, this.declMode === DECL_MODE_FUNC_PARAMS);
  var scope = this.scope;
  if (scope.mustNotHaveAnyDupeParams()) return;
  for (var a in scope.definedNames) {
     if (!HAS.call(scope.definedNames, a)) continue;
     if (scope.definedNames[a]/* #if V */.type/* #end */ & DECL_DUPE)
       this.err('func.args.has.dup', a);
  }
  scope.isInComplexArgs = true;
};

this.addParam = function(id) {
  ASSERT.call(this, this.declMode === DECL_MODE_FUNC_PARAMS);
  var name = id.name + '%';
  var scope = this.scope;
  if ( HAS.call(scope.definedNames, name) ) {
    if (scope.mustNotHaveAnyDupeParams())
      this.err('func.args.has.dup', id);

    // TODO: this can be avoided with a dedicated 'dupes' dictionary,
    // but then again, that might be too much.
    if (!(scope.definedNames[name]/* #if V */.type/* #end */ & DECL_DUPE)) {
      scope.insertID(id);
      scope.definedNames[name]/* #if V */.type/* #end */ |= DECL_DUPE ;
    }

    return false;
  }

  return true;
};

this.ensureParamIsNotDupe = function(id) {
   var name = id.name + '%';
   var scope = this.scope;
   if (HAS.call(scope.idNames, name) && scope.idNames[name])
     this.err('func.args.has.dup', id );
};

// TODO: must check whether we are parsing with v > 5, whether we are in an if, etc.
this.canDeclareFunctionsInScope = function(isGen) {
  if (this.scope.isConcrete())
    return true;
  if (this.scopeFlags & SCOPE_FLAG_IN_BLOCK)
    return this.v > 5;
  if (this.tight)
    return false;
  if (this.scopeFlags & SCOPE_FLAG_IN_IF)
    return !isGen;
  
  return false;
};

this.canDeclareClassInScope = function() {
  return this.scopeFlag & SCOPE_FLAG_IN_BLOCK ||
    this.scope.isConcrete();
};

this.canLabelFunctionsInScope = function(isGen) { 
  // TODO: add something like a 'compat' option so as to actually allow it for v <= 5;
  // this is what happens in reality: versions prior to ES2015 don't officially allow it, but it
  // is supported in most browsers.
  if (this.v <= 5)
    return false;
  if (this.tight)
    return false;
  if (isGen)
    return false;

  return (this.scopeFlag & SCOPE_FLAG_IN_BLOCK) ||
          this.scope.isConcrete(); 
};

