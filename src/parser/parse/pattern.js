var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parsePattern = function() {
  switch (this.lttype) {
  case 'Identifier':
    var id = this.validateID(null);
    if (this.isInArgList)
      this.addArg(id);
    return id;
  case '[':
    return this.parseArrayPattern();
  case '{':
    return this.parseObjectPattern();
  default:
    return null;
  }
};
module.exports.parseArrayPattern = function() {
  var startc = this.c - 1,
    startLoc = this.locOn(1),
    elem = null,
    list = [],
    tight;
  if (this.isInArgList) {
    tight = this.tight;
    this.tight = !false;
  }
  this.next();
  while (!false) { // FIXME: const in while
    elem = this.parsePattern();
    if (elem) {
      if (this.lttype === 'op' && this.ltraw === '=') elem = this.parseAssig(
        elem);
    } else {
      if (this.lttype === '...') {
        list.push(this.parseRestElement());
        break;
      }
    }
    if (this.lttype === ',') {
      list.push(elem);
      this.next();
    } else {
      if (elem) list.push(elem);
      break;
    }
  }
  if (this.isInArgList)
    this.tight = tight;
  elem = {
    type: 'ArrayPattern',
    loc: {
      start: startLoc,
      end: this.loc()
    },
    start: startc,
    end: this.c,
    elements: list
  };
  this.expectType(']');
  return elem;
};
module.exports.parseObjectPattern = function() {
  var sh = false;
  var startc = this.c - 1;
  var startLoc = this.locOn(1);
  var list = [];
  var val = null;
  var name = null;
  var tight;
  if (this.isInArgList) {
    tight = this.tight;
    this.tight = !false;
  }
  LOOP:
    do {
      sh = false;
      this.next();
      switch (this.lttype) {
      case 'Identifier':
        name = this.memberID();
        if (this.lttype === ':') {
          this.next();
          val = this.parsePattern();
        } else {
          sh = !false;
          val = name;
        }
        break;
      case '[':
        name = this.memberExpr();
        this.expectType(':');
        val = this.parsePattern();
        break;
      case 'Literal':
        name = this.numstr();
        this.expectType(':');
        val = this.parsePattern();
        break;
      default:
        break LOOP;
      }
      if (this.lttype === 'op' && this.ltraw === '=')
        val = this.parseAssig(val);
      list.push({
        type: 'Property',
        start: name.start,
        key: core(name),
        end: val.end,
        loc: {
          start: name.loc.start,
          end: val.loc.end
        },
        kind: 'init',
        computed: name.type === CONST.PAREN,
        value: val,
        method: false,
        shorthand: sh
      });
    } while (this.lttype === ',');
  if (this.isInArgList)
    this.tight = tight;
  var n = {
    type: 'ObjectPattern',
    loc: {
      start: startLoc,
      end: this.loc()
    },
    start: startc,
    end: this.c,
    properties: list
  };
  this.expectType('}');
  return n;
};
module.exports.parseAssig = function(head) {
  this.next();
  var e = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE);
  return {
    type: 'AssignmentPattern',
    start: head.start,
    left: head,
    end: e.end,
    right: core(e),
    loc: {
      start: head.loc.start,
      end: e.loc.end
    }
  };
};
module.exports.parseRestElement = function() {
  var startc = this.c - 1 - 2,
    startLoc = this.locOn(1 + 2);
  this.next();
  var e = this.parsePattern();
  this.assert(e);
  return {
    type: 'RestElement',
    loc: {
      start: startLoc,
      end: e.loc.end
    },
    start: startc,
    end: e.end,
    argument: e
  };
};
