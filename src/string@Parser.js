this.readStrLiteral = function (start) {
  this.li0 = this.li;
  this.col0 = this.col;
  this.c0 = this.c ;
  var c = this.c += 1,
      l = this.src,
      e = l.length,
      i = 0,
      v = "",
      v_start = c,
      startC =  c-1;

  while (c < e && (i = l.charCodeAt(c)) !== start) {
    switch ( i ) {
     case CHAR_BACK_SLASH :
        v  += l.slice(v_start,c );
        this.col += ( c - startC ) ;
        startC =  this.c = c;
        v  += this.readEsc()  ;
        c  = this.c;
        if ( this.col === 0 ) startC = c   +  1   ;
        else  { this.col += ( c - startC  )  ; startC = c ;   }
        v_start = ++c ;
        continue ;

     case CHAR_CARRIAGE_RETURN: if ( l.charCodeAt(c + 1 ) === CHAR_LINE_FEED ) c++ ;
     case CHAR_LINE_FEED :
     case 0x2028 :
     case 0x2029 :
           if ( this['str.newline'](c,startC,v,v_start) )
             return this.errorHandlerOutput ;
    }
    c++;
  }

  if ( v_start !== c ) { v += l.slice(v_start,c ) ; }
  if (!(c < e && (l.charCodeAt(c)) === start) &&
       this['str.unfinished'](c,v) ) return this.errorHandlerOutput;

  this.c = c + 1 ;
  this.col += (this. c - startC   )  ;
  this.lttype = 'Literal'  ;
  this.ltraw =  l.slice (this.c0, this.c);
  this.ltval = v ;
};


