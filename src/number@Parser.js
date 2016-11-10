this.readNumberLiteral = function (peek) {
  var c = this.c, src = this.src, len = src.length;
  var b = 10 , val = 0;
  this.lttype  = 'Literal' ;
  this.li0 = this.li ;
  this.col0 = this.col;
  this.c0 = this.c;

  if (peek === CHAR_0) { // if our num lit starts with a 0
    b = src.charCodeAt(++c);
    switch (b) { // check out what the next is
      case CHAR_X: case CHAR_x:
         c++;
         if (c >= len && this['num.with.no.digits']('hex', c) )
           return this.errorHandlerOutput;
         b = src.charCodeAt(c);
         if ( ! isHex(b) && this['num.with.first.not.valid']('hex', c)  )
           return this.errorHandlerOutput ;
         c++;
         while ( c < len && isHex( b = src.charCodeAt(c) ) )
             c++ ;
         this.ltval = parseInt( this.ltraw = src.slice(this.c,c) ) ;
         this.c = c;
         return;

      case CHAR_B: case CHAR_b:
        ++c;
        if (c >= len && this['num.with.no.digits']('bin',c) )
          return this.errorHandlerOutput ;
        b = src.charCodeAt(c);
        if ( b !== CHAR_0 && b !== CHAR_1 && this['num.with.first.not.valid']('bin',c) )
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
        return;

      case CHAR_O: case CHAR_o:
        ++c;
        if (c >= len && this['num.with.no.digits']('oct',c) )
          return this.errorHandlerOutput ; 
        b = src.charCodeAt(c);
        if ( (b < CHAR_0 || b >= CHAR_8) && this['num.with.first.not.valid']('oct',c)  )
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
        return;

      default:
        if ( b >= CHAR_0 && b <= CHAR_9 ) {
          if ( this.tight ) this['num.legacy.oct']();
          var base = 8;
          do {
            if ( b >= CHAR_8 && base === 8 ) base = 10 ;
            c ++;
          } while ( c < len &&
                  ( b = src.charCodeAt(c), b >= CHAR_0 && b <= CHAR_9) );
          
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
  
  if ( ( c < len && isIDHead(src.charCodeAt(c))) ) this['num.idhead.tail']() ; // needless
};

this . frac = function(n) {
  var c = this.c,
      l = this.src,
      e = l.length ;
  if ( n === -1 || l.charCodeAt(c)=== CHAR_SINGLEDOT )
     while( ++c < e && Num(l.charCodeAt (c)))  ;

  switch(l.charCodeAt(c)){
      case CHAR_E:
      case CHAR_e:
        c++;
        switch(l.charCodeAt(c)){case CHAR_MIN: case CHAR_ADD: c++ ; }
        while ( c < e && Num(l.charCodeAt( c) )) c++ ;
  }
  if ( c === this.c ) return false  ;
  this.ltraw = l.slice (n === -1 ? this.c - 1 : n, c);
  this.ltval =  parseFloat(this.ltraw )  ;
  this.c = c ;
  return ! false   ;
}


