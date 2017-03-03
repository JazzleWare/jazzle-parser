this.parseArrowFunctionExpression = function(arg, context)   {
  if (this.v <= 5)
    this.err('ver.arrow');
  var tight = this.tight, async = false;

  this.enterFuncScope(false);
  this.declMode = DECL_MODE_FUNC_PARAMS;
  this.enterComplex();

  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= INHERITED_SCOPE_FLAGS;

  if (this.pt === ERR_ASYNC_NEWLINE_BEFORE_PAREN) {
    ASSERT.call(this, arg === this.pe, 'how can an error core not be equal to the erroneous argument?!');
    this.err('arrow.newline.before.paren.async');
  }

  switch ( arg.type ) {
  case 'Identifier':
    this.firstNonSimpArg = null;
    this.asArrowFuncArg(arg);
    break;

  case PAREN_NODE:
    this.firstNonSimpArg = null;
    if (arg.expr) {
      if (arg.expr.type === 'SequenceExpression')
        this.asArrowFuncArgList(arg.expr.expressions);
      else
        this.asArrowFuncArg(arg.expr);
    }
    break;

  case 'CallExpression':
    if (this.v >= 7 && arg.callee.type !== 'Identifier' || arg.callee.name !== 'async')
      this.err('not.a.valid.arg.list',{tn:arg});
    if (this.parenAsync !== null && arg.callee === this.parenAsync.expr)
      this.err('arrow.has.a.paren.async');

//  if (this.v < 7)
//    this.err('ver.async');

    async = true;
    this.scopeFlags |= SCOPE_FLAG_ALLOW_AWAIT_EXPR;
    this.asArrowFuncArgList(arg.arguments);
    break;

  case INTERMEDIATE_ASYNC:
    async = true;
    this.scopeFlags |= SCOPE_FLAG_ALLOW_AWAIT_EXPR;
    this.asArrowFuncArg(arg.id);
    break;

  default:
    this.err('not.a.valid.arg.list');

  }

  this.currentExprIsParams();

  if (this.nl)
    this.err('arrow.newline');

  this.next();

  var isExpr = true, nbody = null;

  if ( this.lttype === '{' ) {
    var prevLabels = this.labels;
    this.labels = {};
    isExpr = false;
    this.scopeFlags |= SCOPE_FLAG_FN;
    nbody = this.parseFuncBody(CTX_NONE|CTX_PAT|CTX_NO_SIMPLE_ERR);
    this.labels = prevLabels;
  }
  else
    nbody = this. parseNonSeqExpr(PREC_WITH_NO_OP, context|CTX_PAT) ;

  this.exitScope();
  this.tight = tight;

  this.scopeFlags = scopeFlags;

  var params = core(arg);
  if (params === null)
    params = [];
  else if (params.type === 'SequenceExpression')
    params = params.expressions;
  else if (params.type === 'CallExpression')
    params = params.arguments;
  else {
    if (params.type === INTERMEDIATE_ASYNC)
      params = params.id;
    params = [params];
  }

  return {
    type: 'ArrowFunctionExpression', params: params, 
    start: arg.start, end: nbody.end,
    loc: {
      start: arg.loc.start,
      end: nbody.loc.end
    },
    generator: false, expression: isExpr,
    body: core(nbody), id : null,
    async: async
  }; 
};

