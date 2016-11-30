this.enterFuncScope = function(decl) { this.scope = this.scope.spawnFunc(decl); };

this.enterComplex = function() {
   if (this.scope.declMode === DECL_MODE_FUNCTION_PARAMS ||
       this.scope.declMode & DECL_MODE_CATCH_PARAMS)
     this.scope.makeComplex();
};

this.enterLexicalScope = function(loop) { this.scope = this.scope.spawnLexical(loop); };

this.setDeclModeByName = function(modeName) {
  this.scope.setDeclMode(modeName === 'var' ? DECL_MODE_VAR : DECL_MODE_LET);
};

this.exitScope = function() {
  var scope = this.scope;
  this.scope.finish();
  this.scope = this.scope.parent;
  if (this.scope.synth)
    this.scope = this.scope.parent;
  return scope;
};

