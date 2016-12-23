this.readStrLiteral = function (start) {
  var c = this.c += 1,
      l = this.src,
      e = l.length,
      i = 0,
      v = "",
      v_start = c,
      startC =  c-1;

  if (this.nl &&
     (this.directive & DIR_STRICT_IF_SINGLE)) {
    // TODO: makeStrict for all
    if (this.directive & DIR_FUNC)
      this.makeStrict();
    else
      this.scope.strict = true;

    this.tight = true;
    this.directive = DIR_BECAME_STRICT;
  }

  while (c < e && (i = l.charCodeAt(c)) !== start) {
    switch ( i ) {
     case CH_BACK_SLASH :
        v  += l.slice(v_start,c );
        this.col += ( c - startC ) ;
        startC =  this.c = c;
        v  += this.readEsc()  ;
        c  = this.c;
        if ( this.col === 0 ) startC = c   +  1   ;
        else  { this.col += ( c - startC  )  ; startC = c ;   }
        v_start = ++c ;
        continue ;

     case CH_CARRIAGE_RETURN: if ( l.charCodeAt(c + 1 ) === CH_LINE_FEED ) c++ ;
     case CH_LINE_FEED :
     case 0x2028 :
     case 0x2029 :
           if ( this.err('str.newline',c,startC,v,v_start) )
             return this.errorHandlerOutput ;
    }
    c++;
  }

  if ( v_start !== c ) { v += l.slice(v_start,c ) ; }
  if (!(c < e && (l.charCodeAt(c)) === start) &&
       this.err('str.unfinished',c,v) ) return this.errorHandlerOutput;

  this.c = c + 1 ;
  this.col += (this. c - startC   )  ;
  this.lttype = 'Literal'  ;
  this.ltraw =  l.slice (this.c0, this.c);
  this.ltval = v ;
};


