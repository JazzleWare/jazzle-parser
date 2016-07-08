_class.readAnIdentifierToken = function (v) {
   // if head has been a u, the location has already been saved in #next()
   if ( !v ) {
     this.li0 = this.li;
     this.col0 = this.col;
     this.c0 = this.c;
   }

   var c = this.c, src = this.src, len = src.length, peek;
   c++; // start reading the body

   var byte2, startSlice = c; // the head is already supplied in v

   while ( c < len ) {
      peek = src.charCodeAt(c); 
      if ( isIDBody(peek) ) {
         c++;
         continue;
      }

      if ( peek === CHAR_BACK_SLASH ) {
         if ( !v ) // if all previous characters have been non-u characters 
            v = src.charAt (startSlice-1); // v = IDHead

         if ( startSlice < c ) // if there are any non-u characters behind the current '\'
            v += src.slice(startSlice,c) ; // v = v + those characters

         this.c = ++c;
         this.assert (CHAR_u === src.charCodeAt(c) );

         peek = this. peekUSeq() ;
         if (peek >= 0x0D800 && peek <= 0x0DBFF ) {
           this.c++;
           byte2 = this.peekTheSecondByte();
           this.assert(isIDBody(((peek-0x0D800)<<10) + (byte2-0x0DC00) + 0x010000));
           v += String.fromCharCode(peek, byte2);
         }
         else {
            this.assert(isIDBody(peek));
            v += fromcode(peek);
         }
         c = this.c;
         c++;
         startSlice = c;
      }
      else if (peek >= 0x0D800 && peek <= 0x0DBFF ) {
         if ( !v ) { v = src.charAt(startSlice-1); }
         if ( startSlice < c ) v += src.slice(startSlice,c) ;
         c++;
         this.c = c; 
         byte2 = this.peekTheSecondByte() ;
         this.assert(isIDBody(((peek-0x0D800 ) << 10) + (byte2-0x0DC00) + 0x010000));
         v += String.fromCharCode(peek, byte2);
         c = this.c ;
         c++;
         startSlice = c;
      }
      else { break ; } 
    }
    if ( v ) { // if we have come across at least one u character
       if ( startSlice < c ) // but all others that came after the last u-character have not been u-characters
         v += src.slice(startSlice,c); // then append all those characters

       this.ltraw = src.slice(this.c0,c);
       this.ltval = v  ;
    }
    else {
       this.ltval = this.ltraw = v = src.slice(startSlice-1,c);
    }
    this.c = c;
    this.lttype= 'Identifier';
};


