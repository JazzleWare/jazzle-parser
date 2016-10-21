var NewScope = function(parent, type) {
  this.type = type;

  if (!parent) 
    ASSERT.call(this.isFunc(), 'sub-scopes must have a parent');

  this.parent = parent;
  this.funcScope = 
     this.isFunc() ? this : this.parent.funcScope;

  this.definedNames = {};
  this.unresolvedNames = {};

  this.wrappedDeclList = null;
  this.wrappedDeclNames = null;
  this.scopeObjVar = null;
}

NewScope.createFunc = function(parent, decl, funcParams) {
  var scope = new NewScope(parent, decl ?
       SCOPE_TYPE_FUNCTION_DECLARATION :
       SCOPE_TYPE_FUNCTION_EXPRESSION );
  if (funcParams) 
    for (var name in funcParams) {
      if (!HAS.call(funcParams, name)) continue; 
      scope.define(funcParams[name].name, VAR);
    }
  return scope;
};

NewScope.createLexical = function(parent, loop) {
   return new NewScope(parent, !loop ?
        SCOPE_TYPE_LEXICAL_SIMPLE :
        SCOPE_TYPE_LEXICAL_LOOP);
};


