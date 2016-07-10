var CONST = require('../../util/constants.js');
var SCOPE = CONST.SCOPE;

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
        break;
      case 'for':
      case 'try':
      case 'var':
      case 'new':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
      break;
    case 4:
      switch (n) {
      case 'byte':
      case 'char':
      case 'goto':
      case 'long':
        if (this.v > 5) break SWITCH;
        break;
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
      break;
    case 5:
      switch (n) {
      case 'await':
        if (this.isScript) break SWITCH;
        break;
      case 'final':
      case 'float':
      case 'short':
        if (this.v > 5) break SWITCH;
        return this.errorReservedID();
      case 'yield':
        if (!(this.tight || (this.scopeFlags & SCOPE.YIELD)))
          break SWITCH;
        break;
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
      break;
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
        break;
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
      break;
    case 7:
      switch (n) {
      case 'package':
      case 'private':
        if (this.tight) return this.errorReservedID();
        break;
      case 'boolean':
        if (this.v > 5) break;
        break;
      case 'default':
      case 'extends':
      case 'finally':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
      break;
    case 8:
      switch (n) {
      case 'abstract':
      case 'volatile':
        if (this.v > 5) break;
      case 'continue': // eslint-disable-line no-fallthrough
      case 'debugger':
      case 'function':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
      break;
    case 9:
      switch (n) {
      case 'interface':
        if (this.tight) this.resv();
        break;
      case 'protected':
      case 'transient':
        if (this.v <= 5)
          this.errorReservedID();
        break;
      default:
        break SWITCH;
      }
      break;
    case 10:
      switch (n) {
      case 'implements':
        if (this.v > 5 && !this.tight) break;
      case 'instanceof': // eslint-disable-line no-fallthrough
        this.errorReservedID();
        break;
      default:
        break SWITCH;
      }
      break;
    case 12:
      switch (n) {
      case 'synchronized':
        if (this.v <= 5) this.errorReservedID();
        break;
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
