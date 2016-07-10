var CHAR = require('../../util/char.js');
var CTYPE = require('../../util/ctype.js');
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;
var PREC = require('../../util/precedence.js');
var arguments_or_eval = require('../../util/arguments_or_eval');
var core = require('../../util/core.js');
var fromcode = require('../../util/fromcode.js');
var toNum = require('../../util/toNum.js');
var has = require('../../util/has.js');
var hex = require('../../util/hex.js');

module.exports.validateID = function(e) {
  var n = e || this.ltval;
  SWITCH:
    switch (n.length) {
    case 1:
      break SWITCH;
    case 2:
      switch (n) {
      case 'do':
      case 'if':
      case 'in':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
    case 3:
      switch (n) {
      case 'int':
        if (this.v > 5)
          break SWITCH;
        return this.errorReservedID();
      case 'let':
        if (this.v <= 5 || !this.tight)
          break SWITCH;
      case 'for':
      case 'try':
      case 'var':
      case 'new':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
    case 4:
      switch (n) {
      case 'byte':
      case 'char':
      case 'goto':
      case 'long':
        if (this.v > 5) break SWITCH;
      case 'case':
      case 'else':
      case 'this':
      case 'void':
      case 'with':
      case 'enum':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
    case 5:
      switch (n) {
      case 'await':
        if (this.isScript) break SWITCH;
      case 'final':
      case 'float':
      case 'short':
        if (this.v > 5) break SWITCH;
        return this.errorReservedID();
      case 'yield':
        if (!(this.tight || (this.scopeFlags & SCOPE.YIELD)))
          break SWITCH;
      case 'break':
      case 'catch':
      case 'class':
      case 'const':
      case 'super':
      case 'throw':
      case 'while':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
    case 6:
      switch (n) {
      case 'double':
      case 'native':
      case 'throws':
        if (this.v > 5)
          break SWITCH;
        return this.errorReservedID();
      case 'public':
      case 'static':
        if (this.v > 5 && !this.tight)
          break SWITCH;
      case 'delete':
      case 'export':
      case 'import':
      case 'return':
      case 'switch':
      case 'typeof':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
    case 7:
      switch (n) {
      case 'package':
      case 'private':
        if (this.tight) return this.errorReservedID();
      case 'boolean':
        if (this.v > 5) break;
      case 'default':
      case 'extends':
      case 'finally':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
    case 8:
      switch (n) {
      case 'abstract':
      case 'volatile':
        if (this.v > 5) break;
      case 'continue':
      case 'debugger':
      case 'function':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
    case 9:
      switch (n) {
      case 'interface':
        if (this.tight) this.resv();
      case 'protected':
      case 'transient':
        if (this.v <= 5)
          this.errorReservedID();
      default:
        break SWITCH;
      }
    case 10:
      switch (n) {
      case 'implements':
        if (this.v > 5 && !this.tight) break;
      case 'instanceof':
        this.errorReservedID();
      default:
        break SWITCH;
      }
    case 12:
      switch (n) {
      case 'synchronized':
        if (this.v <= 5) this.errorReservedID();
      default:
        break SWITCH;
      }
    }
  return e ? null : this.id();
};
module.exports.errorReservedID = function() {
  if (!this.throwReserved) {
    this.throwReserved = !false;
    return null;
  }
  this.err(this.ltraw + ' is not an identifier ');
};
