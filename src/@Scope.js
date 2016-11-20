function Scope(parent, type) {
  this.type = type;

  if (!parent) 
    ASSERT.call(this.isFunc(), 'sub-scopes must have a parent');

  this.parent = parent;
  this.funcScope = 
     this.isFunc() ? this : this.parent.funcScope;

  this.definedNames = {};
  // #if V
  this.unresolvedNames = {};

  this.wrappedDeclList = null;
  this.wrappedDeclNames = null;
  this.scopeObjVar = null;

  this.tempStack = this.isFunc() ? [] : null;

  if (this.isLexical() && !this.isLoop() && this.parent.isLoop())
    this.type |= SCOPE_TYPE_LEXICAL_LOOP;    

  this.catchVarIsSynth = false;
  this.catchVarName = ""; 

  this.globalLiquidNames = this.parent ? this.parent.globalLiquidNames : new LiquidNames();
  this.localLiquidNames = null;
  // #end
}

Scope.createFunc = function(parent, decl) {
  var scope = new Scope(parent, decl ?
       SCOPE_TYPE_FUNCTION_DECLARATION :
       SCOPE_TYPE_FUNCTION_EXPRESSION );
  return scope;
};

Scope.createLexical = function(parent, loop) {
   return new Scope(parent, !loop ?
        SCOPE_TYPE_LEXICAL_SIMPLE :
        SCOPE_TYPE_LEXICAL_LOOP);
};
