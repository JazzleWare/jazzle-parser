var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.asArrowFuncArgList = function(head) {
  if (head === null) return;

  if ( head.type === 'SequenceExpression' ) {
    this.assert(head !== this.firstParen );
    var i = 0, list = head.expressions;
    while ( i < list.length ) {
      this.asArrowFuncArg(list[i]);
      i++;
    }
  } else {
    this.asArrowFuncArg(head);
  }
};

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
        this.asArrowFuncArg(list[i]);
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
    this.asArrowFuncArg(arg.left);
    arg.type = 'AssignmentPattern';
    delete arg.operator ;
    return;

  case 'ObjectExpression':
    this.assert(arg !== this.firstParen    );
    list = arg.properties;
    while ( i < list.length ) this.asArrowFuncArg(list[i++].value );
    arg.type = 'ObjectPattern';
    return;

  case 'AssignmentPattern':
    this.assert(arg !== this.firstParen );
    this.asArrowFuncArg(arg.left) ;
    return;

  case 'ArrayPattern' :
    list = arg.elements;
    while ( i < list.length )
      this.asArrowFuncArg(list[i++] ) ;
    return;

  case 'SpreadElement':
    this.asArrowFuncArg(arg.argument);
    arg.type = 'RestElement';
    return;

  case 'RestElement':
    this.asArrowFuncArg(arg.argument);
    return;

  case 'ObjectPattern':
    list = arg.properties;
    while (i < list.length) this.asArrowFuncArgList ( list[i++].value  );
    return;

  default:
    this.assert(false ) ;
  }
};

module.exports.parseArrowFunctionExpression = function(arg, context) {
  if (this.unsatisfiedArg) this.unsatisfiedArg = null;

  var prevArgNames = this.argNames;
  this.argNames = {};

  var tight = this.tight;

  switch ( arg.type ) {
  case 'Identifier':
    this.asArrowFuncArg(arg, 0)  ;
    break ;
  case CONST.PAREN:
    this.asArrowFuncArgList(core(arg));
    break ;
  default:
    this.assert(false);
  }

  this.next();

  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= ( SCOPE.FUNCTION|SCOPE.METH|SCOPE.CONSTRUCTOR);

  var isExpr = !false, nbody = null;

  if (this.lttype === '{') {
    var prevLabels = this.labels;
    this.labels = {};
    isExpr = false;
    nbody = this.parseFuncBody(CONTEXT.NONE);
    this.labels = prevLabels;
  }
  else
    nbody = this. parseNonSeqExpr(PREC.WITH_NO_OP, context) ;

  this.argNames = prevArgNames;
  this.scopeFlags = scopeFlags;

  var params = core(arg);

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
    body: core(nbody),
    id : null
  };
};
