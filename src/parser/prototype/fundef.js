var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;
var PREC = require('../../util/precedence.js');
var arguments_or_eval = require('../../util/arguments_or_eval');
var has = require('../../util/has.js');

module.exports.parseArgs = function(argLen) {
  var list = [], elem = null;

  this.expectType('(') ;
  while ( list.length !== argLen ) {
    elem = this.parsePattern();
    if ( elem ) {
      if ( this.lttype === 'op' && this.ltraw === '=' )
        elem = this.parseAssig(elem);

      list.push(elem);
    }
    else
      break ;

    if ( this.lttype === ',' )
      this.next();
    else
        break ;

  }
  if ( argLen === CONST.ANY_ARG_LEN ) {
    if ( this.lttype === '...' )
      list.push( this.parseRestElement() );
  }
  else
    this.assert( list.length === argLen );

  this.expectType(')');

  return list;
};

module.exports.addArg = function(id) {
  var name = id.name + '%';
  if (has.call(this.argNames, name)) {
    this.assert( !this.tight );
    if ( this.argNames[name] === null )
      this.argNames[name] = id ;
  }
  else
    this.argNames[name] = null ;
};

module.exports.parseFunc = function(context, argListMode, argLen ) {
  var canBeStatement = false, startc = this.c0, startLoc = this.locBegin();
  var prevLabels = this.labels;
  var prevStrict = this.tight;
  var prevFuncName = this.currentFuncName;
  var prevInArgList = this.isInArgList;
  var prevArgNames = this.argNames;
  var prevScopeFlags = this.scopeFlags;

  this.scopeFlags = 0;

  var isGen = false;
  if (argListMode & CONST.WHOLE_FUNCTION) {
    if ((canBeStatement = this.canBeStatement))
      this.canBeStatement = false;

    this.next();

    if ( this.lttype === 'op' && this.ltraw === '*' ) {
      isGen = !false;
      this.next();
    }
    if ( canBeStatement && context !== CONTEXT.DEFAULT  )  {
      this.assert( this.lttype === 'Identifier' ) ;
      this.currentFuncName = this.validateID(null);
    }
    else if ( this. lttype == 'Identifier' )
      this.currentFuncName = this.validateID(null);
    else
      this.currentFuncName = null;
  }
  else if ( argListMode & CONST.ARGLIST_AND_BODY_GEN )
    isGen = !false;

  this.isInArgList = !false;
  this.argNames = {};
  var argList = this.parseArgs(argLen) ;
  this.isInArgList = false;
  this.tight = this.tight || argListMode !== CONST.WHOLE_FUNCTION;
  this.scopeFlags = SCOPE.FUNCTION;
  if ( argListMode & CONST.METH_FUNCTION )
    this.scopeFlags |= SCOPE.METH;

  else if ( argListMode & CONST.CONSTRUCTOR_FUNCTION )
    this.scopeFlags |= SCOPE.CONSTRUCTOR;

  if ( isGen ) this.scopeFlags |= SCOPE.YIELD;

  var nbody = this.parseFuncBody(context);
  var n = { type: canBeStatement ? 'FunctionDeclaration' : 'FunctionExpression',
            id: this.currentFuncName,
          start: startc,
          end: nbody.end,
          generator: isGen,
          body: nbody,
            loc: { start: startLoc, end: nbody.loc.end },
          expression: nbody.type !== 'BlockStatement' ,
            params: argList };

  if ( canBeStatement )
    this.foundStatement = !false;

  this.labels = prevLabels;
  this.isInArgList = prevInArgList;
  this.currentFuncName = prevFuncName;
  this.argNames = prevArgNames;
  this.tight = prevStrict;
  this.scopeFlags = prevScopeFlags;

  return  n  ;
};

module.exports.parseFuncBody = function(context) {
  if ( this.lttype !== '{' )
    return this.parseNonSeqExpr(PREC.WITH_NO_OP, context);

  var startc= this.c - 1, startLoc = this.locOn(1);
  var list = [], stmt = null;
  this.next() ;
  stmt = this.parseStatement(!false);

  if ( !this.tight && this.v > 5 && stmt &&
    stmt.type === 'ExpressionStatement' && stmt.expression.type === 'Literal' )
    switch (this.src.slice(stmt.expression.start,stmt.expression.end) )  {
    case '\'use strict\'':
    case '\"use strict\"':
      this.makeStrict();
    }

  while ( stmt ) { list.push(stmt); stmt = this.parseStatement(!false); }
  var n = { type : 'BlockStatement', body: list, start: startc, end: this.c,
          loc: { start: startLoc, end: this.loc() } };
  this.expectType ( '}' );

  return  n;
};

module.exports.makeStrict  = function() {
  if ( this.tight ) return;

  this.tight = !false;
  if ( this.currentFuncName ) {
    this.assert(!arguments_or_eval(this.currentFuncName));
    this.validateID(this.currentFuncName.name) ;
  }

  var argName = null;
  for ( argName in this.argNames ) {
    this.assert( this.argNames[argName] === null );
    argName = argName.substring(0,argName.length-1) ;
    this.assert(!arguments_or_eval(argName));
    this.validateID(argName);
  }
};
