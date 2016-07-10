var CHAR = require('../../util/char.js');
var CONST = require('../../util/constants.js');

module.exports.readMultiComment = function() {
  // FIXME: l not defined.
  var c = this.c, src = this.src, len = l.length, start = c;

  var noNewLine  = true;

  // FIXME: elen not defined
  while (c < elen) {
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
      // FIXME: expect break
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
  // FIXME: l not defined
  var c = this.c, src = this.src, len = l.length;

  WHILE:
  while ( c < len ) {
    switch ( src.charCodeAt(c++) ) {
    case CHAR.CARRIAGE_RETURN:
      if (CHAR.LINE_FEED == l.charCodeAt(c)) c++;
       // FIXME: expect break
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
