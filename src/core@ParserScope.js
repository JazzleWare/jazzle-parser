
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

ParserScope.prototype.makeComplex = function() {
  ASSERT.call(this, this.declMode === DECL_MODE_FUNCTION_PARAMS);
  if (this.mustNotHaveAnyDupeParams()) return;
  for (var a in this.paramNames) {
     if (!HAS.call(this.paramNames, a)) continue;
     a = this.paramNames[a];
     if (a !== null) this.parser.err('func.args.has.dup', a);
  }
  this.isInComplexArgs = true;
};

ParserScope.prototype.parserDeclare = function(id) {
   var existing = DECL_MODE_NONE;
   switch (this.declMode) {
     case DECL_MODE_FUNCTION_PARAMS:
       this.addParam(id);
       break;

     case DECL_MODE_CATCH_PARAMS:
       if ( this.findDeclInScope(id.name) !== DECL_MODE_NONE)
         this.err('exists.in.current');
       
       this.insertDeclWithIDAndMode(id, DECL_MODE_LET); // TODO: must-fix
       break;

     case DECL_MODE_VAR:
       // #if V
       this.declare(id.name, VAR);
       // #else
       existing = this.findDeclInScope(id.name);
       if ( existing !== DECL_MODE_NONE && existing !== DECL_MODE_VAR)
         this.err('exists.in.current');

       this.insertDeclWithID(id);
       // #end
       break;

     case DECL_MODE_LET:
       if (id.name === 'let') 
         this.err('let.decl.has.let', id) ;
       
       if (!(this.parser.scopeFlags & SCOPE_BLOCK))
         this.err('let.decl.not.in.block');

       // #if V
       this.declare(id.name, LET);
       // #else
       if ( this.findDeclInScope(id.name) !== DECL_MODE_NONE)
         this.err('exists.in.current');
       this.insertDeclWithID(id);
       // #end  
       break;


     default:
       ASSERT.call(this, false, 'default mode is not defined');
   }
};

ParserScope.prototype.mustNotHaveAnyDupeParams = function() {
  return this.strict || this.isInComplexArgs;
};

// #if !V
ParserScope.prototype.insertDeclWithID = function(id) {
  return this.insertDeclWithIDAndMode(id, this.declMode);
};

ParserScope.prototype.insertDeclWithIDAndMode = function(id,mode) {
  var name = id.name + '%';
  this.definedNames[name] = this.declMode; this.paramNames[name] = id;
};
// #end

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

