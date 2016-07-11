var CHAR = require('../../util/char.js');
var fromcode = require('../../util/fromcode.js');
var toNum = require('../../util/toNum.js');

module.exports.readEsc = function() {
  var src = this.src, b0 = 0, b = 0;
  switch ( src.charCodeAt ( ++this.c ) ) {
  case CHAR.BACK_SLASH: return '\\';
  case CHAR.MULTI_QUOTE: return'\"' ;
  case CHAR.SINGLE_QUOTE: return '\'' ;
  case CHAR.b: return '\b' ;
  case CHAR.v: return '\v' ;
  case CHAR.f: return '\f' ;
  case CHAR.t: return '\t' ;
  case CHAR.r: return '\r' ;
  case CHAR.n: return '\n' ;
  case CHAR.u:
    b0 = this.peekUSeq();
    if ( b0 >= 0x0D800 && b0 <= 0x0DBFF ) {
      this.c++;
      return String.fromCharCode(b0, this.peekTheSecondByte());
    }
    return fromcode(b0);

  case CHAR.x :
    b0 = toNum(this.src.charCodeAt(++this.c));
    this.assert( b0 !== -1 );
    b = toNum(this.src.charCodeAt(++this.c));
    this.assert( b !== -1 );
    return String.fromCharCode((b0<<4)|b);

  case CHAR[0]: case CHAR[1]: case CHAR[2]: case CHAR[3]:
    b0 = src.charCodeAt(this.c);
    if ( this.tight ) {
      if (b0 === CHAR[0]) {
        b0 = src.charCodeAt(this.c +  1);
        if (b0 < CHAR[0] || b0 >= CHAR[8]) return '\0';
      }
      this.assert(false);
    }

    b = b0 - CHAR[0];
    b0 = src.charCodeAt(this.c + 1 );
    if ( b0 >= CHAR[0] && b0 < CHAR[8] ) {
      this.c++;
      b <<= 3;
      b += (b0-CHAR[0]);
      b0 = src.charCodeAt(this.c+1);
      if ( b0 >= CHAR[0] && b0 < CHAR[8] ) {
        this.c++;
        b <<= 3;
        b += (b0-CHAR[0]);
      }
    }
    return String.fromCharCode(b)  ;

  case CHAR[4]: case CHAR[5]: case CHAR[6]: case CHAR[7]:
    this.assert(!this.tight);
    b0 = src.charCodeAt(this.c);
    b  = b0 - CHAR[0];
    b0 = src.charCodeAt(this.c + 1 );
    if ( b0 >= CHAR[0] && b0 < CHAR[8] ) {
      this.c++;
      b <<= 3;
      b += (b0 - CHAR[0]);
    }
    return String.fromCharCode(b)  ;

  case CHAR.CARRIAGE_RETURN:
    if ( src.charCodeAt(this.c + 1) === CHAR.LINE_FEED ) this.c++;
    // fall through 
  case CHAR.LINE_FEED:
  case 0x2028:
  case 0x2029:
    this.col = 0;
    this.li++;
    return '';

  default:
    return src.charAt(this.c) ;
  }
};
