var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseObjectExpression = function() {
  var startc = this.c - 1,
    startLoc = this.locOn(1),
    elem = null,
    list = [];
  var firstUnassignable = null,
    firstParen = null,
    unsatisfiedAssignment = this.unsatisfiedAssignment;
  do {
    this.next();
    this.unsatisfiedAssignment = null;
    elem = this.parseProperty(null);
    if (elem) {
      list.push(elem);
      if (!unsatisfiedAssignment && this.unsatisfiedAssignment)
        unsatisfiedAssignment = this.unsatisfiedAssignment;
      if (!firstParen && this.firstParen)
        firstParen = this.firstParen;
      if (!firstUnassignable && this.firstUnassignable)
        firstUnassignable = this.firstUnassignable;
    } else
      break;
  } while (this.lttype === ',');
  elem = {
    properties: list,
    type: 'ObjectExpression',
    start: startc,
    end: this.c,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.expectType('}');
  if (firstUnassignable) this.firstUnassignable = firstUnassignable;
  if (firstParen) this.firstParen = firstParen;
  if (unsatisfiedAssignment)
    this.unsatisfiedAssignment = unsatisfiedAssignment;
  return elem;
};
module.exports.parseProperty = function(name) {
  var val = null;
  SWITCH:
    if (name === null) switch (this.lttype) {
    case 'op':
      return this.ltraw === '*' ? this.parseGen(CONST.OBJ_MEM) : null;
    case 'Identifier':
      switch (this.ltval) {
      case 'get':
        return this.parseSetGet(CONST.OBJ_MEM);
      case 'set':
        return this.parseSetGet(CONST.OBJ_MEM);
      default:
        name = this.memberID();
        break SWITCH;
      }
    case 'Literal':
      name = this.numstr();
      break SWITCH;
    case '[':
      name = this.memberExpr();
      break SWITCH;
    default:
      return null;
    }
  this.firstUnassignable = this.firstParen = null;
  switch (this.lttype) {
  case ':':
    this.next();
    val = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE);
    return {
      type: 'Property',
      start: name.start,
      key: core(name),
      end: val.end,
      kind: 'init',
      loc: {
        start: name.loc.start,
        end: val.loc.end
      },
      computed: name.type === CONST.PAREN,
      method: false,
      shorthand: false,
      value: core(val)
    };
  case '(':
    return this.parseMeth(name, CONST.OBJ_MEM);
  default:
    this.assert(name.type === 'Identifier');
    if (this.lttype === 'op') {
      this.assert(this.ltraw === '=');
      val = this.parseAssig(name);
      this.unsatisfiedAssignment = val;
    } else
      val = name;
    return {
      type: 'Property',
      key: name,
      start: val.start,
      end: val.end,
      loc: val.loc,
      kind: 'init',
      shorthand: !false,
      method: false,
      value: val,
      computed: false
    };
  }
  return n; // FIXME: unreachable
};
