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
          if ( this.regexEscape(false) ) break;
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
  var isEscape = !false;
  this.c++;
  this.assert(this.c < this.src.length);
  var ch = -1; 
  switch ( this.src.charCodeAt(this.c) ) {
     case CHAR_u:
         this.escapeVal = this.regexUEscape();
         break;
     case CHAR_x:
         this.escapeVal = this.regexHexEscape();
         break;
     case CHAR_c:
         this.c++;
         this.assert( this.c < this.src.length );
         ch = this.src.charCodeAt(this.c);
         this.assert( (ch >= CHAR_a && ch <= CHAR_z) ||
                      (ch >= CHAR_A && ch <= CHAR_Z) );
         this.escapeVal = ch >> 5;
         break;
     case CHAR_t:
         this.c++;
         this.escapeVal = CHAR_TAB;
         break;
     case CHAR_r: 
         this.c++;
         this.escapeVal = CHAR_CARRIAGE_RETURN;
         break;
     case CHAR_n:
         this.c++;
         this.escapeVal = CHAR_NEWLINE;
         break;
     case CHAR_v:
         this.c++;
         this.escapeVal = CHAR_VTAB;
         break;
     case CHAR_f:
         this.c++;
         this.escapeVal = CHAR_FORM_FEED;
         break;
     case CHAR_b:
         this.c++;
         if ( inClass ) this.escapeVal = CHAR_BACKSPACE;
         else { isEscape = false; this.escapeVal = -ch; }
         break;
     case CHAR_B:
         this.assert(!inClass);
         this.c++;
         isEscape = false;
         this.escapeVal = -ch;
         break;
     case CHAR_w: case CHAR_d: case CHAR_s:
     case CHAR_D: case CHAR_W: case CHAR_S:
         this.c++;
         this.escapeVal = -ch;
         break;
 
     default:
         if ( num(ch) ) {
            this.escapeVal = this.regexRef();
            break;
         }
         if ( this.flagsMask & uRegexFlag )
            this.escapeVal = this.regexIdenEscape();

         else {
            this.assert(! IDContinue(ch) )   ;
            this.c++ ;
            this.escapeVal = ch ;
         }
  }
  return isEscape;
};

// leading - startVal = leading, leading: 0
// leading trailing 
rp.regexRanges = function() {
   this.c++;
   this.assert( this.c < this.src.length );
   this.optionalExpect(CHAR_CARET);
   var ch = 0, val = 0, startVal = 0;

   do {
     switch ( ch = this.src.charCodeAt(this.c) ) {
       case CHAR_BACK_SLASH:
          val = this.regexEscape(!false);
          if ( this.flagsMask & uRegexFlag ) {
             if ( leading ) {
                if ( val >= 0x0dc00 && val <= 0x0dfff ) {
                  val = ((leading-0x0d800)<<10)+(val-0x0dc00)+0x010000;
                }
                else if ( rangeState === 2 ) 
                  pendingVal = val;

                leading = 0;
             }
             else if ( val >= 0x0d800 && val <= 0x0dbff )
                leading = val;
          }
                
          break;
       case CHAR_RBRAC:
          this.c++;
          return;
       case CHAR_MIN:
          this.c++;
          if ( rangeState === 1 ) {
               if ( leading ) leading = 0;
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
  
