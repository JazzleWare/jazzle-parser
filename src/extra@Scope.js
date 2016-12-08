
this.spawnFunc = function(fundecl) {
  return new Scope(
    this,
    fundecl ?
      SCOPE_TYPE_FUNCTION_DECLARATION :
      SCOPE_TYPE_FUNCTION_EXPRESSION
  );
};

this.spawnLexical = function(loop) {
  return new Scope(
    this,
    !loop ?
     SCOPE_TYPE_LEXICAL_SIMPLE :
     SCOPE_TYPE_LEXICAL_LOOP );
};

this.spawnCatch = function() {
  return new Scope(
    this,
    SCOPE_TYPE_CATCH );
};

this.mustNotHaveAnyDupeParams = function() {
  return this.strict || this.isInComplexArgs;
};

this.hasParam = function(name) {
  return HAS.call(this.idNames, name+'%');
};

this.insertID = function(id) {
  this.idNames[id.name+'%'] = id;
};

