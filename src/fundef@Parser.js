this.parseFunc = function(context, flags) {
  var prevLabels = this.labels,
      prevStrict = this.tight,
      prevScopeFlags = this.scopeFlags,
      prevDeclMode = this.declMode,
      prevNonSimpArg = this.firstNonSimpArg;

  var isStmt = false, startc = this.c0, startLoc = this.locBegin();
  if (this.canBeStatement) {
    isStmt = true;
    this.canBeStatement = false;
  }

  var isGen = false,
      isWhole = !(flags & MEM_CLASS_OR_OBJ);
   
  var argLen = !(flags & MEM_ACCESSOR) ? ARGLEN_ANY :
    (flags & MEM_SET) ? ARGLEN_SET : ARGLEN_GET;

  // current func name
  var cfn = null;

  if (isWhole) { 
    this.next();
    if (this.lttype === 'op' && this.ltraw === '*') {
      isGen = true;
      this.next();
    }

    if (isStmt) {
      if (!this.canDeclareFunctionsInScope(isGen))
        this.err('func.decl.not.allowed');
      if (this.unsatisfiedLabel) {
        if (!this.canLabelFunctionsInScope(isGen))
          this.err('func.decl.not.alowed');
        this.fixupLabels(false);
      }
      if (this.lttype === 'Identifier') {
        this.declMode = DECL_MODE_FUNC_STMT;
        cfn = this.parsePattern();
      }
      else if (!(context & CTX_DEFAULT))
        this.err('missing.name', 'func');
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
        this.declMode = DECL_MODE_FUNC_EXPR;
        cfn = this.parsePattern();
      }
    }
  }
  else if (flags & MEM_GEN)
    isGen = true;

  this.enterFuncScope(isStmt); 
  this.declMode = DECL_MODE_FUNC_PARAMS;

  this.scopeFlags = SCOPE_FLAG_NONE;

  if (isGen)
    this.scopeFlags |= SCOPE_FLAG_ALLOW_YIELD_EXPR;

  if (flags & MEM_SUPER)
    this.scopeFlags |= (flags & (MEM_SUPER|MEM_CONSTRUCTOR));

  // TODO: super is allowed in methods of a class regardless of whether the class
  // has an actual heritage clause; but this could probably be implemented better
  else if (!isWhole && !(flags & MEM_CONSTRUCTOR))
    this.scopeFlags |= SCOPE_FLAG_ALLOW_SUPER;
 
  if (flags & MEM_ASYNC) {
    if (isGen)
      this.err('async.gen.not.yet.supported');
    this.scopeFlags |= SCOPE_FLAG_ALLOW_AWAIT_EXPR;
  }

  // class members, along with obj-methods, have strict formal parameter lists,
  // which is a rather misleading name for a parameter list in which dupes are not allowed
  if (!this.tight && !isWhole)
    this.enterComplex();

  this.firstNonSimpArg = null;

  this.scopeFlags |= SCOPE_FLAG_ARG_LIST;
  var argList = this.parseArgs(argLen);
  this.scopeFlags &= ~SCOPE_FLAG_ARG_LIST;

  this.scopeFlags |= SCOPE_FLAG_FN;  

  this.labels = {};

  var nbody = this.parseFuncBody(context & CTX_FOR);

  var n = {
    type: isStmt ? 'FunctionDeclaration' : 'FunctionExpression', id: cfn,
    start: startc, end: nbody.end, generator: isGen,
    body: nbody, loc: { start: startLoc, end: nbody.loc.end },
    expression: nbody.type !== 'BlockStatement', params: argList,

    // TODO: this should go in parseAsync
    async: (flags & MEM_ASYNC) !== 0
  };

  if (isStmt)
    this.foundStatement = true;

  this.labels = prevLabels;
  this.tight = prevStrict;
  this.scopeFlags = prevScopeFlags;
  this.declMode = prevDeclMode;
  this.firstNonSimpArg = prevNonSimpArg;
  
  this.exitScope();
  return n;
};
  
this.parseMeth = function(name, flags) {
  if (this.lttype !== '(')
    this.err('meth.paren', name, flags);
  var val = null;
  if (flags & MEM_CLASS) {
    // all modifiers come at the beginning
    if (flags & MEM_STATIC) {
      if (flags & MEM_PROTOTYPE)
        this.err('class.prototype.is.static.mem', name, flags);

      flags &= ~(MEM_CONSTRUCTOR|MEM_SUPER);
    }

    if (flags & MEM_CONSTRUCTOR) {
      if (flags & MEM_SPECIAL)
        this.err('class.constructor.is.special.mem', name, flags);
      if (flags & MEM_HAS_CONSTRUCTOR)
        this.err('class.constructor.is.a.dup', name, flags);
    }

    val = this.parseFunc(CTX_NONE, flags);

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
   
  val = this.parseFunc(CTX_NONE, flags);

  return {
    type: 'Property', key: core(name),
    start: name.start, end: val.end,
    kind:
     !(flags & MEM_ACCESSOR) ? 'init' :
      (flags & MEM_SET) ? 'set' : 'get',
    computed: name.type === PAREN,
    loc: { start: name.loc.start, end : val.loc.end },
    method: (flags & MEM_ACCESSOR) === 0, shorthand: false,
    value : val/* ,y:-1*/
  }
};

