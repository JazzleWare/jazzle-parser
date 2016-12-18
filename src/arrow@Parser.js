this. asArrowFuncArg = function(arg) {
  var i = 0, list = null;

  if (arg.type !== 'Identifier')
    this.firstNonSimpArg = arg;

  if (arg === this.po)
    this.err('invalid.arg');

  switch  ( arg.type ) {
  case 'Identifier':

    // TODO: this can also get checked in the scope manager rather than below
    if (this.tight && arguments_or_eval(arg.name))
      this.err('binding.to.arguments.or.eval');

    this.declare(arg);
    return;

  case 'ArrayExpression':
    list = arg.elements;
    while (i < list.length) {
      if (list[i])
        this.asArrowFuncArg(list[i]);
      i++;
    }
    arg.type = 'ArrayPattern';
    return;

  case 'AssignmentExpression':
    if (arg.operator !== '=')
      this.err('complex.assig.not.arg');

    this.asArrowFuncArg(arg.left);
    delete arg.operator ;
    arg.type = 'AssignmentPattern';

    return;

  case 'ObjectExpression':
    list = arg.properties;
    while (i < list.length)
      this.asArrowFuncArg(list[i++].value );

    arg.type = 'ObjectPattern';
    return;

  case 'AssignmentPattern':
    this.asArrowFuncArg(arg.left) ;
    return;

  case 'ArrayPattern' :
    list = arg.elements;
    while ( i < list.length ) {
      if (list[i])
        this.asArrowFuncArg(list[i]);
      i++ ;
    }
    return;

  case 'SpreadElement':
    if (arg.argument.type !== 'Identifier')
      this.err('binding.rest.arg.not.id', {tn:arg});
    this.asArrowFuncArg(arg.argument);
    arg.type = 'RestElement';
    return;

  case 'RestElement':
    if (arg.argument.type !== 'Identifier')
      this.err('binding.rest.arg.not.id',{tn:arg});
    this.asArrowFuncArg(arg.argument);
    return;

  case 'ObjectPattern':
    list = arg.properties;
    while (i < list.length)
      this.asArrowFuncArg(list[i++].value);
    return;

  case 'SequenceExpression':
    list = arg.expressions;
    while (i < list.length)
      this.asArrowFuncArg(list[i++]);
    return;

  default:
    this.err('not.bindable',{tn:head});

  }
};


this.parseArrowFunctionExpression = function(arg, context)   {

  var tight = this.tight;

  this.enterFuncScope(false);
  this.declMode = DECL_MODE_FUNCTION_PARAMS;
  this.enterComplex();

  switch ( arg.type ) {
  case 'Identifier':
    this.asArrowFuncArg(arg);
    break;

  case PAREN_NODE:
    if (arg.expr)
      this.asArrowFuncArg(core(arg));
    break;

  default:
    this.err('not.a.valid.arg.list',{tn:arg});

  }

  this.currentExprIsParams();

  if (this.newLineBeforeLookAhead)
    this.err('new.line.before.arrow');

  this.next();

  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= INHERITED_SCOPE_FLAGS;

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
  else
    params = [params];

  return {
    type: 'ArrowFunctionExpression', params: params, 
    start: arg.start, end: nbody.end,
    loc: {
      start: arg.loc.start,
      end: nbody.loc.end
    },
    generator: false, expression: isExpr,
    body: core(nbody), id : null
  }; 
};
