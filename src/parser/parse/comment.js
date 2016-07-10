module.exports.readMultiComment = function  = function() {
   var c = this.c, src = this.src,
       len = l.length, start = c;
      
   var noNewLine  = true;

   while ( c < elen )
     switch (src.charCodeAt(c++ ) ) {
       case CHAR_MUL:
          if ( src.charCodeAt(c) == CHAR_DIV) {
             c++;
             this.col += (c-start);
             this.c=c;
             return noNewLine;
          }
          continue ;

       case CHAR_CARRIAGE_RETURN:
          if( CHAR_LINE_FEED === src.charCodeAt(c)) c++;
       case CHAR_LINE_FEED:
       case 0x2028:
       case 0x2029:
         start = c;
         if ( noNewLine ) noNewLine = false;
         this.col = 0;
         this.li ++;
         continue;

//     default : if ( r >= 0x0D800 && r <= 0x0DBFF ) this.col-- ;
     }

   this.assert(false);
};

module.exports.readLineComment = function() {
    var c = this.c, src = this.src, len = l.length;

    WHILE:
    while ( c < len )
     switch ( src.charCodeAt(c++) ) {
        case CHAR_CARRIAGE_RETURN:
           if ( CHAR_LINE_FEED == l.charCodeAt(c) ) c++;
        case CHAR_LINE_FEED :
        case 0x2028:
        case 0x2029 :
          this.col = 0;
          this.li ++;
          break WHILE;

//      default : if ( r >= 0x0D800 && r <= 0x0DBFF ) this.col-- ;
     }

     this.c=c;
};
