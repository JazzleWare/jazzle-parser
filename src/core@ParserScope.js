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

ParserScope.prototype.spawnCatch = function() {
  return new ParserScope(
    this.parser,
    this,
    SCOPE_TYPE_CATCH );
};

ParserScope.prototype.setDeclMode = function(mode) {
  this.declMode = mode;
};

ParserScope.prototype.makeComplex = function() {
  // complex params are treated as let by the emitter
  if (this.declMode & DECL_MODE_CATCH_PARAMS) {
    this.declMode |= DECL_MODE_LET; 
    return;
  }

  ASSERT.call(this, this.declMode === DECL_MODE_FUNCTION_PARAMS);
  if (this.mustNotHaveAnyDupeParams()) return;
  for (var a in this.definedNames) {
     if (!HAS.call(this.definedNames, a)) continue;
     if (this.definedNames[a]/* #if V */.type/* #end */ & DECL_DUPE) this.parser.err('func.args.has.dup', a);
  }
  this.isInComplexArgs = true;
};

ParserScope.prototype.parserDeclare = function(id) {
   ASSERT.call(this, this.declMode !== DECL_MODE_NONE, 'Unknown declMode');
   if (this.declMode === DECL_MODE_FUNCTION_PARAMS) {
     if (!this.addParam(id)) // if it was not added, i.e., it is a duplicate
       return;
   }
   else if (this.declMode === DECL_MODE_LET) {
     if ( !(this.parser.scopeFlags & SCOPE_BLOCK) )
       this.err('let.decl.not.in.block', id );

     if ( id.name === 'let' )
       this.err('lexical.name.is.let');
   }

   this.declare(id, this.declMode);
};

ParserScope.prototype.mustNotHaveAnyDupeParams = function() {
  return this.strict || this.isInComplexArgs;
};

// #if !V
ParserScope.prototype.insertDecl0 = function(id) {
  var name = id.name + '%';
  this.insertID(id);
  this.definedNames[name] = this.declMode;
};
// #end

ParserScope.prototype.err = function(errType, errParams) {
  return this.parser.err(errType, errParams);
};
 
ParserScope.prototype.hasParam = function(name) {
  return HAS.call(this.idNames, name+'%');
};

ParserScope.prototype.addParam = function(id) {
  ASSERT.call(this, this.declMode === DECL_MODE_FUNCTION_PARAMS);
  var name = id.name + '%';
  if ( HAS.call(this.definedNames, name) ) {
    if (this.mustNotHaveAnyDupeParams())
      this.err('func.args.has.dup', id);

    // TODO: all these check will be avoided with a dedicated 'dupes' dictionary,
    // but then again, that might be too much.
    if (!(this.definedNames[name]/* #if V */.type/* #end */ & DECL_DUPE)) {
      this.insertID(id);
      this.definedNames[name]/* #if V */.type/* #end */ |= DECL_DUPE ;
    }

    return false;
  }

  return true;
};

ParserScope.prototype.ensureParamIsNotDupe = function(id) {
   var name = id.name + '%';

   if (HAS.call(this.idNames, name) && this.idNames[name])
     this.parser.err('func.args.has.dup', id );
};

