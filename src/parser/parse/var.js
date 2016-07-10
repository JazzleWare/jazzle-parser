var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseVariableDeclaration = function(context) {
  this.assert(this.canBeStatement);
  this.canBeStatement = false;
  var startc = this.c0,
    startLoc = this.locBegin(),
    kind = this.ltval;
  var elem = null;
  this.next();
  elem = this.parseVariableDeclarator(context);
  if (elem === null) {
    this.assert(kind === 'let');
    return null;
  }
  var list = [elem];
  if (!this.unsatisfiedAssignment) { // parseVariableDeclarator sets it when it finds an uninitialized BindingPattern
    while (this.lttype === ',') {
      this.next();
      elem = this.parseVariableDeclarator(context);
      this.assert(elem);
      list.push(elem);
    }
  }
  var lastItem = list[list.length - 1];
  var endI = 0,
    endLoc = null;
  if (!(context & CONTEXT.FOR)) {
    endI = this.semiI() || lastItem.end;
    endLoc = this.semiLoc() || lastItem.loc.end;
  } else {
    endI = lastItem.end;
    endLoc = lastItem.loc.end;
  }
  this.foundStatement = !false;
  return {
    declarations: list,
    type: 'VariableDeclaration',
    start: startc,
    end: endI,
    loc: {
      start: startLoc,
      end: endLoc
    },
    kind: kind
  };
};
module.exports.parseVariableDeclarator = function(context) {
  if ((context & CONTEXT.FOR) &&
    this.lttype === 'Identifier' &&
    this.ltval === 'in')
    return null;
  var head = this.parsePattern(),
    init = null;
  if (!head) return null;
  if (this.lttype === 'op' && this.ltraw === '=') {
    this.next();
    init = this.parseNonSeqExpr(PREC.WITH_NO_OP, context);
  } else if (head.type !== 'Identifier') { // our pattern is an arr or an obj?
    this.assert(context & CONTEXT.FOR); // bail out in case it is not a 'for' loop's init
    if (!this.unsatisfiedAssignment)
      this.unsatisfiedAssignment = head; // an 'in' or 'of' will satisfy it
  }
  var initOrHead = init || head;
  return {
    type: 'VariableDeclarator',
    id: head,
    start: head.start,
    end: initOrHead.end,
    loc: {
      start: head.loc.start,
      end: initOrHead.loc.end
    },
    init: init && core(init)
  };
};
