
this.spawnFunc = function(fundecl) {
  return new Scope(
    this,
    fundecl ?
      ST_FN_STMT :
      ST_FN_EXPR
  );
};

this.spawnLexical = function(loop) {
  return new Scope(
    this,
    !loop ?
     ST_LEXICAL :
     ST_LEXICAL|ST_LOOP);
};

this.spawnCatch = function() {
  return new Scope(
    this,
    ST_LEXICAL|ST_CATCH);
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

