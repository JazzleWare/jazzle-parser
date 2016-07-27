
this.peekTheSecondByte = function () {
  var e = this.src.charCodeAt(this.c);
  if (CHAR_BACK_SLASH === e) {
    if (CHAR_u !== this.src.charCodeAt(++this.c)) this.err('the \\ must have "u" after it ;instead, it has ' + this.src[this.c] );
    e = (this.peekUSeq());
  }
//  else this.col--;
  if (e < 0x0DC00 || e > 0x0DFFF )
      this.err('Byte (' + _h(e)+ ') must be in range 0x0DC00 to 0x0DFFF, but it is not ');

  return e;
};

this.peekUSeq = function () {
  var c = ++this.c, l = this.src, e = l.length;
  var byteVal = 0;
  var n = l.charCodeAt(c);
  if (CHAR_LCURLY === n) { // u{ 
    ++c;
    n = l.charCodeAt(c);
    do {
      n = toNum(n);
      this.assert (n !== - 1);
      byteVal <<= 4;
      byteVal += n;
      this.assert (byteVal <= 0x010FFFF );
      n = l.charCodeAt( ++ c);
    } while (c < e && n !== CHAR_RCURLY);

    this.assert ( n === CHAR_RCURLY ) ;
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


