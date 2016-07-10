var CHAR = require('../../util/char.js');
var CTYPE = require('../../util/ctype.js');

module.exports.readNumberLiteral =  function(peek) {
  var c = this.c, src = this.src, len = src.length;
  var b = 10 , val = 0;
  this.lttype  = 'Literal' ;
  this.li0 = this.li ;
  this.col0 = this.col;
  this.c0 = this.c;

  if (peek == CHAR[0]) { // if our num lit starts with a 0
    b = src.charCodeAt(++c);
    switch (b) { // check out what the next is
    case CHAR.X: case CHAR.x:
      c++;
      this.assert(c < len);
      b = src.charCodeAt(c);
      this.assert( CTYPE.isHex(b) );
      c++;
      while ( c < len && CTYPE.isHex( b = src.charCodeAt(c) ) )
        c++ ;
      this.ltval = parseInt( this.ltraw = src.slice(this.c,c) ) ;
      this.c = c;
      return;

    case CHAR.B: case CHAR.b:
      ++c;
      this.assert(c < len);
      b = src.charCodeAt(c);
      this.assert( b === CHAR[0] || b === CHAR[1] );
      val = b - CHAR[0];
      ++c;
      while ( c < len &&
            ( b = src.charCodeAt(c), b === CHAR[0] || b === CHAR[1] ) ) {
        val <<= 1;
        val |= b - CHAR[0];
        c++ ;
      }
      this.ltval = val ;
      this.ltraw = src.slice(this.c,c);
      this.c = c;
      return;

    case CHAR.O: case CHAR.o:
      ++c;
      this.assert(c < len) ;
      b = src.charCodeAt(c);
      this.assert( b >= CHAR[0] && b < CHAR[8] );
      val = b - CHAR[0] ;
      ++c;
      while ( c < len &&
            ( b = src.charCodeAt(c), b >= CHAR[0] && b < CHAR[8] ) ) {
        val <<= (1 + 2);
        val |= b - CHAR[0];
        c++ ;
      }
      this.ltval = val ;
      this.ltraw = src.slice(this.c,c) ;
      this.c = c;
      return;

    default:
      if ( b >= CHAR[0] && b <= CHAR[9] ) {
        this.assert( !this.tight );
        var base = 8;
        do {
          if ( b >= CHAR[8] && base === 8 ) base = 10 ;
          c ++;
        } while ( c < len &&
                ( b = src.charCodeAt(c), b >= CHAR[0] && b <= CHAR[9]) );

        b = this.c;
        this.c = c;

        if ( this.frac(b) ) return;

        this.ltval = parseInt (this.ltraw = src.slice(b, c), base);
        return ;
      }
      else {
        b = this.c ;
        this.c = c ;
        if ( this.frac(b) ) return;
        else  {
          this.ltval = 0;
          this.ltraw = '0';
        }
        return  ;
      }
    }
  }

  else  {
    b = this.c;
    c ++ ;
    while (c < len && num(src.charCodeAt(c))) c++ ;
    this.c = c;
    if ( this.frac(b) )
      return;
    else
      this.ltval = parseInt(this.ltraw = src.slice(b, this.c)  ) ;

    this.c = c;
  }

  this.assert ( !( c < len && CTYPE.isIDHead(src.charCodeAt(c))) ); // needless
};

module.exports . frac = function(n) {
  var c = this.c,
    l = this.src,
    e = l.length ;
  if ( n == -1 || l.charCodeAt(c)== CHAR.SINGLEDOT )
    while( ++c < e && Num(l.charCodeAt (c)));

  switch(l.charCodeAt(c)){
  case CHAR.E:
  case CHAR.e:
    c++;
    switch(l.charCodeAt(c)) {
    case CHAR.MIN: case CHAR.ADD: c++ ;
    }
    while ( c < e && Num(l.charCodeAt( c) )) c++ ;
  }
  if ( c == this.c ) return false  ;
  this.ltraw = l.slice (n === -1 ? this.c - 1 : n, c);
  this.ltval =  parseFloat(this.ltraw )  ;
  this.c = c ;
  return ! false   ;
};
