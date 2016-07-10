/* global PREC_WITH_NO_OP, CONTEXT_NULLABLE, CONTEXT_ELEM */

function parseArray() {
  var startc = this.c - 1;
  var startLoc = this.locOn(1);
  var elem = null, list = [];

  this.next () ;

  var firstUnassignable = null, firstParen = null;
  var unsatisfiedAssignment = this.unsatisfiedAssignment;

  do {
    this.firstUnassignable = this.firstParen = null;
    this.unsatisfiedAssignment = null ;

    elem = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NULLABLE|CONTEXT_ELEM);

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

    list.push(elem) ;
    this.next();
  } while (this.lttype === ',');

  if (elem) list.push(elem);

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
}

module.exports.default = module.exports = parseArray;
