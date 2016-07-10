module.exports.asArrowFuncArgList = function(head) {
  if (head === null) return;

  if ( head.type === 'SequenceExpression' ) {
    this.assert(head !== this.firstParen );
    var i = 0, list = head.expressions;
    while ( i < list.length ) {
      asArrowFuncArg(list[i]);
      i++;
    }
  } else {
    asArrowFuncArg(head);
  }
}

module.exports.asArrowFuncArg = function(arg) {
  var i = 0, list = null;

  switch  ( arg.type ) {
  case 'Identifier':
    this.assert(arg !== this.firstParen )  ;
    return this.addArg(arg);
  case 'ArrayExpression':
    this.assert(arg !== this.firstParen )  ;
    list = arg.elements;
    while ( i < list.length ) {
      if ( list[i] ) {
        asArrowFuncArg(list[i]);
        if ( list[i].type === 'SpreadElement' ) {
          i++;
          break;
        }
      }
      i++;
    }
    this.assert( i === list.length );
    arg.type = 'ArrayPattern';
    return;

  case 'AssignmentExpression':
    this.assert(arg !== this.firstParen );
    this.assert(arg.operator === '=' ) ;
    asArrowFuncArg(arg.left);
    arg.type = 'AssignmentPattern';
    delete arg.operator ;
    return;

  case 'ObjectExpression':
    this.assert(arg !== this.firstParen    );
    list = arg.properties;
    while ( i < list.length ) asArrowFuncArg(list[i++].value );
    arg.type = 'ObjectPattern';
    return;

  case 'AssignmentPattern':
    this.assert(arg !== this.firstParen );
    asArrowFuncArg(arg.left) ;
    return;

  case 'ArrayPattern' :
    list = arg.elements;
    while ( i < list.length )
      asArrowFuncArg(list[i++] ) ;
    return;

  case 'SpreadElement':
    asArrowFuncArg(arg.argument);
    arg.type = 'RestElement';
    return;

  case 'RestElement':
    asArrowFuncArg(arg.argument);
    return;

  case 'ObjectPattern':
    list = arg.properties;
    while (i < list.length) asArrowFuncArgList ( list[i++].value  );
    return;

  default:
    this.assert(false ) ;
  }
}

/* global PAREN, SCOPE_FUNCTION, SCOPE_METH, SCOPE_CONSTRUCTOR, CONTEXT_NONE */
/* global PREC_WITH_NO_OP */

module.exports.parseArrow = function(arg, context) {
  if (this.unsatisfiedArg) this.unsatisfiedArg = null;

  var prevArgNames = this.argNames;
  this.argNames = {};

  var tight = this.tight;

  switch ( arg.type ) {
  case 'Identifier':
    asArrowFuncArg(arg, 0)  ;
    break ;
  case PAREN:
    asArrowFuncArgList(core(arg)); // FIXME: this.core?
    break ;
  default:
    this.assert(false);
  }

  this.next();

  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= ( SCOPE_FUNCTION|SCOPE_METH|SCOPE_CONSTRUCTOR);

  var isExpr = !false, nbody = null;

  if (this.lttype === '{') {
    var prevLabels = this.labels;
    this.labels = {};
    isExpr = false;
    nbody = this.parseFuncBody(CONTEXT_NONE);
    this.labels = prevLabels;
  }
  else
    nbody = this. parseNonSeqExpr(PREC_WITH_NO_OP, context) ;

  this.argNames = prevArgNames;
  this.scopeFlags = scopeFlags;

  var params = core(arg); // FIXME: this.core?

  this.tight = tight;

  return {
    type: 'ArrowFunctionExpression',
    params: params ? (
      params.type === 'SequenceExpression' ?params.expressions : [params]
    ) : [],
    start: arg.start,
    end: nbody.end,
    loc: { start: arg.loc.start, end: nbody.loc.end },
    generator: false,
    expression: isExpr,
    body: core(nbody), // FIXME: this.core?
    id : null
  };
}

