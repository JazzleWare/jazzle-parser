var CHAR = require('../../util/char.js');
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseExpr =  function(context) {
  var head = this.parseNonSeqExpr(PREC.WITH_NO_OP,context );
  if ( this.unsatisfiedAssignment ) {
    this.assert( context & CONTEXT.ELEM ) ;
    return head;
  }

  var lastExpr;
  if ( this.lttype === ',' ) {
    context &= CONTEXT.FOR;

    var e = [core(head)] ;
    do {
      this.next() ;
      lastExpr = this.parseNonSeqExpr(PREC.WITH_NO_OP,context);
      e.push(core(lastExpr));
    } while (this.lttype === ',' ) ;

    return  { type: 'SequenceExpression', expressions: e, start: head.start, end: lastExpr.end,
              loc: { start : head.loc.start, end : lastExpr.loc.end} };
  }

  return head ;
};

module.exports .parseCond = function(cond,context ) {
  this.next();
  var con = this. parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE ) ;
  this.expectType(':');
  var alt = this. parseNonSeqExpr(PREC.WITH_NO_OP, context ) ;
  return { type: 'ConditionalExpression', test: core(cond), start: cond.start , end: alt.end ,
          loc: { start: cond.loc.start, end: alt.loc.end }, consequent: core(con), alternate: core(alt) };
};

module.exports .parseUnaryExpression = function(context ) {
  var u = null, startLoc = null, startc = 0;
  if ( this.isVDT ) {
    this.isVDT = false;
    u = this.ltval;
    startLoc = this.locBegin();
    startc = this.c0;
  }
  else {
    u = this.ltraw;
    startLoc = this.locOn(1);
    startc = this.c - 1;
  }

  this.next();
  var arg = this. parseNonSeqExpr(PREC.U,context );

  return { type: 'UnaryExpression', operator: u, start: startc, end: arg.end,
          loc: { start: startLoc, end: arg.loc.end }, prefix: !false, argument: core(arg) };
};

module.exports .parseUpdateExpression = function(arg, context) {
  var c = 0,
    loc = null,
    u = this.ltraw;

  if ( arg === null ) {
    c = this.c-2;
    loc = this.locOn(2);
    this.next() ;
    arg = this. parseExprHead(context&CONTEXT.FOR);
    this.assert(arg);

    this.ensureSimpAssig(core(arg));
    return { type: 'UpdateExpression', argument: core(arg), start: c, operator: u,
            prefix: !false, end: arg.end, loc: { start: loc, end: arg.loc.end } };
  }

  this.ensureSimpAssig(core(arg));
  c  = this.c;
  loc = { start: arg.loc.start, end: { line: this.li, column: this.col } };
  this.next() ;
  return { type: 'UpdateExpression', argument: core(arg), start: arg.start, operator: u,
          prefix: false, end: c, loc: loc };

};

module.exports .parseO = function(context ) {

  switch ( this. lttype ) {

  case 'op': return !false;
  case '--': return !false;
  case '-': this.prec = PREC.ADD_MIN; return !false;
  case '/':
    if ( this.src.charCodeAt(this.c) === CHAR.EQUALITY_SIGN ) {
      this.c++ ;
      this.prec = PREC.OP_ASSIG;
      this.ltraw = '/=';
      this.col++;
    }
    else
        this.prec = PREC.MUL ;

    return !false;

  case 'Identifier':
    switch ( this. ltval ) {
    case 'instanceof':
      this.prec = PREC.COMP  ;
      this.ltraw = this.ltval ;
      return !false;

    case 'of':
    case 'in':
      if ( context & CONTEXT.FOR ) break ;
      this.prec = PREC.COMP ;
      this.ltraw = this.ltval;
      return !false;
    }
    break;

    case '?': this .prec = PREC.COND  ; return !false;
  }

  return false ;
};

module.exports.parseNonSeqExpr =  function(prec, context  ) {
  var firstUnassignable = null, firstParen = null;

  var head = this. parseExprHead(context);

  if ( head === null ) {
    switch ( this.lttype ) {
    case 'u':
    case '-':
      head = this. parseUnaryExpression(context & CONTEXT.FOR );
      break ;

    case '--':
      head = this. parseUpdateExpression(null, context&CONTEXT.FOR );
      break ;

    case 'yield':
      this.assert(prec === PREC.WITH_NO_OP ) ; // make sure there is no other expression before it
      return this.parseYield(); // everything that comes belongs to it

    default:
      this.assert(context & CONTEXT.NULLABLE )  ;
      return null;
    }
  }
  else if ( prec === PREC.WITH_NO_OP ) {
    firstParen = head. type === CONST.PAREN ? head.expr : this.firstParen ;
    firstUnassignable = this.firstUnassignable;
  }

  while ( !false ) { // FIXME: const
    if ( !this. parseO( context ) ) break ;
    if ( PREC.isAssignment(this.prec) ) {
      this.assert( prec === PREC.WITH_NO_OP );
      this.firstUnassignable = firstUnassignable;
      head = this. parseAssignment(head, context & CONTEXT.FOR );
      break ;
    }

    if ( this.unsatisfiedAssignment ) {
      this.assert(prec===PREC.WITH_NO_OP && context === CONTEXT.ELEM );
      break ;
    }

    this.assert( !this.unsatisfiedArg );
    if ( PREC.isMMorAA(this.prec) ) {
      if ( this. newLineBeforeLookAhead )
        break ;
      head = this. parseUpdateExpression(head, context & CONTEXT.FOR ) ;
      continue;
    }
    if ( PREC.isQuestion(this.prec) ) {
      if ( prec === PREC.WITH_NO_OP ) {
        head = this. parseCond(head, context&CONTEXT.FOR );
      }
      break;
    }

    if ( this. prec < prec ) break ;
    if ( this. prec  === prec && !PREC.isRassoc(prec) ) break ;

    var o = this.ltraw;
    var currentPrec = this. prec;
    this.next();
    var right = this.parseNonSeqExpr(currentPrec, context & CONTEXT.FOR );
    head = { type: !PREC.isBin(currentPrec )  ? 'LogicalExpression' :   'BinaryExpression',
              operator: o,
              start: head.start,
              end: right.end,
              loc: {
                start: head.loc.start,
                end: right.loc.end
              },
              left: core(head),
              right: core(right)
            };
  }

  if ( prec === PREC.WITH_NO_OP ) {
    this.firstParen = firstParen ;
    this.firstUnassignable = firstUnassignable;
  }

  return head;
};
