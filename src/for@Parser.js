this.parseFor = function() {
  if (!this.ensureStmt_soft())
    this.err('not.stmt', 'for');

  this.fixupLabels(true) ;

  var startc = this.c0,
      startLoc = this.locBegin();

  this.next () ;
  if (!this.expectType_soft ('('))
    this.err('for.with.no.opening.paren');

  var head = null, headIsExpr = false;

  var scopeFlags = this.scopeFlags;

  // inside a for statement's init is like a block
  this.scopeFlags = SCOPE_FLAG_IN_BLOCK;

  this.enterLexicalScope(true);

  this.missingInit = false;
  if ( this.lttype === 'Identifier' ) {
    switch ( this.ltval ) {
    case 'var':
      this.canBeStatement = true;
      head = this.parseVariableDeclaration(CTX_FOR);
      break;

    case 'let':
      if ( this.v >= 5 ) {
        this.canBeStatement = true;
        head = this.parseLet(CTX_FOR);
      }
      break;

    case 'const' :
      if (this.v < 5)
        this.err('const.not.in.v5');

      this.canBeStatement = true;
      head = this. parseVariableDeclaration(CTX_FOR);
         break ;

    }
  }

  this.scopeFlags = scopeFlags;

  if (head === null) {
    headIsExpr = true;
    head = this.parseExpr( CTX_NULLABLE|CTX_PAT|CTX_FOR ) ;
  }
  else 
    this.foundStatement = false;

  var nbody = null;
  var afterHead = null;

  if (head !== null && this.lttype === 'Identifier') {
    var kind = 'ForInStatement';
    switch ( this.ltval ) {
    case 'of':
       kind = 'ForOfStatement';
       this.ensureVarsAreNotResolvingToCatchParams();

    case 'in':
      if (headIsExpr) {
        if (head.type === 'AssignmentExpression' && this.v < 7)
          this.err('for.in.has.init.assig');

        this.adjustErrors()
        this.toAssig(head, CTX_FOR|CTX_PAT);
        this.currentExprIsAssig();
      }
      else if (head.declarations.length !== 1)
        this.err('for.decl.multi');
      else if (this.missingInit)
        this.missingInit = false;
      else if (head.init && this.v < 7)
        this.err('for.in.has.decl.init');

      this.next();
      afterHead = kind === 'ForOfStatement' ? 
        this.parseNonSeqExpr(PREC_WITH_NO_OP, CTX_NONE|CTX_PAT|CTX_NO_SIMPLE_ERR) :
        this.parseExpr(CTX_NONE|CTX_PAT|CTX_NO_SIMPLE_ERR);

      if (!this.expectType_soft(')'))
        this.err('for.iter.no.end.paren');

      this.scopeFlags &= CLEAR_IB;
      this.scopeFlags |= ( SCOPE_FLAG_BREAK|SCOPE_FLAG_CONTINUE );

      nbody = this.parseStatement(true);
      if (!nbody)
        this.err('null.stmt','for.iter');

      this.scopeFlags = scopeFlags;
      this.foundStatement = true;
      this.exitScope();

      return {
        type: kind, loc: { start: startLoc, end: nbody.loc.end },
        start: startc, end: nbody.end,
        right: core(afterHead), left: head,
        body: nbody/* ,y:-1*/
      };

    default:
      this.err('for.iter.not.of.in');

    }
  }

  if (headIsExpr)
    this.currentExprIsSimple();
  else if (head && this.missingInit)
    this.err('for.decl.no.init');

  if (!this.expectType_soft (';'))
    this.err('for.simple.no.init.comma');

  afterHead = this.parseExpr(CTX_NULLABLE|CTX_PAT|CTX_NO_SIMPLE_ERR);
  if (!this.expectType_soft (';'))
    this.err('for.simple.no.test.comma');

  var tail = this.parseExpr(CTX_NULLABLE|CTX_PAT|CTX_NO_SIMPLE_ERR);
  if (!this.expectType_soft (')'))
    this.err('for.simple.no.end.paren');

  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= ( SCOPE_FLAG_CONTINUE|SCOPE_FLAG_BREAK );

  nbody = this.parseStatement(true);
  if (!nbody)
    this.err('null.stmt','for.simple');

  this.scopeFlags = scopeFlags;
  this.foundStatement = true;
  this.exitScope();

  return {
    type: 'ForStatement', init: head && core(head), 
    start : startc, end: nbody.end,
    test: afterHead && core(afterHead),
    loc: { start: startLoc, end: nbody.loc.end },
    update: tail && core(tail), body: nbody/* ,y:-1*/
  };
};

this.ensureVarsAreNotResolvingToCatchParams = function() {
// #if V
  var list = this.scope.nameList, e = 0;
  while (e < list.length) {
    if (list[e].type & DECL_MODE_CATCH_PARAMS)
      this.err('for.of.var.overrides.catch', list[e].name);
    e++;
  }
// #else
  for (var name in this.scope.definedNames) {
    if (this.scope.definedNames[name] & DECL_MODE_CATCH_PARAMS)
      this.err('for.of.var.overrides.catch', name.substr(0, name.length-1));
  }
// #end
};
