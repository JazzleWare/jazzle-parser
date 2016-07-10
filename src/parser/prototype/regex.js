var CHAR = require('../../util/char.js');
var hex = require('../../util/hex.js');

var gRegexFlag = 1,
  uRegexFlag = gRegexFlag << 1,
  yRegexFlag = uRegexFlag << 1,
  mRegexFlag = yRegexFlag << 1,
  iRegexFlag = mRegexFlag << 1;
var regexFlagsSupported = 0;
try {
  new RegExp("lube", "g");
  regexFlagsSupported |= gRegexFlag;
  new RegExp("lube", "u");
  regexFlagsSupported |= uRegexFlag;
  new RegExp("lube", "y");
  regexFlagsSupported |= yRegexFlag;
  new RegExp("lube", "m");
  regexFlagsSupported |= mRegexFlag;
  new RegExp("lube", "i");
  regexFlagsSupported |= iRegexFlag;
} catch (r) {}
module.exports.curlyReplace = function(matchedString, b, matchIndex,
  wholeString) { // FIXME: wholestring unused
  var c = parseInt('0x' + b);
  if (c <= 0xFFFF) return '\\u' + hex(c);
  return '\\uFFFF';
};
module.exports.regexReplace = function(matchedString, b, noB, matchIndex,
  wholeString) { // FIXME: wholestring unused
  var c = parseInt('0x' + (b || noB));
  this.assert(c <= 0x010FFFF);
  if (c <= 0xFFFF) return String.fromCharCode(c);
  c -= 0x010000;
  return '\uFFFF';
};
module.exports.verifyRegex = function(regex, flags) {
  var regexVal = null; // FIXME: unused
  try {
    return new RegExp(regex, flags);
  } catch (e) {
    throw e;
  }
};
module.exports.parseRegExpLiteral = function() {
  var startc = this.c - 1,
    startLoc = this.locOn(1),
    c = this.c,
    src = this.src,
    len = src.length;
  var inSquareBrackets = false;
  WHILE:
    while (c < len) {
      switch (src.charCodeAt(c)) {
      case CHAR.LSQBRACKET:
        if (!inSquareBrackets)
          inSquareBrackets = !false;
        break;
      case CHAR.BACK_SLASH:
        ++c;
        break;
      case CHAR.RSQBRACKET:
        if (inSquareBrackets)
          inSquareBrackets = false;
        break;
      case CHAR.DIV:
        if (inSquareBrackets)
          break;
        break WHILE;
        //       default:if ( o >= 0x0D800 && o <= 0x0DBFF ) { this.col-- ; }
      }
      c++;
    }
  this.assert(src.charCodeAt(c) === CHAR.DIV);
  var flags = 0;
  var flagCount = 0;
  WHILE:
    while (flagCount <= 5) {
      switch (src.charCodeAt(++c)) {
      case CHAR.g:
        this.assert(!(flags & gRegexFlag));
        flags |= gRegexFlag;
        break;
      case CHAR.u:
        this.assert(!(flags & uRegexFlag));
        flags |= uRegexFlag;
        break;
      case CHAR.y:
        this.assert(!(flags & yRegexFlag));
        flags |= yRegexFlag;
        break;
      case CHAR.m:
        this.assert(!(flags & mRegexFlag));
        flags |= mRegexFlag;
        break;
      case CHAR.i:
        this.assert(!(flags & iRegexFlag));
        flags |= iRegexFlag;
        break;
      default:
        break WHILE;
      }
      flagCount++;
    }
  var patternString = src.slice(this.c, c - flagCount - 1),
    flagsString = src.slice(c - flagCount, c);
  var val = null;
  var normalizedRegex = patternString;
  // those that contain a 'u' flag need special treatment when RegExp constructor they get sent to
  // doesn't support the 'u' flag: since they can have surrogate pair sequences (which are not allowed without the 'u' flag),
  // they must be checked for having such surrogate pairs, and should replace them with a character that is valid even
  // without being in the context of a 'u'
  if ((flags & uRegexFlag) && !(regexFlagsSupported & uRegexFlag))
    normalizedRegex = normalizedRegex.replace(/\\u\{([A-F0-9a-f]+)\}/g,
      exports.curlyReplace) // normalize curlies
    .replace(/\\u([A-F0-9a-f][A-F0-9a-f][A-F0-9a-f][A-F0-9a-f])/g,
      exports.regexReplace) // convert
    .replace(/[\ud800-\udbff][\udc00-\udfff]/g, '\uFFFF');
  // all of the 1 bits in flags must also be 1 in the same bit index in regexsupportedFlags;
  // flags ^ rsf returns a bit set in which the 1 bits mean "this flag is either not used in flags, or yt is not supported";
  // for knowing whether the 1 bit has also been 1 in flags, we '&' the above bit set with flags; the 1 bits in the
  // given bit set must both be 1 in flags and in flags ^ rsf; that is, they are both "used" and "unsupoorted or unused",
  // which would be equal to this: [used && (unsupported || !used)] == unsopprted
  if (flags & (regexFlagsSupported ^ flags))
    exports.verifyRegex(normalizedRegex, '');
  else
    val = exports.verifyRegex(patternString, flagsString);
  this.col += (c - this.c);
  var regex = {
    type: 'Literal',
    regex: {
      pattern: patternString,
      flags: flagsString
    },
    start: startc,
    end: c,
    value: val,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.c = c;
  this.next();
  return regex;
};
