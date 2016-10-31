
ParserScope.prototype = createObj(Scope.prototype);

ParserScope.prototype.spawnFunc = function(fundecl) {
  return new ParserScope(
       this.parser,
       this,
       fundecl ?
         SCOPE_TYPE_FUNCTION_DECLARATION :
         SCOPE_TYPE_FUNCTION_EXPRESSION
  );
};

ParserScope.prototype.spawnLexical = function(loop) {
  return new ParserScope(
       this.parser,
       this,
       !loop ?
        SCOPE_TYPE_LEXICAL_SIMPLE :
        SCOPE_TYPE_LEXICAL_LOOP );
};

ParserScope.prototype.setDeclMode = function(mode) {
  this.declMode = mode;
};

ParserScope.prototype.setComplexMode = function(mode) {
  ASSERT.call(this, this.declMode === DECL_MODE_FUNCTION_PARAMS);
  this.isInComplexArgs = mode;
};

ParserScope.prototype.parserDeclare = function(id) {
   switch (this.declMode) {
     case DECL_MODE_FUNCTION_PARAMS:
       this.addParam(id);
       break;

     case DECL_MODE_LET:
       this.declare(id.name, LET);
       break;

     case DECL_MODE_VAR:
       this.declare(id.name, VAR);
       break;

     default:
       ASSERT.call(this, false, 'default mode is not defined');
   }
};

ParserScope.prototype.mustNotHaveAnyDupeParams = function() {
  return this.strict || this.isInComplexArgs;
};

ParserScope.prototype.err = function(errType, errParams) {
  return this.parser.err(errType, errParams);
};
 
ParserScope.prototype.hasParam = function(name) {
  return HAS.call(this.paramNames, name+'%');
};

ParserScope.prototype.addParam = function(id) {
  ASSERT.call(this, this.declMode === DECL_MODE_FUNCTION_PARAMS);
  var name = id.name + '%';
  if ( HAS.call(this.paramNames, name) ) {
    if (this.mustNotHaveAnyDupeParams())
      this.err('func.args.has.dup', id);

    if (this.paramNames[name] === null)
      this.paramNames[name] = id ;
  }
  else
    this.paramNames[name] = null;
};

ParserScope.prototype.ensureParamIsNotDupe = function(id) {
   var name = id.name + '%';

   if (HAS.call(this.paramNames, name) && this.paramNames[name])
     this.parser.err('func.args.has.dup', id );
};

