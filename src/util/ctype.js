var CHAR = require('./char.js');
var CONST = require('./constants.js');

// TODO: import IDS_, IDC_;
// FIXME: Num, num unused?

var Num, num = Num = function (c) {
    return (c >= CHAR[0] && c <= CHAR[9])
}

function isIDHead(c) {
  return (c <= CHAR.z && c >= CHAR.a) ||
          c === CHAR.$ ||
         (c <= CHAR.Z && c >= CHAR.A) ||
          c === CHAR.UNDERLINE ||
         (IDS_[c >> CONST.D_INTBITLEN] & (1 << (c & CONST.M_INTBITLEN)));
}

function isIDBody (c) {
  return (c <= CHAR.z && c >= CHAR.a) ||
          c === CHAR.$ ||
         (c <= CHAR.Z && c >= CHAR.A) ||
          c === CHAR.UNDERLINE ||
         (c <= CHAR[9] && c >= CHAR[0]) ||
         (IDC_[c >> CONST.D_INTBITLEN] & (1 << (c & CONST.M_INTBITLEN)));
}

function isHex(e) {
  return ( e >= CHAR.a && e <= CHAR.f ) ||
         ( e >= CHAR[0] && e <= CHAR[9] ) ||
         ( e >= CHAR.A && e <= CHAR.F );
}

module.exports.default = module.exports = {
  isIDHead: isIDHead,
  isIDBody: isIDBody,
  isHex: isHex
};
