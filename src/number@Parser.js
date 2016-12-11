this.readNumberLiteral = function (peek) {
  var c = this.c, src = this.src, len = src.length;
  var b = 10 , val = 0;
  this.lttype  = 'Literal' ;

  if (peek === CHAR_0) { // if our num lit starts with a 0
    b = src.charCodeAt(++c);
    switch (b) { // check out what the next is
      case CHAR_X: case CHAR_x:
         c++;
         if (c >= len && this.err('num.with.no.digits','hex', c) )
           return this.errorHandlerOutput;
         b = src.charCodeAt(c);
         if ( ! isHex(b) && this.err('num.with.first.not.valid','hex', c)  )
           return this.errorHandlerOutput ;
         c++;
         while ( c < len && isHex( b = src.charCodeAt(c) ) )
             c++ ;
         this.ltval = parseInt( this.ltraw = src.slice(this.c,c) ) ;
         this.c = c;
         break;

      case CHAR_B: case CHAR_b:
        ++c;
        if (c >= len && this.err('num.with.no.digits','bin',c) )
          return this.errorHandlerOutput ;
        b = src.charCodeAt(c);
        if ( b !== CHAR_0 && b !== CHAR_1 && this.err('num.with.first.not.valid','bin',c) )
          return this.errorHandlerOutput ;
        val = b - CHAR_0; 
        ++c;
        while ( c < len &&
              ( b = src.charCodeAt(c), b === CHAR_0 || b === CHAR_1 ) ) {
           val <<= 1;
           val |= b - CHAR_0; 
           c++ ;
        }
        this.ltval = val ;
        this.ltraw = src.slice(this.c,c);
        this.c = c;
        break;

      case CHAR_O: case CHAR_o:
        ++c;
        if (c >= len && this.err('num.with.no.digits','oct',c) )
          return this.errorHandlerOutput ; 
        b = src.charCodeAt(c);
        if ( (b < CHAR_0 || b >= CHAR_8) && this.err('num.with.first.not.valid','oct',c)  )
          return this.errorHandlerOutput ;

        val = b - CHAR_0 ;
        ++c; 
        while ( c < len &&
              ( b = src.charCodeAt(c), b >= CHAR_0 && b < CHAR_8 ) ) {
           val <<= (1 + 2);
           val |= b - CHAR_0;
           c++ ;
        } 
        this.ltval = val ;
        this.ltraw = src.slice(this.c,c) ;
        this.c = c;
        break;

      default:
        if ( b >= CHAR_0 && b <= CHAR_9 ) {
          if ( this.tight ) this.err('num.legacy.oct');
          var base = 8;
          do {
            if ( b >= CHAR_8 && base === 8 ) base = 10 ;
            c ++;
          } while ( c < len &&
                  ( b = src.charCodeAt(c), b >= CHAR_0 && b <= CHAR_9) );
          
          b = this.c;
          this.c = c; 
  
          if ( !this.frac(b) )
            this.ltval = parseInt (this.ltraw = src.slice(b, c), base);
          
        }
        else {
          b = this.c ;
          this.c = c ;
          if ( !this.frac(b) ) {
             this.ltval = 0;
             this.ltraw = '0';
          }
        }
    }
  }

  else  {
    b = this.c;
    c ++ ;
    while (c < len && num(src.charCodeAt(c))) c++ ;
    this.c = c;
    if ( !this.frac(b) ) {
      this.ltval = parseInt(this.ltraw = src.slice(b, this.c)  ) ;
      this.c = c;
    }
  }
  // needless as it will be an error nevertheless, but it is still requir'd
  if ( ( this.c < len && isIDHead(src.charCodeAt(this.c))) ) this.err('num.idhead.tail') ; 
};

this . frac = function(n) {
  var c = this.c,
      l = this.src,
      e = l.length ;
  if ( n === -1 || l.charCodeAt(c)=== CHAR_SINGLEDOT )
     while( ++c < e && Num(l.charCodeAt (c)))  ;

  switch( l.charCodeAt(c) ){
      case CHAR_E:
      case CHAR_e:
        c++;
        switch(l.charCodeAt(c)){
          case CHAR_MIN:
          case CHAR_ADD:
                 c++ ;
        }
        if ( !(c < e && Num(l.charCodeAt(c))) )
          this.err('num.has.no.mantissa', c, n);

        do { c++;} while ( c < e && Num(l.charCodeAt( c) ));
  }

  if ( c === this.c ) return false  ;
  this.ltraw = l.slice (n === -1 ? this.c - 1 : n, c);
  this.ltval =  parseFloat(this.ltraw )  ;
  this.c = c ;
  return true   ;
}


