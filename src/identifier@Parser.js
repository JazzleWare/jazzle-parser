this.readAnIdentifierToken = function (v) {
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
         if (CHAR_u !== src.charCodeAt(c) &&
             this.err('id.slash.no.u',c,v) )
           return this.errorHandlerOutput ;

         peek = this. peekUSeq() ;
         if (peek >= 0x0D800 && peek <= 0x0DBFF ) {
           this.c++;
           byte2 = this.peekTheSecondByte();
           if (!isIDBody(((peek-0x0D800)<<10) + (byte2-0x0DC00) + 0x010000) &&
                this.err('id.multi.must.be.idbody',peek,byte2,c,v) )
             return this.errorHandlerOutput ;

           v += String.fromCharCode(peek, byte2);
         }
         else {
            if ( !isIDBody(peek) &&
                  this.err('id.esc.must.be.idbody',peek,c,v) )
              return this.errorHandlerOutput;
       
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
         if (!isIDBody(((peek-0x0D800 ) << 10) + (byte2-0x0DC00) + 0x010000) &&
              this.err('id.multi.must.be.idbody',peek,byte2,c,v) )
           return this.errorHandlerOutput ;

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


