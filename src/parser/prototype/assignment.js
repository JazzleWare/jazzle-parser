var arguments_or_eval = require('../../util/arguments_or_eval.js');
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.ensureSimpAssig = function(head) {
  switch(head.type) {
  case 'Identifier':
    this.assert( !( this.tight && arguments_or_eval(head.name) )  );
  //  break;
  // eslint-disable-next-line no-fallthrough
  case 'MemberExpression':
    return;

  default:
    this.assert(false);
  }
};

// an arr-pat is always to the left of an assig;
module.exports.toAssig = function(head) {

  var i = 0;
  var list = null;

  switch(head.type) {
  case 'Identifier':
    this.assert( !(this.tight && arguments_or_eval(head.name)) );
  //  break;
  // eslint-disable-next-line no-fallthrough
  case 'MemberExpression':
    return;

  case 'ObjectExpression':
    this.assert(head !== this.firstUnassignable )  ;
    list = head.properties;
    while ( i < list.length ) {
      this.toAssig(list[i].value);
      list[i].type = 'AssignmentProperty';
      i++;
    }
    head.type = 'ObjectPattern';
    return;

  case 'ArrayExpression':
    this.assert(head !== this.firstUnassignable )  ;
    list = head.elements;
    while ( i < list.length ) {
      if ( list[i] ) {
        this.toAssig(list[i]);
        if ( list[i].type === 'SpreadElement' ) {
          i++;
          break ;
        }
      }
      i++;
    }
    this.assert( i === list.length );
    head.type = 'ArrayPattern';
    return;

  case 'AssignmentExpression':
    this.assert(head !== this.firstUnassignable ) ;
    this.assert(head.operator === '='  ) ;
    head.type = 'AssignmentPattern';
    delete head.operator;
    return;

  case 'SpreadElement':
    this.toAssig(head.argument);
    head.type = 'RestElement';
    return;

  case 'AssignmentPattern': // this would be the case in the event of converting an obj prop in the form of "name = val" rather than "name: val"
    return;

  default:
    this.assert(false ) ;
  }
};

module.exports.parseAssignment = function(head, context ) {
  var o = this.ltraw;
  if ( o === '=' ) this.toAssig(core(head));
  else if ( o === '=>' )
    return this.parseArrowFunctionExpression (head, context);
  else this.ensureSimpAssig(core(head));

  if ( this.unsatisfiedAssignment ) {
    this.assert( this.prec === PREC.SIMP_ASSIG ) ;
    this.unsatisfiedAssignment = false ;
  }

  // var prec = this.prec;
  this.next();

  var right = this. parseNonSeqExpr(PREC.WITH_NO_OP, context ) ;
  return { type: 'AssignmentExpression', operator: o, start: head.start, end: right.end,
           left: core(head), right: core(right), loc: { start: head.loc.start, end: right.loc.end }};
};
