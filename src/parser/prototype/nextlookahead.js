var CHAR = require('../../util/char.js');
var CTYPE = require('../../util/ctype.js');
var PREC = require('../../util/precedence.js');
var fromcode = require('../../util/fromcode.js');

module.exports.next =  function() {
  if ( this.skipS() ) return;
  if (this.c >= this.src.length) {
    this. lttype =  'eof' ;
    this.ltraw=  '<<EOF>>';
    return ;
  }
  var c = this.c,
    l = this.src,
  //  e = l.length, // FIXME: unused
    r = 0,
    peek,
    start =  c;

  peek  = this.src.charCodeAt(start);
  if ( CTYPE.isIDHead(peek) )this.readAnIdentifierToken('');
  else if (CTYPE.Num(peek))this.readNumberLiteral(peek);
  else {
    switch (peek) {
    case CHAR.MIN: this.opMin(); break;
    case CHAR.ADD: this.opAdd() ; break;
    case CHAR.MULTI_QUOTE:
    case CHAR.SINGLE_QUOTE:
      return this.readStrLiteral(peek);
    case CHAR.SINGLEDOT: this.readDot () ; break ;
    case CHAR.EQUALITY_SIGN:  this.opEq () ;   break ;
    case CHAR.LESS_THAN: this.opLess() ;   break ;
    case CHAR.GREATER_THAN: this.opGrea() ;   break ;
    case CHAR.MUL:
      this.ltraw = '*';
      this.lttype = 'op';
      c++ ;
      if ( l.charCodeAt(c+1) === peek) {
        this.ltraw = '**';
        c++ ;
      }
      if (l.charCodeAt(c) == CHAR.EQUALITY_SIGN) {
        c++;
        this. prec = PREC.OP_ASSIG;
        this.ltraw += '=';
      }
      else {
        this. prec = PREC.MUL;
      }
      this.c=c;
      break ;

    case CHAR.MODULO:
      this.lttype = 'op';
      c++ ;
      if (l.charCodeAt(c) == CHAR.EQUALITY_SIGN) {
        c++;
        this. prec = PREC.OP_ASSIG;
        this.ltraw = '%=';
      }
      else {
        this. prec = PREC.MUL;
        this.ltraw = '%';
      }
      this.c=c;
      break ;

    case CHAR.EXCLAMATION:
      c++ ;
      if ( l.charCodeAt(c) === CHAR.EQUALITY_SIGN ) {
        this. lttype = 'op';
        c++;
        this.prec = PREC.EQUAL;
        if ( l.charCodeAt(c) == CHAR.EQUALITY_SIGN ) {
          this.ltraw = '!==';
          c++;
        }
        else this.ltraw = '!=' ;
      }
      else {
        this .lttype = 'u' ;
        this.ltraw = '!';
      }
      this.c=c;
      break ;

    case CHAR.COMPLEMENT:
      c++;
      this.c=c;
      this.ltraw = '~';
      this.lttype = 'u';
      break ;

    case CHAR.OR:
      c++;
      this.lttype = 'op' ;
      switch ( l.charCodeAt(c) ) {
      case CHAR.EQUALITY_SIGN:
        c++;
        this.prec = PREC.OP_ASSIG ;
        this.ltraw = '|=';
        break ;

      case CHAR.OR:
        c++;
        this.prec = PREC.BOOL_OR;
        this.ltraw = '||'; break ;

      default:
        this.prec = PREC.BIT_OR;
        this.ltraw = '|';
        break ;
      }
      this.c=c;
      break;

    case CHAR.AND:
      c++ ;
      this.lttype = 'op';
      switch ( l.charCodeAt(c) ) {
      case CHAR.EQUALITY_SIGN:
        c++;
        this. prec = PREC.OP_ASSIG;
        this.ltraw = '&=';
        break;

      case CHAR.AND:
        c ++;
        this.prec = PREC.BOOL_AND;
        this.ltraw = '&&';
        break ;

      default:
        this.prec = PREC.BIT_AND;
        this.ltraw = '&';
        break ;
      }
      this.c=c;
      break ;

    case CHAR.XOR:
      c++;
      this.lttype = 'op';
      if ( l.charCodeAt(c) == CHAR.EQUALITY_SIGN ) {
        c++;
        this.prec = PREC.OP_ASSIG;
        this.ltraw = '^=';
      }
      else  {
        this.  prec = PREC.XOR;
        this.ltraw = '^';
      }
      this.c=c  ;
      break;

    default:

      var mustBeAnID = 0 ;

      this.c = c;
      this.c0 = c;
      this.col0 = this.col;
      this.li0 = this.li;

      if (CHAR.BACK_SLASH === peek) {
        mustBeAnID = 1;
        peek = l.charCodeAt(++ this.c);
        this.assert (peek === CHAR.u);
        peek = this.peekUSeq();
      }
      if (peek >= 0x0D800 && peek <= 0x0DBFF ) {
        mustBeAnID = 2 ;
        this.c++;
        r = this.peekTheSecondByte();
      }
      if (mustBeAnID) {
        this.assert(CTYPE.isIDHead(mustBeAnID === 1 ? peek :
              ((peek - 0x0D800)<<10) + (r-0x0DC00) + (0x010000) ));
        this.readAnIdentifierToken( mustBeAnID === 2 ?
            String.fromCharCode( peek, r ) :
            fromcode( peek )
        );
      }
      else
        this.readMisc();
    }
  }

  this.col += ( this.c - start );
};

module.exports . opEq = function()  {
  var c = this.c;
  var l = this.src;
  this.lttype = 'op';
  c++ ;

  if ( l.charCodeAt(c) === CHAR.EQUALITY_SIGN ) {
    c++;
    this.prec = PREC.EQUAL ;
    if ( l.charCodeAt(c ) == CHAR.EQUALITY_SIGN ){
      c++ ;
      this.ltraw = '===';
    }
    else this.ltraw = '==';
  }
  else {
    this.prec = PREC.SIMP_ASSIG;
    if ( l.charCodeAt(c) == CHAR.GREATER_THAN) {
      c++;
      this. ltraw = '=>';
    }
    else this.ltraw = '=';
  }

  this.c=c;
};

module.exports . opMin = function() {
  var c = this.c;
  var l = this.src;
  c++;

  switch( l.charCodeAt(c) ) {
  case  CHAR.EQUALITY_SIGN:
    c++;
    this.prec = PREC.OP_ASSIG;
    this. lttype = 'op';
    this.ltraw = '-=';
    break ;

  case  CHAR.MIN:
    c++;
    this.prec = PREC.OO;
    this. lttype = this.ltraw = '--';
    break ;

  default:
    this.ltraw = this.lttype = '-';
    break ;
  }
  this.c=c;
};

module.exports . opLess =  function() {
  var c = this.c;
  var l = this.src;
  this.lttype = 'op';
  c++ ;

  if ( l.charCodeAt(c ) == CHAR.LESS_THAN ) {
    c++;
    if ( l.charCodeAt(c) == CHAR.EQUALITY_SIGN ) {
      c++;
      this. prec = PREC.OP_ASSIG ;
      this. ltraw = '<<=' ;
    }
    else {
      this.ltraw = '<<';
      this. prec = PREC.SH ;
    }
  }
  else  {
    this. prec = PREC.COMP ;
    if ( l.charCodeAt(c) == CHAR.EQUALITY_SIGN ) {
      c++ ;
      this.ltraw = '<=';
    }
    else this.ltraw = '<';
  }

  this.c=c;
};

module.exports . opAdd = function() {
  var c = this.c;
  var l = this.src;
  c++ ;

  switch ( l.charCodeAt(c) ) {
  case CHAR.EQUALITY_SIGN:
    c ++ ;
    this. prec = PREC.OP_ASSIG;
    this. lttype = 'op';
    this.ltraw = '+=';

    break ;

  case CHAR.ADD:
    c++ ;
    this. prec = PREC.OO;
    this. lttype = '--';
    this.ltraw = '++';
    break ;

  default: this. ltraw = '+' ; this. lttype = '-';
  }
  this.c=c;
};

module.exports . opGrea = function()   {
  var c = this.c;
  var l = this.src;
  this.lttype = 'op';
  c++ ;

  if ( l.charCodeAt(c) === CHAR.GREATER_THAN ) {
    c++;
    if ( l.charCodeAt(c) == CHAR.GREATER_THAN ) {
      c++;
      if ( l.charCodeAt(c) == CHAR.EQUALITY_SIGN ) {
        c++ ;
        this. prec = PREC.OP_ASSIG;
        this. ltraw = '>>>=';
      }
      else {
        this. ltraw = '>>>';
        this. prec = PREC.SH;
      }
    }
    else if ( l.charCodeAt(c) === CHAR.EQUALITY_SIGN ) {
      c++ ;
      this. prec = PREC.OP_ASSIG;
      this.ltraw = '>>=';
    }
    else {
      this. prec=  PREC.SH;
      this. ltraw    = '>>';
    }
  }
  else  {
    this. prec = PREC.COMP  ;
    if ( l.charCodeAt(c) == CHAR.EQUALITY_SIGN ) {
      c++ ;
      this. ltraw = '>=';
    }
    else  this. ltraw = '>';
  }
  this.c=c;
};

module.exports.skipS = function() {
  var noNewLine = !false,
    startOffset = this.c,
    c = this.c,
    l = this.src,
    e = l.length,
    start = c;

  while ( c < e ) {
    switch ( l.charCodeAt ( c ) ) {
    case CHAR.WHITESPACE :
      while ( ++c < e &&  l.charCodeAt(c) === CHAR.WHITESPACE );
      continue ;
    case CHAR.CARRIAGE_RETURN : if ( CHAR.LINE_FEED == l.charCodeAt( c + 1 ) ) c ++; break;
    case CHAR.LINE_FEED :
      if ( noNewLine ) noNewLine = false ;
      start = ++ c ;
      this.li ++ ;
      this.col = ( 0);
      continue ;

    case CHAR.VTAB:
    case CHAR.TAB:
    case CHAR.FORM_FEED: c++ ; continue ;

    case CHAR.DIV:
      switch ( l.charCodeAt ( c + ( 1) ) ) {
      case CHAR.DIV:
        c ++ ;
        this.c=c;
        this.readLineComment () ;
        if ( noNewLine ) noNewLine = false ;
        start = c = this.c ;
        continue ;

      case CHAR.MUL:
        c +=  2 ;
        this.col += (c-start ) ;
        this.c = c ;
        noNewLine = this. readMultiComment () && noNewLine ;
        start = c = this.c ;
        continue ;

      default:
        c++ ;
        this.newLineBeforeLookAhead = ! noNewLine ;
        this.col += (c-start ) ;
        this.c=c ;
        this.prec  = 0xAD ;
        this.lttype =  '/';
        this.ltraw = '/' ;
        return !false;
      }

    case 0x0020:case 0x00A0:case 0x1680:case 0x2000:
    case 0x2001:case 0x2002:case 0x2003:case 0x2004:
    case 0x2005:case 0x2006:case 0x2007:case 0x2008:
    case 0x2009:case 0x200A:case 0x202F:case 0x205F:
    case 0x3000:case 0xFEFF: c ++ ; continue ;

    case 0x2028:
    case 0x2029:
      if ( noNewLine ) noNewLine = false ;
      start = ++c ;
      this.col = 0 ;
      this.li ++ ;
      continue;

    case CHAR.LESS_THAN:
      if ( this.isScript &&
        l.charCodeAt(c+1) === CHAR.EXCLAMATION &&
        l.charCodeAt(c+2) === CHAR.MIN &&
        l.charCodeAt(c+ 1 + 2) === CHAR.MIN ) {
        this.c = c + 4;
        this.readLineComment();
        c = this.c;
        continue;
      }
      this.col += (c-start ) ;
      this.c=c;
      this.newLineBeforeLookAhead = !noNewLine ;
      return ;

    case CHAR.MIN:
      if ( (!noNewLine || startOffset === 0) &&
        this.isScript &&
        l.charCodeAt(c+1) === CHAR.MIN && l.charCodeAt(c+2) === CHAR.GREATER_THAN ) {
        this.c = c + 1 + 2;
        this.readLineComment();
        c = this.c;
        continue;
      }
      break;
    default :
      this.col += (c-start ) ;
      this.c=c;
      this.newLineBeforeLookAhead = !noNewLine ;
      return ;
    }
  }

  this.col += (c-start ) ;
  this.c = c ;
  this.newLineBeforeLookAhead = !noNewLine ;
};

module.exports.readDot = function() {
  ++this.c;
  if( this.src.charCodeAt(this.c)==CHAR.SINGLEDOT) {
    if (this.src.charCodeAt(++ this.c) == CHAR.SINGLEDOT) { this.lttype = '...' ;   ++this.c; return ; }
    this.err('Unexpectd ' + this.src[this.c]) ;
  }
  else if ( CTYPE.Num(this.src.charCodeAt(this.c))) {
    this.lttype = 'Literal' ;
    this.c0  = this.c - 1;
    this.li0 = this.li;
    this.col0= this.col ;

    this.frac( -1 ) ;
    return;
  }
  this. ltraw = this.lttype = '.' ;
};

module.exports.readMisc =  function() { this.lttype = this.  src.   charAt (   this.c ++  )    ; };

module.exports.expectType =  function(n)  {
  this.assert(this.lttype === n, 'expected ' + n + '; got ' + this.lttype  )  ;
  this.next();
};

module.exports.expectID =  function(n) {
  this.assert(this.lttype === 'Identifier' && this.ltval === n)  ;
  this.next();
};
