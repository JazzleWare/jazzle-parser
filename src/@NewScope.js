var SCOPE_FUNC = 1, SCOPE_LEXICAL = 0;

var NewScope = function(parent, type) {
  this.type = type;

  if (!parent) 
    ASSERT.call(this.type === SCOPE_FUNC, 'sub-scopes must have a parent');

  this.parent = parent;
  this.funcScope = 
     this.type === SCOPE_FUNC ? this : this.parent.funcScope;

  this.definedNames = {};
  this.unresolvedNames = {};
}

NewScope.createFunc = function(parent, funcParams) {
  var scope = new NewScope(parent, SCOPE_FUNC);
  if (funcParams) 
    for (var name in funcParams) {
      if (!HAS.call(funcParams, name)) continue; 
      scope.define(funcParams[name].name, VAR);
    }
  return scope;
};

NewScope.createCatch = function(parent, catchParams) {
  var scope = NewScope.createLexical(parent);
  if (catchParams)
    for (var name in catchParams) {
      if (!HAS.call(catchParams, name)) continue;
      scope.define(catchParams[name].name, LET);
    }
  return scope;
};

NewScope.createLexical = function(parent) {
   return new NewScope(parent, SCOPE_LEXICAL);
};

