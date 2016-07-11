var PREC = require('../../util/precedence.js');
var CONTEXT = require('../../util/constants.js').CONTEXT;

module.exports.parseArrayExpression = function() {
  var startc = this.c - 1;
  var startLoc = this.locOn(1);
  var elem = null, list = [];

  this.next () ;

  var firstUnassignable = null, firstParen = null;
  var unsatisfiedAssignment = this.unsatisfiedAssignment;

  do {
    this.firstUnassignable = this.firstParen = null;
    this.unsatisfiedAssignment = null ;

    elem = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NULLABLE|CONTEXT.ELEM);

    if (elem) {
      if (!unsatisfiedAssignment && this.unsatisfiedAssignment) {
        unsatisfiedAssignment =  this.unsatisfiedAssignment;
      }
    } else if (this.lttype === '...') {
      elem = this.parseSpreadElement();
    }

    if (!firstParen && this.firstParen){
      firstParen =  this.firstParen ;
    }

    if (!firstUnassignable && this.firstUnassignable) {
      firstUnassignable =  this.firstUnassignable ;
    }

// this is actually crucial for the elision ( i.e., empty ) elements
    if ( this.lttype === ',' ) {
      list.push(elem) ;
      this.next();
    }
    else {
       if ( elem ) list.push(elem);
       break ;
    }
  } while ( true );

  if (firstParen) this.firstParen = firstParen ;
  if (firstUnassignable) this.firstUnassignable = firstUnassignable;

  this.unsatisfiedAssignment = unsatisfiedAssignment;

  elem = {
    type: 'ArrayExpression',
    loc: { start: startLoc, end: this.loc() },
    start: startc,
    end: this.c,
    elements: list
  };

  this.expectType(']');

  return elem;
};
