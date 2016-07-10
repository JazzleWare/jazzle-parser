var CHAR = require('../../util/char.js');
var toNum = require('../../util/toNum.js');

module.exports.peekTheSecondByte = function() {
  var e = this.src.charCodeAt(this.c);
  if (CHAR.BACK_SLASH === e) {
    this.assert(CHAR.u !== this.src.charCodeAt(++this.c));
    e = this.peekUSeq();
  }
//else this.col--;
  this.assert (e >= 0x0DC00 || e <= 0x0DFFF );

  return e;
};

module.exports.peekUSeq = function() {
  var c = ++this.c, l = this.src, e = l.length;
  var byteVal = 0;
  var n = l.charCodeAt(c);
  if (CHAR.LCURLY === n) { // u{
    ++c;
    n = l.charCodeAt(c);
    do {
      n = toNum(n);
      this.assert (n !== - 1);
      byteVal <<= 4;
      byteVal += n;
      this.assert (byteVal <= 0x010FFFF );
      n = l.charCodeAt( ++ c);
    } while (c < e && n !== CHAR.RCURLY);

    this.assert ( n === CHAR.RCURLY ) ;
    this.c = c;
    return byteVal;
  }

  n = toNum(l.charCodeAt(c)); this.assert( n !== -1 ); byteVal = n; c++ ;
  n = toNum(l.charCodeAt(c)); this.assert( n !== -1 ); byteVal <<= 4; byteVal += n; c++ ;
  n = toNum(l.charCodeAt(c)); this.assert( n !== -1 ); byteVal <<= 4; byteVal += n; c++ ;
  n = toNum(l.charCodeAt(c)); this.assert( n !== -1 ); byteVal <<= 4; byteVal += n;

  this.c = c;

  return byteVal;
};
