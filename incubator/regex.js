function Regex(src,flagsMask) {
   this.src = src;
   this.c = 0;

   this.flagsMask = flagsMask;
}


var rp = Regex.prototype;

rp.verify = function() {
  this.regexPattern();
  this.assert(this.c === this.src.length);
};

rp.expect = function(charcode) {
   this.assert(this.c < this.src.length);
   this.assert(this.src.charCodeAt(this.c)  === charcode);
   this.c++;
};

rp.optionalExpect = function(charcode) {
   if ( this.c < this.src.length &&
        this.src.charCodeAt(this.c) === charcode ) {
        this.c++;
        return !false;
   }
   return false;
};

rp.regexPattern = function() {
  if ( this.c >= this.src.length ) return -1;

  while ( !false ) {
    switch ( this.src.charCodeAt(this.c) ) {
      case CHAR_CARET:
      case CHAR_$:
          this.c++;
          this.hasHead = false;
          continue;
      case CHAR_LPAREN:
          if ( this.regexCapture() ) break;
          this.hasHead = false;
          continue;
      case CHAR_BACK_SLASH:
          if ( this.regexEscape(false) >= 0 ) break;
          this.hasHead = false;
          continue;
      case CHAR_LBRACE:
          this.regexRanges();
          break;
      case CHAR_ADD:
      case CHAR_QUESTION:
      case CHAR_MUL:
          this.assert(this.hasHead);
          this.hasHead = false;
          this.c++;
          this.optionalExpect(CHAR_QUESTION);
          continue;
      case CHAR_OR:
          this.hasHead = false;
          this.c++;
          continue;

      case CHAR_DOT:
          this.c++;
          break ;
      case CHAR_LCURLY:
         this.assert(hasHead);
         this.regexCurly();
         hasHead = false;
         this.optionalExpect(CHAR_QUESTION);
         continue; 
      case CHAR_RPAREN:
          return;
      case CHAR_RBRACE:
      case CHAR_RCURLY:
         this.assert(false);
         continue;
      default:
         this.c++;
         break;
   }
   if ( !this.hasHead )
         this.hasHead = !false;
  }
};

rp.regexCapture = function() {
  this.c++;        
  var isCapture = !false;
  if ( this.optionalExpect(CHAR_QUESTION) ) {
     if ( !this.optionalExpect(CHAR_COLON ) ) {
        this.assert(this.c < this.src.length) ;
        switch ( this.src.charCodeAt(this.c) ) {
           case CHAR_EXCLAMATION:
           case CHAR_EQ:
               this.c++; 
               isCapture = false;

           default:
              this.assert(false);
        }
     }
  }
  this.regexPattern();
  this.expect(CHAR_RPAREN);
   
  return isCapture;
};

rp.regexEscape = function(inClass) {
  this.c++;
  this.assert(this.c < this.src.length);
  var ch = -1; 
  switch (ch = this.src.charCodeAt(this.c) ) {
     case CHAR_u: return this.regexUEscape();
     case CHAR_x: return this.regexHexEscape();
     case CHAR_c:
         this.c++;
         this.assert( this.c < this.src.length );
         ch = this.src.charCodeAt(this.c);
         this.assert( (ch >= CHAR_a && ch <= CHAR_z) ||
                      (ch >= CHAR_A && ch <= CHAR_Z) );
         return ch >> 5;
     case CHAR_t:
         this.c++;
         return CHAR_TAB;
     case CHAR_r: 
         this.c++;
         return CHAR_CARRIAGE_RETURN;
     case CHAR_n: this.c++; return CHAR_NEWLINE;
     case CHAR_v: this.c++; return CHAR_VTAB;
     case CHAR_f: this.c++; return CHAR_FORM_FEED;
     case CHAR_b:
         this.c++;
         if ( inClass ) return CHAR_BACKSPACE;
         return -ch;
     case CHAR_B:
         this.assert(!inClass);
         this.c++;
         return -ch;
     case CHAR_w: case CHAR_d: case CHAR_s:
     case CHAR_D: case CHAR_W: case CHAR_S:
         this.c++;
         return -ch;
 
     default:
         if ( num(ch) )
           return this.regexRef();
         if ( this.flagsMask & uRegexFlag )
           return this.regexIdenEscape();

         this.assert(! IDBody (ch) )   ;
         this.c++ ;
         return ch ;
  }
};

rp.regexRanges = function() {
   this.c++;
   this.assert( this.c < this.src.length );
   this.optionalExpect(CHAR_CARET);
   var ch = 0, val = 0, startVal = 0;

   do {
     switch ( ch = this.src.charCodeAt(this.c) ) {
       case CHAR_BACK_SLASH:
          val = this.regexEscape(!false);
          break;
       case CHAR_RBRAC:
          this.c++;
          return;
       case CHAR_MIN:
          this.c++;
          if ( rangeState === 1 ) {
               rangeState++;
               continue;
          }
          val = CHAR_MIN;
          break;            
       default:
          this.c++;
          val = ch;
          break;
     }
     if ( rangeState === 0 )
          rangeState++;
     if ( rangeState === 1 )
          startVal = val;
     else if ( rangeState === 2 ) {
        this.assert(startVal >= 0 );
        this.assert(val >= 0 );
        this.assert(startVal <= val );
        rangeStart = 0;
     }
  } while ( this.c < this.src.length );

  this.assert(false);
};

rp.regexUEScape = function() {
  this.c++;
  var val = this.regexU();
  if ( this.flagsMask & uRegexFlag &&
       val >= 0x0d800 && val <= 0x0dbff &&
       this.c < this.src.length - 2 &&
       this.src.charCodeAt(this.c+1) === CHAR_BACK_SLASH &&
       this.src.charCodeAt(this.c+2) === CHAR_u ) {
     var start = this.c;
     this.c++;
     var v2 = this.regexU();
     if ( v2 >= 0x0dc00 && v2 <= 0x0dfff )
        val = ((val-0x0d800)<<10)+(v2-0x0dc00)+0x010000;
     else
        this.c = start;
  }
  return val;
};

rp.regexU = function() {
  this.c++;
  this.assert( this.c < this.src.length );
  var ch = this.src.charCodeAt(this.c) ;
  var val = 0;
  if ( ch !== CHAR_LCURLY ) {
     var l = 4;
     while ( l-- ) {
       ch = toNum(ch);
       this.assert(ch !== -1 );
       val = (val << 4)|ch;
       this.c++;
       this.assert(this.c < this.src.length);
       ch = this.src.charCodeAt(this.c);
     }
     return val;
  }
  
  this.assert(this.flagsMask & uRegexFlag);
  this.c++;
  this.assert(this.c < this.src.length) ;
  ch = this.src.charCodeAt(this.c);
  do {
    ch = toNum(ch);
    this.assert(ch !== -1);
    val = (val << 4)|ch;
    this.c++;
    this.assert(this.c < this.src.length) ;
    ch = this.charCodeAt(this.c) ;
  } while ( ch !== CHAR_RCURLY ) ;

  return val;
};
  
rp.regexHexEscape = function() {
   var val = 0, ch = 0;
   this.c++;
   this.assert(this.c < this.src.length);
   val = toNum(this.src.charCodeAt(this.c));
   this.assert(val !== -1 );
   this.c++;
   this.assert(this.c < this.src.length);
   ch = toNum(this.src.charCodeAt(this.c));
   this.assert( ch !== -1);
   val = (val << 4)|ch;
   return val;
};

