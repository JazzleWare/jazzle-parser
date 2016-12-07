this.parseFunc = function(context) {
  var prevLabels = this.labels;
      prevStrict = this.tight,
      prevScopeFlags = this.scopeFlags,
      prevYS = this.firstYS,
      prevNonSimpArg = this.firstNonSimpArg;

  var isStmt = false, startc = this.c0, startLoc = this.locBegin();
  if (this.canBeStatement) {
    isStmt = true;
    this.canBeStatement = false;
  }

  var isGen = false,
      isWhole = !(context & MEM_ANY);
   
  var argLen = !(context & MEM_ACCESSOR) ? ARGLEN_ANY :
    (context & MEM_SET) ? ARGLEN_SET : ARGLEN_GET;

  // current func name
  var cfn = null;

  if (isWhole) { 
    this.next();
    if (this.lttype === 'op' && this.ltraw === '*') {
      isGen = true;
      this.next();
    }

    if (isStmt) {
      if (!this.canDeclareFunctionsInScope())
        this.err('func.decl.not.allowed');
      if (this.unsatisfiedLabel) {
        if (!this.inFuncScope())
          this.err('func.decl.not.alowed');
        this.fixupLabels(false);
      }
      if (!(context & CONTEXT_DEFAULT)) {
        if (this.lttype === 'Identifier') {
          this.declMode = DECL_MODE_FUNCTION;
          cfn = this.parsePattern();
        }
        else
          this.err('missing.name', 'func');
      }
    }
    else {
      // FunctionExpression's BindingIdentifier can be yield regardless of context;
      // but a GeneratorExpression's BindingIdentifier can't be 'yield'
      this.scopeFlags = isGen ?
        SCOPE_FLAG_ALLOW_YIELD_EXPR :
        SCOPE_FLAG_NONE;
      if (this.lttype === 'Identifier') {
        this.enterLexicalScope(false);
        this.scope.synth = true;
        this.declMode = DECL_MODE_LET;
        cfn = this.parsePattern();
      }
    }
  }
  else if (context & MEM_GEN)
    isGen = true;

  this.enterFuncScope(isStmt); 
  this.declMode = DECL_MODE_FUNCTION_PARAMS;

  this.scopeFlags = SCOPE_FLAG_ARG_LIST;
  if (isGen)
    this.scopeFlags |= SCOPE_FLAG_ALLOW_YIELD_EXPR;
  else if (context & MEM_SUPER)
    this.scopeFlags |= (context & (MEM_SUPER|MEM_CONSTRUCTOR));
  
  // class members, along with obj-methods, have strict formal parameter lists,
  // which is a rather misleading name for a parameter list in which dupes are not allowed
  if (!this.tight && !isWhole)
    this.enterComplex();

  this.firstNonSimpArg = null;
  var argList = this.parseArgs(argLen);

  this.scopeFlags &= ~SCOPE_FLAG_ARG_LIST;
  this.scopeFlags |= SCOPE_FLAG_FN;  

  this.labels = {};
  var nbody = this.parseFuncBody(context & CONTEXT_FOR);

  var n = {
    type: isStmt ? 'FunctionDeclaration' : 'FunctionExpression', id: cfn,
    start: startc, end: nbody.end, generator: isGen,
    body: nbody, loc: { start: startLoc, end: nbody.loc.end },
    expression: nbody.type !== 'BlockStatement', params: argList 
  };

  if (isStmt)
    this.foundStatement = true;

  this.labels = prevLabels;
  this.tight = prevStrict;
  this.scopeFlags = prevScopeFlags;
  this.firstYS = prevYS;
  this.firstNonSipArg = prevNonSimpArg;
  
  this.exitScope();
  return n;
};
  
this.parseMeth = function(name, flags) {
  if (this.lttype !== '(')
    this.err('meth.paren', name, context);
  var val = null;
  if (context & MEM_CLASS) {
    if (context & MEM_CONSTRUCTOR) {
      if (context & MEM_SPECIAL)
        this.err('class.constructor.is.special.mem', name, context);
    }
    if (context & MEM_STATIC) {
      if (context & MEM_PROTOTYPE)
        this.err('class.prototype.is.static.mem', name, context);
    }

    val = this.parseFunc(CONTEXT_NONE|(context & MEM_FLAGS));

    return {
      type: 'MethodDefinition', key: core(name),
      start: name.start, end: val.end,
      kind: (flags & MEM_CONSTRUCTOR) ? 'constructor' : (flags & MEM_GET) ? 'get' :
            (flags & MEM_SET) ? 'set' : 'method',
      computed: name.type === PAREN,
      loc: { start: name.loc.start, end: val.loc.end },
      value: val, 'static': !!(flags & MEM_STATIC)/* ,y:-1*/
    }
  }
   
  var cm = (context & MEM_FLAGS) || MEM_OBJ_METH;
  val = this.parseFunc(CONTEXT_NONE|cm);

  return {
    type: 'Property', key: core(name),
    start: name.start, end: val.end,
    kind: 'init', computed: name.type === PAREN,
    loc: { start: name.loc.start, end : val.loc.end },
    method: true, shorthand: false,
    value : val/* ,y:-1*/
  }
};

