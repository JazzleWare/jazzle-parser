var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseFor = function() {
  this.ensureStmt();
  this.fixupLabels(!false) ;

  var startc = this.c0, startLoc = this.locBegin();

  this.next () ;
  this.expectType('(' ) ;

  var head = null;
  var headIsExpr = false;

  var scopeFlags = this.scopeFlags;

  if ( this.lttype === 'Identifier' ) switch ( this.ltval ) {
  case 'var':
    this.canBeStatement = !false;
    head = this.parseVariableDeclaration(CONTEXT.FOR);
    break;

  case 'let':
    if ( this.v >= 5 ) {
      this.canBeStatement = !false;
      head = this.parseLet(CONTEXT.FOR);
    }
    break;

  case 'const':
    this.assert( this.v >= 5 );
    this.canBeStatement = !false;
    head = this. parseVariableDeclaration(CONTEXT.FOR);
    break;
  }

  if ( head === null ) {
    headIsExpr = !false;
    head = this.parseExpr(CONTEXT.NULLABLE|CONTEXT.ELEM|CONTEXT.FOR) ;
  }
  else
    this.foundStatement = false;

  var kind = 'ForOfStatement';
  var nbody = null;
  var afterHead = null;

  if ( head !== null && // if we have a head
      ( headIsExpr || // that is an expression
      (head.declarations.length === 1 /* && !head.declarations[0].init */ ) ) && // or one and only one lone declarator
      this.lttype === 'Identifier' ) { // then if the token ahead is an id
    switch ( this.ltval ) {
    case 'in':
      kind = 'ForInStatement';
      // fall through

    case 'of':
      if ( this.unsatisfiedAssignment )
        this.unsatisfiedAssignment = null;

      if (headIsExpr) this.toAssig(core(head));

      this.next();
      afterHead = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE) ;
      this.expectType(')');

      this.scopeFlags |= ( SCOPE.BREAK|SCOPE.CONTINUE );
      nbody = this.parseStatement(false);
      this.scopeFlags = scopeFlags;

      this.foundStatement = !false;
      return { type: kind, loc: { start: startLoc, end: nbody.loc.end },
        start: startc, end: nbody.end, right: core(afterHead), left: core(head), body: nbody };

    default:
      this.assert(false);
    }
  }

  this.assert(!this.unsatisfiedAssignment);
/*
  if ( head && !headIsExpr ) {
    head.end = this.c;
    head.loc.end = { line: head.loc.end.line, column: this.col };
  }
*/
  this.expectType(';');
  afterHead = this.parseExpr(CONTEXT.NULLABLE );
  this.expectType(';');
  var tail = this.parseExpr(CONTEXT.NULLABLE );
  this.expectType(')');

  this.scopeFlags |= ( SCOPE.CONTINUE|SCOPE.BREAK );
  nbody = this.parseStatement(false);
  this.scopeFlags = scopeFlags;

  this.foundStatement = !false;
  return { type: 'ForStatement', init: head && core(head), start : startc, end: nbody.end,
        test: afterHead && core(afterHead),
        loc: { start: startLoc, end: nbody.loc.end },
          update: tail && core(tail),
        body: nbody };
};
