
this.peekTheSecondByte = function () {
  var e = this.src.charCodeAt(this.c);
  if (CHAR_BACK_SLASH === e) {
    if (CHAR_u !== this.src.charCodeAt(++this.c) )
      this['u.second.esc.not.u']();

    e = (this.peekUSeq());
  }
//  else this.col--;
  if ( (e < 0x0DC00 || e > 0x0DFFF) )
    this['u.second.not.in.range'](e);

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
      if ( n === - 1 ) this['u.esc.hex']('curly');

      byteVal <<= 4;
      byteVal += n;
      if (byteVal > 0x010FFFF) this['u.curly.not.in.range'](c,byteVal);

      n = l.charCodeAt( ++ c);
    } while (c < e && n !== CHAR_RCURLY);

    if ( n !== CHAR_RCURLY) this['u.curly.is.unfinished'](c);

    this.c = c;
    return byteVal;
  }
 
  n = toNum(l.charCodeAt(c));
  if ( n === -1 ) this['u.esc.hex']('u',c);
  byteVal = n;
  c++ ;
  n = toNum(l.charCodeAt(c));
  if ( n === -1 ) this['u.esc.hex']('u',c);
  byteVal <<= 4; byteVal += n;
  c++ ;
  n = toNum(l.charCodeAt(c));
  if ( n === -1 ) this['u.esc.hex']('u',c);
  byteVal <<= 4; byteVal += n;
  c++ ;
  n = toNum(l.charCodeAt(c));
  if ( n === -1 ) this['u.esc.hex']('u',c);
  byteVal <<= 4; byteVal += n;

  this.c = c;

  return byteVal;
};


