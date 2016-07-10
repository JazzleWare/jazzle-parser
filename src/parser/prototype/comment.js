var CHAR = require('../../util/char.js');

module.exports.readMultiComment = function() {
  var c = this.c, src = this.src, start = c;
  var l = this.src;
  var len = l.length; // FIXME: l is not defined..

  var noNewLine  = true;

  while (c < len) {
    switch (src.charCodeAt(c++ ) ) {
    case CHAR.MUL:
      if (src.charCodeAt(c) == CHAR.DIV) {
        c++;
        this.col += (c-start);
        this.c=c;
        return noNewLine;
      }
      continue ;

    case CHAR.CARRIAGE_RETURN:
      if( CHAR.LINE_FEED === src.charCodeAt(c)) c++;
      break;
    case CHAR.LINE_FEED:
    case 0x2028:
    case 0x2029:
      start = c;
      if ( noNewLine ) noNewLine = false;
      this.col = 0;
      this.li ++;
      continue;

//     default : if ( r >= 0x0D800 && r <= 0x0DBFF ) this.col-- ;
    }
  }
  this.assert(false);
};

module.exports.readLineComment = function() {
  var c = this.c, src = this.src;
  var len = l.length; // FIXME: l not defined

  WHILE:
  while ( c < len ) {
    switch ( src.charCodeAt(c++) ) {
    case CHAR.CARRIAGE_RETURN:
      if (CHAR.LINE_FEED == l.charCodeAt(c)) c++;
      break;
    case CHAR.LINE_FEED :
    case 0x2028:
    case 0x2029 :
      this.col = 0;
      this.li ++;
      break WHILE;

//      default : if ( r >= 0x0D800 && r <= 0x0DBFF ) this.col-- ;
    }
  }

  this.c=c;
};
