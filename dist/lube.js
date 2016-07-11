(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Parser = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Parser's constructor
 * @param  {string}  src       Source to be parsed. FIXME: string??
 * @param  {boolean} isModule  FIXME: ??
 */
function constructor(src, isModule) {
  this.src = src;

  this.unsatisfiedAssignment = null;
  this.unsatisfiedArg = null;
  this.unsatisfiedLabel = null;

  this.newLineBeforeLookAhead = false;

  this.ltval = null;
  this.lttype = '';
  this.ltraw = '';
  this.prec = 0;
  this.isVDT = false;

  this.labels = {};

  this.li0 = 0;
  this.col0 = 0;
  this.c0 = 0;

  this.li = 1;
  this.col = 0;
  this.c = 0;

  this.canBeStatement = false;
  this.foundStatement = false;
  this.scopeFlags = 0;

  this.isInArgList = false;
  this.argNames = null;
  this.currentFuncName = null;
  this.tight = !!isModule ;

  this.isScript = !isModule;
  this.v = 12 ;

  this.firstParen = null;
  this.firstUnassignable = null;

  this.throwReserved = !false;
}

module.exports.default = module.exports = constructor;

},{}],2:[function(require,module,exports){

var Parser = require('./constructor.js');

function mixin(mainClass, sub) {
  Object.keys(sub).forEach(function (key) {
     mainClass [key] = sub[key];
  });
}

// context is autobound
Parser.prototype.assert = require('./util/assert.js');

mixin(Parser.prototype, require('./prototype/array') );
mixin(Parser.prototype, require('./prototype/arrow') );
mixin(Parser.prototype, require('./prototype/assignment') );
mixin(Parser.prototype, require('./prototype/class') );
mixin(Parser.prototype, require('./prototype/comment') );
mixin(Parser.prototype, require('./prototype/esc-general') );
mixin(Parser.prototype, require('./prototype/esc-unicode') );
mixin(Parser.prototype, require('./prototype/export') );
mixin(Parser.prototype, require('./prototype/for') );
mixin(Parser.prototype, require('./prototype/fundef') );
mixin(Parser.prototype, require('./prototype/identifier') );
mixin(Parser.prototype, require('./prototype/idStatementOrId') );
mixin(Parser.prototype, require('./prototype/import') );
mixin(Parser.prototype, require('./prototype/let') );
mixin(Parser.prototype, require('./prototype/loc') );
mixin(Parser.prototype, require('./prototype/memname') );
mixin(Parser.prototype, require('./prototype/new') );
mixin(Parser.prototype, require('./prototype/nextlookahead') );
mixin(Parser.prototype, require('./prototype/non-assig') );
mixin(Parser.prototype, require('./prototype/number') );
mixin(Parser.prototype, require('./prototype/obj-class-common') );
mixin(Parser.prototype, require('./prototype/obj') );
mixin(Parser.prototype, require('./prototype/pattern') );
mixin(Parser.prototype, require('./prototype/primary') );
mixin(Parser.prototype, require('./prototype/program') );
mixin(Parser.prototype, require('./prototype/regex') );
mixin(Parser.prototype, require('./prototype/semi') );
mixin(Parser.prototype, require('./prototype/spread') );
mixin(Parser.prototype, require('./prototype/statement') );
mixin(Parser.prototype, require('./prototype/string') );
mixin(Parser.prototype, require('./prototype/super') );
mixin(Parser.prototype, require('./prototype/template') );
mixin(Parser.prototype, require('./prototype/validate') );
mixin(Parser.prototype, require('./prototype/var') );
mixin(Parser.prototype, require('./prototype/yield') );

module.exports = Parser;


},{"./constructor.js":1,"./prototype/array":3,"./prototype/arrow":4,"./prototype/assignment":5,"./prototype/class":6,"./prototype/comment":7,"./prototype/esc-general":8,"./prototype/esc-unicode":9,"./prototype/export":10,"./prototype/for":11,"./prototype/fundef":12,"./prototype/idStatementOrId":13,"./prototype/identifier":14,"./prototype/import":15,"./prototype/let":16,"./prototype/loc":17,"./prototype/memname":18,"./prototype/new":19,"./prototype/nextlookahead":20,"./prototype/non-assig":21,"./prototype/number":22,"./prototype/obj":24,"./prototype/obj-class-common":23,"./prototype/pattern":25,"./prototype/primary":26,"./prototype/program":27,"./prototype/regex":28,"./prototype/semi":29,"./prototype/spread":30,"./prototype/statement":31,"./prototype/string":32,"./prototype/super":33,"./prototype/template":34,"./prototype/validate":35,"./prototype/var":36,"./prototype/yield":37,"./util/assert.js":38}],3:[function(require,module,exports){
var PREC = require('../../util/precedence.js');
var CONTEXT = require('../../util/constants.js').CONTEXT;

module.exports.parseArrayExpression = function() {
  var startc = this.c - 1;
  var startLoc = this.locOn(1);
  var elem = null, list = [];

  this.next () ;

  var firstUnassignable = null, firstParen = null;
  var unsatisfiedAssignment = this.unsatisfiedAssignment;

  do {
    this.firstUnassignable = this.firstParen = null;
    this.unsatisfiedAssignment = null ;

    elem = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NULLABLE|CONTEXT.ELEM);

    if (elem) {
      if (!unsatisfiedAssignment && this.unsatisfiedAssignment) {
        unsatisfiedAssignment =  this.unsatisfiedAssignment;
      }
    } else if (this.lttype === '...') {
      elem = this.parseSpreadElement();
    }

    if (!firstParen && this.firstParen){
      firstParen =  this.firstParen ;
    }

    if (!firstUnassignable && this.firstUnassignable) {
      firstUnassignable =  this.firstUnassignable ;
    }

// this is actually crucial for the elision ( i.e., empty ) elements
    if ( this.lttype === ',' ) {
      list.push(elem) ;
      this.next();
    }
    else {
       if ( elem ) list.push(elem);
       break ;
    }
  } while ( true );

  if (firstParen) this.firstParen = firstParen ;
  if (firstUnassignable) this.firstUnassignable = firstUnassignable;

  this.unsatisfiedAssignment = unsatisfiedAssignment;

  elem = {
    type: 'ArrayExpression',
    loc: { start: startLoc, end: this.loc() },
    start: startc,
    end: this.c,
    elements: list
  };

  this.expectType(']');

  return elem;
};

},{"../../util/constants.js":42,"../../util/precedence.js":49}],4:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.asArrowFuncArgList = function(head) {
  if (head === null) return;

  if ( head.type === 'SequenceExpression' ) {
    this.assert(head !== this.firstParen );
    var i = 0, list = head.expressions;
    while ( i < list.length ) {
      this.asArrowFuncArg(list[i]);
      i++;
    }
  } else {
    this.asArrowFuncArg(head);
  }
};

module.exports.asArrowFuncArg = function(arg) {
  var i = 0, list = null;

  switch  ( arg.type ) {
  case 'Identifier':
    this.assert(arg !== this.firstParen )  ;
    return this.addArg(arg);
  case 'ArrayExpression':
    this.assert(arg !== this.firstParen )  ;
    list = arg.elements;
    while ( i < list.length ) {
      if ( list[i] ) {
        this.asArrowFuncArg(list[i]);
        if ( list[i].type === 'SpreadElement' ) {
          i++;
          break;
        }
      }
      i++;
    }
    this.assert( i === list.length );
    arg.type = 'ArrayPattern';
    return;

  case 'AssignmentExpression':
    this.assert(arg !== this.firstParen );
    this.assert(arg.operator === '=' ) ;
    this.asArrowFuncArg(arg.left);
    arg.type = 'AssignmentPattern';
    delete arg.operator ;
    return;

  case 'ObjectExpression':
    this.assert(arg !== this.firstParen    );
    list = arg.properties;
    while ( i < list.length ) this.asArrowFuncArg(list[i++].value );
    arg.type = 'ObjectPattern';
    return;

  case 'AssignmentPattern':
    this.assert(arg !== this.firstParen );
    this.asArrowFuncArg(arg.left) ;
    return;

  case 'ArrayPattern' :
    list = arg.elements;
    while ( i < list.length )
      this.asArrowFuncArg(list[i++] ) ;
    return;

  case 'SpreadElement':
    this.asArrowFuncArg(arg.argument);
    arg.type = 'RestElement';
    return;

  case 'RestElement':
    this.asArrowFuncArg(arg.argument);
    return;

  case 'ObjectPattern':
    list = arg.properties;
    while (i < list.length) this.asArrowFuncArgList ( list[i++].value  );
    return;

  default:
    this.assert(false ) ;
  }
};

module.exports.parseArrowFunctionExpression = function(arg, context) {
  if (this.unsatisfiedArg) this.unsatisfiedArg = null;

  var prevArgNames = this.argNames;
  this.argNames = {};

  var tight = this.tight;

  switch ( arg.type ) {
  case 'Identifier':
    this.asArrowFuncArg(arg, 0)  ;
    break ;
  case CONST.PAREN:
    this.asArrowFuncArgList(core(arg));
    break ;
  default:
    this.assert(false);
  }

  this.next();

  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= ( SCOPE.FUNCTION|SCOPE.METH|SCOPE.CONSTRUCTOR);

  var isExpr = !false, nbody = null;

  if (this.lttype === '{') {
    var prevLabels = this.labels;
    this.labels = {};
    isExpr = false;
    nbody = this.parseFuncBody(CONTEXT.NONE);
    this.labels = prevLabels;
  }
  else
    nbody = this. parseNonSeqExpr(PREC.WITH_NO_OP, context) ;

  this.argNames = prevArgNames;
  this.scopeFlags = scopeFlags;

  var params = core(arg);

  this.tight = tight;

  return {
    type: 'ArrowFunctionExpression',
    params: params ? (
      params.type === 'SequenceExpression' ?params.expressions : [params]
    ) : [],
    start: arg.start,
    end: nbody.end,
    loc: { start: arg.loc.start, end: nbody.loc.end },
    generator: false,
    expression: isExpr,
    body: core(nbody),
    id : null
  };
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],5:[function(require,module,exports){
var arguments_or_eval = require('../../util/arguments_or_eval.js');
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.ensureSimpAssig = function(head) {
  switch(head.type) {
  case 'Identifier':
    this.assert( !( this.tight && arguments_or_eval(head.name) )  );
    break;
  case 'MemberExpression':
    return;

  default:
    this.assert(false);
  }
};

// an arr-pat is always to the left of an assig;
module.exports.toAssig = function(head) {

  var i = 0;
  var list = null;

  switch(head.type) {
  case 'Identifier':
    this.assert( !(this.tight && arguments_or_eval(head.name)) );
    break;
  case 'MemberExpression':
    return;

  case 'ObjectExpression':
    this.assert(head !== this.firstUnassignable )  ;
    list = head.properties;
    while ( i < list.length ) {
      this.toAssig(list[i].value);
      list[i].type = 'AssignmentProperty';
      i++;
    }
    head.type = 'ObjectPattern';
    return;

  case 'ArrayExpression':
    this.assert(head !== this.firstUnassignable )  ;
    list = head.elements;
    while ( i < list.length ) {
      if ( list[i] ) {
        this.toAssig(list[i]);
        if ( list[i].type === 'SpreadElement' ) {
          i++;
          break ;
        }
      }
      i++;
    }
    this.assert( i === list.length );
    head.type = 'ArrayPattern';
    return;

  case 'AssignmentExpression':
    this.assert(head !== this.firstUnassignable ) ;
    this.assert(head.operator === '='  ) ;
    head.type = 'AssignmentPattern';
    delete head.operator;
    return;

  case 'SpreadElement':
    this.toAssig(head.argument);
    head.type = 'RestElement';
    return;

  case 'AssignmentPattern': // this would be the case in the event of converting an obj prop in the form of "name = val" rather than "name: val"
    return;

  default:
    this.assert(false ) ;
  }
};

module.exports.parseAssignment = function(head, context ) {
  var o = this.ltraw;
  if ( o === '=' ) this.toAssig(core(head));
  else if ( o === '=>' )
    return this.parseArrowFunctionExpression (head, context);
  else this.ensureSimpAssig(core(head));

  if ( this.unsatisfiedAssignment ) {
    this.assert( this.prec === PREC.SIMP_ASSIG ) ;
    this.unsatisfiedAssignment = false ;
  }

  // var prec = this.prec;
  this.next();

  var right = this. parseNonSeqExpr(PREC.WITH_NO_OP, context ) ;
  return { type: 'AssignmentExpression', operator: o, start: head.start, end: right.end,
           left: core(head), right: core(right), loc: { start: head.loc.start, end: right.loc.end }};
};

},{"../../util/arguments_or_eval.js":39,"../../util/core.js":43,"../../util/precedence.js":49}],6:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');

module.exports.parseClass = function(context) {
  var startc = this.c0;
  var startLoc = this.locBegin();

  var canBeStatement = this.canBeStatement, name = null;
  this.next();

  if (canBeStatement && context !== CONTEXT.DEFAULT) {
    this.canBeStatement = false;
    this.assert ( this.lttype === 'Identifier' );
    name = this. validateID(null);
  } else if ( this.lttype === 'Identifier' && this.ltval !== 'extends' ) {
    name = this.validateID(null);
  }

  var classExtends = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'extends' ) {
    this.next();
    classExtends = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE);
  }

  var list = [];
  var nbodyStartc = this.c - 1, nbodyStartLoc = this.locOn(1);

  this.expectType ( '{' ) ;
  var elem = null, foundConstructor = false;

  var startcStatic, liStatic, colStatic, rawStatic, cStatic, startLocStatic;
  var isStatic = false;

  WHILE:
  while (!false) { // eslint-disable-line no-constant-condition
    if ( this.lttype === 'Identifier' && this.ltval === 'static' ) {
      startcStatic = this.c0;
      rawStatic = this.ltraw;
      colStatic = this.col;
      liStatic = this.li;
      cStatic = this.c;
      startLocStatic = this.locBegin();

      this.next();

      if ( this.lttype === '(' ) {
        elem = this.parseMeth({
          type: 'Identifier', name: 'static', start: startcStatic,
          end: cStatic, raw: rawStatic, loc: { start: startLocStatic, end: {
            line: liStatic, column: colStatic
          }}
        }, !CONST.OBJ_MEM);
        list.push(elem);
        continue;
      }
      isStatic = !false;
    }

    SWITCH:
    switch ( this.lttype ) {
    case 'Identifier':
      switch ( this.ltval ) {
      case 'get': case 'set':
        elem = this.parseSetGet(!CONST.OBJ_MEM);
        break SWITCH;
      case 'constructor':
        this.assert( !foundConstructor );
        if ( !isStatic ) foundConstructor = !false;
        // fall through
      default:
        elem = this.parseMeth(this.id(), !CONST.OBJ_MEM);
        break SWITCH;
      }

    case '[':
      elem = this.parseMeth(this.memberExpr(), !CONST.OBJ_MEM);
      break SWITCH;

    case 'Literal':
      elem = this.parseMeth(this.numstr(), !CONST.OBJ_MEM);
      break SWITCH;

    case ';':
      this.next();
      continue;

    case 'op':
      if ( this.ltraw === '*' ) {
        elem = this.parseGen(!CONST.OBJ_MEM);
      }
      break SWITCH;

    default:
      break WHILE;
    }

    if ( isStatic ) {
      if ( elem.kind === 'constructor')
        elem.kind = 'method';

      elem.start = startcStatic;
      elem.loc.start = startLocStatic;
      elem['static'] = !false;
      isStatic = false;
    }

    list.push(elem);
  }

  var endLoc = this.loc();
  var n = {
    type: canBeStatement ? 'ClassDeclaration' : 'ClassExpression',
    id: name,
    start: startc,
    end: this.c,
    superClass: classExtends,
    loc: { start: startLoc, end: endLoc },
    body: {
      type: 'ClassBody',
      loc: { start: nbodyStartLoc, end: endLoc },
      start: nbodyStartc,
      end: this.c,
      body: list
    }
  };

  this.expectType('}');
  if (canBeStatement) { this.foundStatement = !false; }

  return n;
};

},{"../../util/constants.js":42,"../../util/precedence.js":49}],7:[function(require,module,exports){
var CHAR = require('../../util/char.js');

module.exports.readMultiComment = function() {
  var c = this.c, src = this.src, start = c;
  var len = src.length; // FIXME: l is not defined..

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
  var len = src.length; 

  WHILE:
  while ( c < len ) {
    switch ( src.charCodeAt(c++) ) {
    case CHAR.CARRIAGE_RETURN:
      if (CHAR.LINE_FEED == src.charCodeAt(c)) c++;
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

},{"../../util/char.js":40}],8:[function(require,module,exports){
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

},{"../../util/char.js":40,"../../util/fromcode.js":46,"../../util/toNum.js":50}],9:[function(require,module,exports){
var CHAR = require('../../util/char.js');
var toNum = require('../../util/toNum.js');

module.exports.peekTheSecondByte = function() {
  var e = this.src.charCodeAt(this.c);
  if (CHAR.BACK_SLASH === e) {
    this.assert(CHAR.u !== this.src.charCodeAt(++this.c));
    e = this.peekUSeq();
  }
//else this.col--;
  this.assert (e >= 0x0DC00 || e <= 0x0DFFF );

  return e;
};

module.exports.peekUSeq = function() {
  var c = ++this.c, l = this.src, e = l.length;
  var byteVal = 0;
  var n = l.charCodeAt(c);
  if (CHAR.LCURLY === n) { // u{
    ++c;
    n = l.charCodeAt(c);
    do {
      n = toNum(n);
      this.assert (n !== - 1);
      byteVal <<= 4;
      byteVal += n;
      this.assert (byteVal <= 0x010FFFF );
      n = l.charCodeAt( ++ c);
    } while (c < e && n !== CHAR.RCURLY);

    this.assert ( n === CHAR.RCURLY ) ;
    this.c = c;
    return byteVal;
  }

  n = toNum(l.charCodeAt(c)); this.assert( n !== -1 ); byteVal = n; c++ ;
  n = toNum(l.charCodeAt(c)); this.assert( n !== -1 ); byteVal <<= 4; byteVal += n; c++ ;
  n = toNum(l.charCodeAt(c)); this.assert( n !== -1 ); byteVal <<= 4; byteVal += n; c++ ;
  n = toNum(l.charCodeAt(c)); this.assert( n !== -1 ); byteVal <<= 4; byteVal += n;

  this.c = c;

  return byteVal;
};

},{"../../util/char.js":40,"../../util/toNum.js":50}],10:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseExport = function() {
  this.assert( this.canBeStatement );
  this.canBeStatement = false;

  var startc = this.c0, startLoc = this.locBegin();
  this.next();

  var list = [], local = null, src = null ;
  var endI = 0;
  var ex = null;

  switch ( this.lttype ) {
  case 'op':
    this.assert(this.ltraw === '*' );
    this.next();
    this.expectID('from');
    this.assert(this.lttype === 'Literal' &&
        typeof this.ltval === CONST.STRING_TYPE );
    src = this.numstr();

    endI = this.semiI();
    this.foundStatement = !false;

    return  { type: 'ExportAllDeclaration',
              start: startc,
              loc: { start: startLoc, end: this.semiLoc() || src.loc.end },
                end: endI || src.end,
              source: src };

  case '{':
    this.next();
    var firstReserved = null;

    while ( this.lttype === 'Identifier' ) {
      local = this.id();
      if ( !firstReserved ) {
        this.throwReserved = false;
        this.validateID(local.name);
        if ( this.throwReserved )
          firstReserved = local;
        else
          this.throwReserved = !false;
      }
      ex = local;
      if ( this.lttype === 'Identifier' ) {
        this.assert( this.ltval === 'as' );
        this.next();
        this.assert( this.lttype === 'Identifier' );
        ex = this.id();
      }
      list.push({ type: 'ExportSpecifier',
                  start: local.start,
                  loc: { start: local.loc.start, end: ex.loc.end },
                  end: ex.end, exported: ex,
                  local: local }) ;

      if ( this.lttype === ',' )
        this.next();
      else
        break;
    }

    endI = this.c;
    var li = this.li, col = this.col;

    this.expectType( '}' );

    if ( this.lttype === 'Identifier' ) {
      this.assert( this.ltval === 'from' );
      this.next();
      this.assert( this.lttype === 'Literal' &&
            typeof this.ltval ===  CONST.STRING_TYPE );
      src = this.numstr();
      endI = src.end;
    }
    else
      this.assert(!firstReserved);

    endI = this.semiI() || endI;

    this.foundStatement = !false;
    return { type: 'ExportNamedDeclaration',
            start: startc,
            loc: { start: startLoc, end: this.semiLoc() || ( src && src.loc.end ) ||
                                        { line: li, column: col } },
            end: endI, declaration: null,
              specifiers: list,
            source: src };

  }

  var context = CONTEXT.NONE;

  if ( this.lttype === 'Identifier' &&
      this.ltval === 'default' ) { context = CONTEXT.DEFAULT; this.next(); }

  if ( this.lttype === 'Identifier' ) {
    switch ( this.ltval ) {
    case 'let':
    case 'const':
      this.assert(context !== CONTEXT.DEFAULT );
      this.canBeStatement = !false;
      ex = this.parseVariableDeclaration(CONTEXT.NONE);
      break;

    case 'class':
      this.canBeStatement = !false;
      ex = this.parseClass(context);
      break;

    case 'var':
      this.canBeStatement = !false;
      ex = this.parseVariableDeclaration(CONTEXT.NONE ) ;
      break ;

    case 'function':
      this.canBeStatement = !false;
      ex = this.parseFunc( context, CONST.WHOLE_FUNCTION, CONST.ANY_ARG_LEN );
      break ;
    }
  }

  if ( context !== CONTEXT.DEFAULT ) {

    this.assert(ex);
    endI = this.semiI();

    this.foundStatement = !false;
    return { type: 'ExportNamedDeclaration',
          start: startc,
          loc: { start: startLoc, end: ex.loc.end },
            end: ex.end , declaration: ex,
            specifiers: list ,
            source: null };
  }

  var endLoc = null;
  if ( ex === null ) {
    ex = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE );
    endI = this.semiI();
    endLoc = this.semiLoc();
  }

  this.foundStatement = !false;
  return { type: 'ExportDefaultDeclaration',
          start: startc,
          loc: { start: startLoc, end: endLoc || ex.loc.end },
          end: endI || ex.end, declaration: core( ex ) };
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],11:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseFor = function() {
  this.ensureStmt();
  this.fixupLabels(!false) ;

  var startc = this.c0, startLoc = this.locBegin();

  this.next () ;
  this.expectType('(' ) ;

  var head = null;
  var headIsExpr = false;

  var scopeFlags = this.scopeFlags;

  if ( this.lttype === 'Identifier' ) switch ( this.ltval ) {
  case 'var':
    this.canBeStatement = !false;
    head = this.parseVariableDeclaration(CONTEXT.FOR);
    break;

  case 'let':
    if ( this.v >= 5 ) {
      this.canBeStatement = !false;
      head = this.parseLet(CONTEXT.FOR);
    }
    break;

  case 'const':
    this.assert( this.v >= 5 );
    this.canBeStatement = !false;
    head = this. parseVariableDeclaration(CONTEXT.FOR);
    break;
  }

  if ( head === null ) {
    headIsExpr = !false;
    head = this.parseExpr(CONTEXT.NULLABLE|CONTEXT.ELEM|CONTEXT.FOR) ;
  }
  else
    this.foundStatement = false;

  var kind = 'ForOfStatement';
  var nbody = null;
  var afterHead = null;

  if ( head !== null && // if we have a head
      ( headIsExpr || // that is an expression
      (head.declarations.length === 1 /* && !head.declarations[0].init */ ) ) && // or one and only one lone declarator
      this.lttype === 'Identifier' ) { // then if the token ahead is an id
    switch ( this.ltval ) {
    case 'in':
      kind = 'ForInStatement';
      // fall through

    case 'of':
      if ( this.unsatisfiedAssignment )
        this.unsatisfiedAssignment = null;

      if (headIsExpr) this.toAssig(core(head));

      this.next();
      afterHead = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE) ;
      this.expectType(')');

      this.scopeFlags |= ( SCOPE.BREAK|SCOPE.CONTINUE );
      nbody = this.parseStatement(false);
      this.scopeFlags = scopeFlags;

      this.foundStatement = !false;
      return { type: kind, loc: { start: startLoc, end: nbody.loc.end },
        start: startc, end: nbody.end, right: core(afterHead), left: core(head), body: nbody };

    default:
      this.assert(false);
    }
  }

  this.assert(!this.unsatisfiedAssignment);
/*
  if ( head && !headIsExpr ) {
    head.end = this.c;
    head.loc.end = { line: head.loc.end.line, column: this.col };
  }
*/
  this.expectType(';');
  afterHead = this.parseExpr(CONTEXT.NULLABLE );
  this.expectType(';');
  var tail = this.parseExpr(CONTEXT.NULLABLE );
  this.expectType(')');

  this.scopeFlags |= ( SCOPE.CONTINUE|SCOPE.BREAK );
  nbody = this.parseStatement(false);
  this.scopeFlags = scopeFlags;

  this.foundStatement = !false;
  return { type: 'ForStatement', init: head && core(head), start : startc, end: nbody.end,
        test: afterHead && core(afterHead),
        loc: { start: startLoc, end: nbody.loc.end },
          update: tail && core(tail),
        body: nbody };
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],12:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;
var PREC = require('../../util/precedence.js');
var arguments_or_eval = require('../../util/arguments_or_eval');
var has = require('../../util/has.js');

module.exports.parseArgs = function(argLen) {
  var list = [], elem = null;

  this.expectType('(') ;
  while ( list.length !== argLen ) {
    elem = this.parsePattern();
    if ( elem ) {
      if ( this.lttype === 'op' && this.ltraw === '=' )
        elem = this.parseAssig(elem);

      list.push(elem);
    }
    else
      break ;

    if ( this.lttype === ',' )
      this.next();
    else
        break ;

  }
  if ( argLen === CONST.ANY_ARG_LEN ) {
    if ( this.lttype === '...' )
      list.push( this.parseRestElement() );
  }
  else
    this.assert( list.length === argLen );

  this.expectType(')');

  return list;
};

module.exports.addArg = function(id) {
  var name = id.name + '%';
  if (has.call(this.argNames, name)) {
    this.assert( !this.tight );
    if ( this.argNames[name] === null )
      this.argNames[name] = id ;
  }
  else
    this.argNames[name] = null ;
};

module.exports.parseFunc = function(context, argListMode, argLen ) {
  var canBeStatement = false, startc = this.c0, startLoc = this.locBegin();
  var prevLabels = this.labels;
  var prevStrict = this.tight;
  var prevFuncName = this.currentFuncName;
  var prevInArgList = this.isInArgList;
  var prevArgNames = this.argNames;
  var prevScopeFlags = this.scopeFlags;

  this.scopeFlags = 0;

  var isGen = false;
  if (argListMode & CONST.WHOLE_FUNCTION) {
    if ((canBeStatement = this.canBeStatement))
      this.canBeStatement = false;

    this.next();

    if ( this.lttype === 'op' && this.ltraw === '*' ) {
      isGen = !false;
      this.next();
    }
    if ( canBeStatement && context !== CONTEXT.DEFAULT  )  {
      this.assert( this.lttype === 'Identifier' ) ;
      this.currentFuncName = this.validateID(null);
    }
    else if ( this. lttype == 'Identifier' )
      this.currentFuncName = this.validateID(null);
    else
      this.currentFuncName = null;
  }
  else if ( argListMode & CONST.ARGLIST_AND_BODY_GEN )
    isGen = !false;

  this.isInArgList = !false;
  this.argNames = {};
  var argList = this.parseArgs(argLen) ;
  this.isInArgList = false;
  this.tight = this.tight || argListMode !== CONST.WHOLE_FUNCTION;
  this.scopeFlags = SCOPE.FUNCTION;
  if ( argListMode & CONST.METH_FUNCTION )
    this.scopeFlags |= SCOPE.METH;

  else if ( argListMode & CONST.CONSTRUCTOR_FUNCTION )
    this.scopeFlags |= SCOPE.CONSTRUCTOR;

  if ( isGen ) this.scopeFlags |= SCOPE.YIELD;

  var nbody = this.parseFuncBody(context);
  var n = { type: canBeStatement ? 'FunctionDeclaration' : 'FunctionExpression',
            id: this.currentFuncName,
          start: startc,
          end: nbody.end,
          generator: isGen,
          body: nbody,
            loc: { start: startLoc, end: nbody.loc.end },
          expression: nbody.type !== 'BlockStatement' ,
            params: argList };

  if ( canBeStatement )
    this.foundStatement = !false;

  this.labels = prevLabels;
  this.isInArgList = prevInArgList;
  this.currentFuncName = prevFuncName;
  this.argNames = prevArgNames;
  this.tight = prevStrict;
  this.scopeFlags = prevScopeFlags;

  return  n  ;
};

module.exports.parseFuncBody = function(context) {
  if ( this.lttype !== '{' )
    return this.parseNonSeqExpr(PREC.WITH_NO_OP, context);

  var startc= this.c - 1, startLoc = this.locOn(1);
  var list = [], stmt = null;
  this.next() ;
  stmt = this.parseStatement(!false);

  if ( !this.tight && this.v > 5 && stmt &&
    stmt.type === 'ExpressionStatement' && stmt.expression.type === 'Literal' )
    switch (this.src.slice(stmt.expression.start,stmt.expression.end) )  {
    case '\'use strict\'':
    case '\"use strict\"':
      this.makeStrict();
    }

  while ( stmt ) { list.push(stmt); stmt = this.parseStatement(!false); }
  var n = { type : 'BlockStatement', body: list, start: startc, end: this.c,
          loc: { start: startLoc, end: this.loc() } };
  this.expectType ( '}' );

  return  n;
};

module.exports.makeStrict  = function() {
  if ( this.tight ) return;

  this.tight = !false;
  if ( this.currentFuncName ) {
    this.assert(!arguments_or_eval(this.currentFuncName));
    this.validateID(this.currentFuncName.name) ;
  }

  var argName = null;
  for ( argName in this.argNames ) {
    this.assert( this.argNames[argName] === null );
    argName = argName.substring(0,argName.length-1) ;
    this.assert(!arguments_or_eval(argName));
    this.validateID(argName);
  }
};

},{"../../util/arguments_or_eval":39,"../../util/constants.js":42,"../../util/has.js":47,"../../util/precedence.js":49}],13:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;

module.exports.notId = function(id) {
  throw new Error ('not a valid id ' + id);
};

module.exports.parseIdStatementOrId =  function( context ) {
  var id = this.ltval ;
  var pendingExprHead = null;

  SWITCH:
  switch (id.length) {
  case 1:
    pendingExprHead = this.id(); break SWITCH ;

  case 2:
    switch (id) {
    case 'do': return this.parseDoWhileStatement();
    case 'if': return this.parseIfStatement();
    case 'in':
      if ( context & CONTEXT.FOR )
        return null;

      this.notId() ;
      break;
    default: pendingExprHead = this.id(); break SWITCH ;
    }
    break;
  case 3:
    switch (id) {
    case 'new':
      if ( this.canBeStatement ) {
        this.canBeStatement = false ;
        this.pendingExprHead = this.parseNewHead();
        return null;
      }
      return this.parseNewHead();

    case 'for': return this.parseFor();
    case 'try': return this.parseTryStatement();
    case 'let':
      if ( this.canBeStatement && this.v >= 5 )
        return this.parseLet(CONTEXT.NONE);

      this.assert(!this.tight);
      pendingExprHead = this.id();
      break SWITCH;

    case 'var': return this.parseVariableDeclaration( context & CONTEXT.FOR );
    case 'int':
      if ( this.v <= 5 )
        this.errorReservedID();
      // fall through

    default: pendingExprHead = this.id(); break SWITCH;
    }
    break;
  case 4:
    switch (id) {
    case 'null':
      pendingExprHead = this.idLit(null);
      break SWITCH;
    case 'void':
      if ( this.canBeStatement )
        this.canBeStatement = false;
      this.lttype = 'u';
      this.isVDT = !false;
      return null;
    case 'this':
      pendingExprHead = this. parseThis();
      break SWITCH;
    case 'true':
      pendingExprHead = this.idLit(!false);
      break SWITCH;
    case 'case':
      if ( this.canBeStatement ) this.canBeStatement = false ;
      return null;

    case 'else':
      this.notId();
      break;
    case 'with':
      return this.parseWithStatement();
    case 'enum': case 'byte': case 'char': case 'goto':
    case 'long':
      if ( this. v <= 5 ) this.errorReservedID();
      break;
    default: pendingExprHead = this.id(); break SWITCH  ;
    }
    break;
  case 5:
    switch (id) {
    case 'super': pendingExprHead = this.parseSuper(); break SWITCH;
    case 'break': return this.parseBreakStatement();
    case 'catch': this.notId (); break;
    case 'class': return this.parseClass(CONTEXT.NONE ) ;
    case 'const':
      this.assert(this.v>=5);
      return this.parseVariableDeclaration(CONTEXT.NONE);

    case 'throw': return this.parseThrowStatement();
    case 'while': return this.parseWhileStatement();
    case 'yield':
      if ( this.scopeFlags & SCOPE.YIELD ) {
        if ( this.canBeStatement )
          this.canBeStatement = false;

        this.lttype = 'yield';
        return null;
      }

      pendingExprHead = this.id();
      break SWITCH;

    case 'false':
      pendingExprHead = this.idLit(false);
      break  SWITCH;
    case 'final':
    case 'float':
    case 'short':
      if ( this. v <= 5 ) this.errorReservedID() ;
      break;
    case 'await':
    default: pendingExprHead = this.id(); break SWITCH ;
    }
    break;
  case 6:
    switch (id) {
    case 'static':
      if ( this.tight || this.v <= 5 )
        this.error();
      break;
    case 'delete':
    case 'typeof':
      if ( this.canBeStatement )
        this.canBeStatement = false ;
      this.lttype = 'u';
      this.isVDT = !false;
      return null;

    case 'export':
      this.assert( !this.isScript );
      return this.parseExport() ;

    case 'import':
      this.assert( !this.isScript );
      return this.parseImport();

    case 'return': return this.parseReturnStatement();
    case 'switch': return this.parseSwitchStatement();
    case 'double': case 'native': case 'throws':
      if ( this. v <= 5 ) this.errorReservedID();
      break;
    default:
      pendingExprHead = this.id();
      break SWITCH ;
    }
    break;
  case 7:
    switch (id) {
    case 'default':
      if ( this.canBeStatement ) this.canBeStatement = false ;
      return null;

    case 'extends': case 'finally':
      this.notId() ;
      break;
    case 'package': case 'private':
      if ( this. tight  )
        this.errorReservedID();
      break;
    case 'boolean':
      if ( this. v <= 5 )
        this.errorReservedID();
      break;
    default:
      pendingExprHead = this.id();
      break SWITCH  ;
    }
    break;
  case 8:
    switch (id) {
    case 'function': return this.parseFunc(CONTEXT.FOR, CONST.WHOLE_FUNCTION,  CONST.ANY_ARG_LEN );
    case 'debugger': return this.prseDbg();
    case 'continue': return this.parseContinueStatement();
    case 'abstract': case 'volatile':
      if ( this. v <= 5 ) this.errorReservedID();
      break;
    default:
      pendingExprHead = this.id();
      break SWITCH  ;
    }
    break;
  case 9:
    switch (id ) {
    case 'interface': case 'protected':
      if (this.tight) this.errorReservedID() ;
      break;
    case 'transient':
      if (this.v <= 5) this.errorReservedID();
      break;
    default:
      pendingExprHead = this.id();
      break SWITCH  ;
    }
    break;
  case 10:
    switch ( id ) {
    case 'instanceof':
      this.notId();
      break;
    case 'implements':
      if ( this.v <= 5 || this.tight ) this.resv();
      break;
    default:
      pendingExprHead = this.id(); break SWITCH ;
    }
    break;
  case 12:
    if ( this.v <= 5 && id === 'synchronized' ) this.errorReservedID();
    // fall through
  default:
    pendingExprHead = this.id();
  }

  if ( this.canBeStatement ) {
    this.canBeStatement = false;
    this.pendingExprHead = pendingExprHead;
    return null;
  }

  return pendingExprHead;
};

},{"../../util/constants.js":42}],14:[function(require,module,exports){
var CHAR = require('../../util/char.js');
var CTYPE = require('../../util/ctype.js');
var fromcode = require('../../util/fromcode.js');

module.exports.readAnIdentifierToken =  function(v) {
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
    if ( CTYPE.isIDBody(peek) ) {
      c++;
      continue;
    }

    if ( peek === CHAR.BACK_SLASH ) {
      if ( !v ) // if all previous characters have been non-u characters
        v = src.charAt (startSlice-1); // v = IDHead

      if ( startSlice < c ) // if there are any non-u characters behind the current '\'
        v += src.slice(startSlice,c) ; // v = v + those characters

      this.c = ++c;
      this.assert (CHAR.u === src.charCodeAt(c) );

      peek = this. peekUSeq() ;
      if (peek >= 0x0D800 && peek <= 0x0DBFF ) {
        this.c++;
        byte2 = this.peekTheSecondByte();
        this.assert(CTYPE.isIDBody(((peek-0x0D800)<<10) + (byte2-0x0DC00) + 0x010000));
        v += String.fromCharCode(peek, byte2);
      }
      else {
        this.assert(CTYPE.isIDBody(peek));
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
      this.assert(CTYPE.isIDBody(((peek-0x0D800 ) << 10) + (byte2-0x0DC00) + 0x010000));
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

},{"../../util/char.js":40,"../../util/ctype.js":44,"../../util/fromcode.js":46}],15:[function(require,module,exports){
var CONST = require('../../util/constants.js');

module.exports.parseImport = function() {
  this.assert( this.canBeStatement );
  this.canBeStatement = false;

  var startc = this.c0, startLoc = this.locBegin();
  var hasList = false;
  this.next();
  var list = [], local = null;
  if ( this.lttype === 'Identifier' ) {
    local = this.validateID(null);
    list.push({ type: 'ImportDefaultSpecifier',
              start: local.start,
              loc: local.loc,
                end: local.end,
              local: local });
  }

  if ( this.lttype === ',' ) {
    this.assert(local !== null);
    this.next();
  }

  var spStartc = 0, spStartLoc = null;

  switch ( this.lttype ) {
  case 'op':
    this.assert( this.ltraw === '*' );
    spStartc = this.c - 1;
    spStartLoc = this.locOn(1);
    this.next();
    this.expectID('as');
    this.assert(this.lttype === 'Identifier');
    local = this.validateID(null);
    list.push({ type: 'ImportNamespaceSpecifier',
                start: spStartc,
                loc: { start: spStartLoc, end: local.loc.end },
                end: local.end,
                local: local  }) ;
    break;

  case '{':
    hasList = !false;
    this.next();
    while ( this.lttype === 'Identifier' ) {
      local = this.id();
      var im = local;
      if ( this.lttype === 'Identifier' ) {
        this.assert( this.ltval === 'as' );
        this.next();
        this.assert( this.lttype === 'Identifier' );
        local = this.validateID(null);
      }
      else this.validateID(local);

      list.push({ type: 'ImportSpecifier',
                start: im.start,
                loc: { start: im.loc.start, end: local.loc.end },
                  end: local.end, imported: im,
                local: local }) ;

      if ( this.lttype === ',' )
        this.next();
      else
        break ;
    }

    this.expectType('}');
    break ;
  }

  if ( list.length || hasList )
    this.expectID('from');

  this.assert(this.lttype === 'Literal' &&
        typeof this.ltval === CONST.STRING_TYPE );

  var src = this.numstr();
  var endI = this.semiI() || src.end, endLoc = this.semiLoc() || src.loc.end;

  this.foundStatement = !false;
  return { type: 'ImportDeclaration',
          start: startc,
          loc: { start: startLoc, end: endLoc  },
            end:  endI , specifiers: list,
          source: src };
};

},{"../../util/constants.js":42}],16:[function(require,module,exports){

module.exports.parseLet = function(context) {

// this function is only calld when we have a 'let' at the start of an statement,
// or else when we have a 'let' at the start of a for's init; so, CONTEXT_FOR means "at the start of a for's init ",
// not 'in for'

  var startc = this.c0, startLoc = this.locBegin();
  var c = this.c, li = this.li, col = this.col;

  var letDecl = this.parseVariableDeclaration(context);

  if ( letDecl )
    return letDecl;

  this.assert(!this.tight);

  this.canBeStatement = false;
  this.pendingExprHead = {
    type: 'Identifier',
    name: 'let',
    start: startc,
    end: c,
    loc: { start: startLoc, end: { line: li, column: col } }
  };

  return null ;
};

},{}],17:[function(require,module,exports){
module.exports.loc = function() { return { line: this.li, column: this.col }; };
module.exports.locBegin = function() { return  { line: this.li0, column: this.col0 }; };
module.exports.locOn = function(l) { return { line: this.li, column: this.col - l }; };



},{}],18:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;

module.exports .memberID = function() { return this.v > 5 ? this.id() : this.validateID(null) ; };
module.exports .memberExpr = function() {
  var startc = this.c - 1, startLoc = this.locOn(1);
  this.next() ;
  var e = this.parseExpr(CONTEXT.NONE);
  this.assert(e);
  var n = { type: CONST.PAREN, expr: e, start: startc, end: this.c, loc: { start: startLoc, end: this.loc() } } ;
  this.expectType (']');
  return n;
};

},{"../../util/constants.js":42}],19:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var core = require('../../util/core.js');

module.exports.parseNewHead = function() {
  var startc = this.c0, end = this.c, startLoc = this.locBegin(), li = this.li, col = this.col, raw = this.ltraw ;
  this.next () ;
  if ( this.lttype === '.' ) {
    this.next();
    return this.parseMeta(startc ,end,startLoc,{line:li,column:col},raw );
  }

  var head, elem, inner;
  switch (this  .lttype) {
  case 'Identifier':
    head = this.parseIdStatementOrId (CONTEXT.NONE);
    this.assert(head);
    break;

  case '[':
    head = this. parseArrayExpression();
    this.assert(!this.unsatisfiedAssignment);
    break ;

  case '(':
    head = this. parseParen() ;
    this.assert(!this.unsatisfiedArg ) ;
    break ;

  case '{':
    head = this. parseObjectExpression() ;
    this.assert(!this.unsatisfiedAssignment);
    break ;

  case '/':
    head = this. parseRegExpLiteral () ;
    break ;

  case '`':
    head = this. parseTemplateLiteral () ;
    break ;

  case 'Literal':
    head = this.numstr ();
    break ;

  default: this.assert(false) ;
  }

  inner = core( head );
  while ( !false ) { // eslint-disable-line no-constant-condition
    switch (this. lttype) {
    case '.':
      this.next();
      elem = this.memberID();
      head =   {  type: 'MemberExpression', property: elem, start: head.start, end: elem.end,
                  loc: { start: head.loc.start, end: elem.loc.end }, object: inner, computed: false };
      inner = head;
      continue;

    case '[':
      this.next() ;
      elem = this.parseExpr(CONTEXT.NONE) ;
      head =  { type: 'MemberExpression', property: core(elem), start: head.start, end: this.c,
                loc: { start : head.loc.start, end: this.loc() }, object: inner, computed: !false };
      inner = head ;
      this.expectType(']') ;
      continue;

    case '(':
      elem = this. parseArgList();
      inner = { type: 'NewExpression', callee: inner, start: startc, end: this.c,
                loc: { start: startLoc, end: this.loc() }, arguments: elem };
      this. expectType (')');
      return inner;

    case '`' :
      elem = this.parseTemplateLiteral () ;
      head = {
        type : 'TaggedTemplateExpression' ,
        quasi :elem ,
        start: head.start,
        end: elem.end,
        loc : { start: head.loc.start, end: elem.loc.end },
        tag : inner
      };
      inner = head;
      continue ;

    default:
      return { type: 'NewExpression', callee: inner, start: startc, end: head.end, loc: { start: startLoc, end: head.loc.end }, arguments : [] };
    }
  }
};

},{"../../util/constants.js":42,"../../util/core.js":43}],20:[function(require,module,exports){
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
    case CHAR.CARRIAGE_RETURN : if ( CHAR.LINE_FEED == l.charCodeAt( c + 1 ) ) c ++;
    // fall through

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
      // fall through

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

},{"../../util/char.js":40,"../../util/ctype.js":44,"../../util/fromcode.js":46,"../../util/precedence.js":49}],21:[function(require,module,exports){
var CHAR = require('../../util/char.js');
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseExpr =  function(context) {
  var head = this.parseNonSeqExpr(PREC.WITH_NO_OP,context );
  if ( this.unsatisfiedAssignment ) {
    this.assert( context & CONTEXT.ELEM ) ;
    return head;
  }

  var lastExpr;
  if ( this.lttype === ',' ) {
    context &= CONTEXT.FOR;

    var e = [core(head)] ;
    do {
      this.next() ;
      lastExpr = this.parseNonSeqExpr(PREC.WITH_NO_OP,context);
      e.push(core(lastExpr));
    } while (this.lttype === ',' ) ;

    return  { type: 'SequenceExpression', expressions: e, start: head.start, end: lastExpr.end,
              loc: { start : head.loc.start, end : lastExpr.loc.end} };
  }

  return head ;
};

module.exports .parseCond = function(cond,context ) {
  this.next();
  var con = this. parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE ) ;
  this.expectType(':');
  var alt = this. parseNonSeqExpr(PREC.WITH_NO_OP, context ) ;
  return { type: 'ConditionalExpression', test: core(cond), start: cond.start , end: alt.end ,
          loc: { start: cond.loc.start, end: alt.loc.end }, consequent: core(con), alternate: core(alt) };
};

module.exports .parseUnaryExpression = function(context ) {
  var u = null, startLoc = null, startc = 0;
  if ( this.isVDT ) {
    this.isVDT = false;
    u = this.ltval;
    startLoc = this.locBegin();
    startc = this.c0;
  }
  else {
    u = this.ltraw;
    startLoc = this.locOn(1);
    startc = this.c - 1;
  }

  this.next();
  var arg = this. parseNonSeqExpr(PREC.U,context );

  return { type: 'UnaryExpression', operator: u, start: startc, end: arg.end,
          loc: { start: startLoc, end: arg.loc.end }, prefix: !false, argument: core(arg) };
};

module.exports .parseUpdateExpression = function(arg, context) {
  var c = 0,
    loc = null,
    u = this.ltraw;

  if ( arg === null ) {
    c = this.c-2;
    loc = this.locOn(2);
    this.next() ;
    arg = this. parseExprHead(context&CONTEXT.FOR);
    this.assert(arg);

    this.ensureSimpAssig(core(arg));
    return { type: 'UpdateExpression', argument: core(arg), start: c, operator: u,
            prefix: !false, end: arg.end, loc: { start: loc, end: arg.loc.end } };
  }

  this.ensureSimpAssig(core(arg));
  c  = this.c;
  loc = { start: arg.loc.start, end: { line: this.li, column: this.col } };
  this.next() ;
  return { type: 'UpdateExpression', argument: core(arg), start: arg.start, operator: u,
          prefix: false, end: c, loc: loc };

};

module.exports .parseO = function(context ) {

  switch ( this. lttype ) {

  case 'op': return !false;
  case '--': return !false;
  case '-': this.prec = PREC.ADD_MIN; return !false;
  case '/':
    if ( this.src.charCodeAt(this.c) === CHAR.EQUALITY_SIGN ) {
      this.c++ ;
      this.prec = PREC.OP_ASSIG;
      this.ltraw = '/=';
      this.col++;
    }
    else
        this.prec = PREC.MUL ;

    return !false;

  case 'Identifier':
    switch ( this. ltval ) {
    case 'instanceof':
      this.prec = PREC.COMP  ;
      this.ltraw = this.ltval ;
      return !false;

    case 'of':
    case 'in':
      if ( context & CONTEXT.FOR ) break ;
      this.prec = PREC.COMP ;
      this.ltraw = this.ltval;
      return !false;
    }
    break;

  case '?': this .prec = PREC.COND  ; return !false;
  }

  return false ;
};

module.exports.parseNonSeqExpr =  function(prec, context  ) {
  var firstUnassignable = null, firstParen = null;

  var head = this. parseExprHead(context);

  if ( head === null ) {
    switch ( this.lttype ) {
    case 'u':
    case '-':
      head = this. parseUnaryExpression(context & CONTEXT.FOR );
      break ;

    case '--':
      head = this. parseUpdateExpression(null, context&CONTEXT.FOR );
      break ;

    case 'yield':
      this.assert(prec === PREC.WITH_NO_OP ); // make sure there is no other expression before it
      return this.parseYield(); // everything that comes belongs to it

    default:
      this.assert(context & CONTEXT.NULLABLE );
      return null;
    }
  }
  else if ( prec === PREC.WITH_NO_OP ) {
    firstParen = head. type === CONST.PAREN ? head.expr : this.firstParen ;
    firstUnassignable = this.firstUnassignable;
  }

  while ( !false ) { // eslint-disable-line no-constant-condition
    if ( !this. parseO( context ) ) break ;
    if ( PREC.isAssignment(this.prec) ) {
      this.assert( prec === PREC.WITH_NO_OP );
      this.firstUnassignable = firstUnassignable;
      head = this. parseAssignment(head, context & CONTEXT.FOR );
      break ;
    }

    if ( this.unsatisfiedAssignment ) {
      this.assert(prec===PREC.WITH_NO_OP && context === CONTEXT.ELEM );
      break ;
    }

    this.assert( !this.unsatisfiedArg );
    if ( PREC.isMMorAA(this.prec) ) {
      if ( this. newLineBeforeLookAhead )
        break ;
      head = this. parseUpdateExpression(head, context & CONTEXT.FOR ) ;
      continue;
    }
    if ( PREC.isQuestion(this.prec) ) {
      if ( prec === PREC.WITH_NO_OP ) {
        head = this. parseCond(head, context&CONTEXT.FOR );
      }
      break;
    }

    if ( this. prec < prec ) break ;
    if ( this. prec  === prec && !PREC.isRassoc(prec) ) break ;

    var o = this.ltraw;
    var currentPrec = this. prec;
    this.next();
    var right = this.parseNonSeqExpr(currentPrec, context & CONTEXT.FOR );
    head = { type: !PREC.isBin(currentPrec )  ? 'LogicalExpression' :   'BinaryExpression',
              operator: o,
              start: head.start,
              end: right.end,
              loc: {
                start: head.loc.start,
                end: right.loc.end
              },
              left: core(head),
              right: core(right)
            };
  }

  if ( prec === PREC.WITH_NO_OP ) {
    this.firstParen = firstParen ;
    this.firstUnassignable = firstUnassignable;
  }

  return head;
};

},{"../../util/char.js":40,"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],22:[function(require,module,exports){
var CHAR = require('../../util/char.js');
var CTYPE = require('../../util/ctype.js');

module.exports.readNumberLiteral =  function(peek) {
  var c = this.c, src = this.src, len = src.length;
  var b = 10 , val = 0;
  this.lttype  = 'Literal' ;
  this.li0 = this.li ;
  this.col0 = this.col;
  this.c0 = this.c;

  if (peek == CHAR[0]) { // if our num lit starts with a 0
    b = src.charCodeAt(++c);
    switch (b) { // check out what the next is
    case CHAR.X: case CHAR.x:
      c++;
      this.assert(c < len);
      b = src.charCodeAt(c);
      this.assert( CTYPE.isHex(b) );
      c++;
      while ( c < len && CTYPE.isHex( b = src.charCodeAt(c) ) )
        c++ ;
      this.ltval = parseInt( this.ltraw = src.slice(this.c,c) ) ;
      this.c = c;
      return;

    case CHAR.B: case CHAR.b:
      ++c;
      this.assert(c < len);
      b = src.charCodeAt(c);
      this.assert( b === CHAR[0] || b === CHAR[1] );
      val = b - CHAR[0];
      ++c;
      while ( c < len &&
            ( b = src.charCodeAt(c), b === CHAR[0] || b === CHAR[1] ) ) {
        val <<= 1;
        val |= b - CHAR[0];
        c++ ;
      }
      this.ltval = val ;
      this.ltraw = src.slice(this.c,c);
      this.c = c;
      return;

    case CHAR.O: case CHAR.o:
      ++c;
      this.assert(c < len) ;
      b = src.charCodeAt(c);
      this.assert( b >= CHAR[0] && b < CHAR[8] );
      val = b - CHAR[0] ;
      ++c;
      while ( c < len &&
            ( b = src.charCodeAt(c), b >= CHAR[0] && b < CHAR[8] ) ) {
        val <<= (1 + 2);
        val |= b - CHAR[0];
        c++ ;
      }
      this.ltval = val ;
      this.ltraw = src.slice(this.c,c) ;
      this.c = c;
      return;

    default:
      if ( b >= CHAR[0] && b <= CHAR[9] ) {
        this.assert( !this.tight );
        var base = 8;
        do {
          if ( b >= CHAR[8] && base === 8 ) base = 10 ;
          c ++;
        } while ( c < len &&
                ( b = src.charCodeAt(c), b >= CHAR[0] && b <= CHAR[9]) );

        b = this.c;
        this.c = c;

        if ( this.frac(b) ) return;

        this.ltval = parseInt (this.ltraw = src.slice(b, c), base);
        return ;
      }
      else {
        b = this.c ;
        this.c = c ;
        if ( this.frac(b) ) return;
        else  {
          this.ltval = 0;
          this.ltraw = '0';
        }
        return  ;
      }
    }
  }

  else  {
    b = this.c;
    c ++ ;
    while (c < len && CTYPE.num(src.charCodeAt(c))) c++ ;
    this.c = c;
    if ( this.frac(b) )
      return;
    else
      this.ltval = parseInt(this.ltraw = src.slice(b, this.c)  ) ;

    this.c = c;
  }

  this.assert ( !( c < len && CTYPE.isIDHead(src.charCodeAt(c))) ); // needless
};

module.exports . frac = function(n) {
  var c = this.c,
    l = this.src,
    e = l.length ;
  if ( n == -1 || l.charCodeAt(c)== CHAR.SINGLEDOT )
    while( ++c < e && CTYPE.Num(l.charCodeAt (c)));

  switch(l.charCodeAt(c)){
  case CHAR.E:
  case CHAR.e:
    c++;
    switch(l.charCodeAt(c)) {
    case CHAR.MIN: case CHAR.ADD: c++ ;
    }
    while ( c < e && CTYPE.Num(l.charCodeAt( c) )) c++ ;
  }
  if ( c == this.c ) return false  ;
  this.ltraw = l.slice (n === -1 ? this.c - 1 : n, c);
  this.ltval =  parseFloat(this.ltraw )  ;
  this.c = c ;
  return ! false   ;
};

},{"../../util/char.js":40,"../../util/ctype.js":44}],23:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var core = require('../../util/core.js');

module.exports .parseMeth = function(name, isObj) {
  var val = null;

  if ( isObj ) {
    val = this.parseFunc(CONTEXT.NONE,CONST.ARGLIST_AND_BODY,CONST.ANY_ARG_LEN );
    return { type: 'Property', key: core(name), start: name.start, end: val.end,
              kind: 'init', computed: name.type === CONST.PAREN,
              loc: { start: name.loc.start, end : val.loc.end },
              method: !false, shorthand: false, value : val };
  }

  var kind = 'method' ;

  switch ( name.type ) {
  case 'Identifier':
    if ( name.name === 'constructor' )  kind  = 'constructor';
    break ;

  case 'Literal':
    if ( name.value === 'constructor' )  kind  = 'constructor';
    break ;
  }

  val = this.parseFunc(CONTEXT.NONE ,
      CONST.ARGLIST_AND_BODY|(kind !== 'constructor' ? CONST.METH_FUNCTION : CONST.CONSTRUCTOR_FUNCTION), CONST.ANY_ARG_LEN );

  return { type: 'MethodDefinition', key: core(name), start: name.start, end: val.end,
            kind: kind, computed: name.type === CONST.PAREN,
            loc: { start: name.loc.start, end: val.loc.end },
            value: val,    'static': false };
};

module.exports .parseGen = function(isObj ) {
  var startc = this.c - 1,
    startLoc = this.locOn(1);
  this.next();
  var name = null;

  switch ( this.lttype ) {
  case 'Identifier':
    this.assert(this.ltval !== 'constructor' ) ;
    name = this.memberID();
    break ;

  case '[':
    name = this.memberExpr();
    break ;

  case 'Literal' :
    this.assert(this.ltval !== 'constructor' ) ;
    name = this.numstr();
    break ;

  default:
    this.assert(false);
  }

  var val = null;

  if ( isObj ) {
    val  =  this.parseFunc ( CONTEXT.NONE, CONST.ARGLIST_AND_BODY_GEN, CONST.ANY_ARG_LEN );

    return { type: 'Property', key: core(name), start: startc, end: val.end,
              kind: 'init', computed: name.type === CONST.PAREN,
              loc: { start: startLoc , end : val.loc.end },
              method: !false, shorthand: false, value : val };
  }

  val = this.parseFunc(  CONTEXT.NONE , CONST.ARGLIST_AND_BODY_GEN|CONST.ETH_FUNCTION, CONST.ANY_ARG_LEN );
  return { type: 'MethodDefinition', key: core(name), start: startc, end: val.end,
          kind: 'method', computed: name.type === CONST.PAREN,
          loc : { start: startLoc, end: val.loc.end },    'static': false, value: val };
};

module.exports . parseSetGet= function(isObj) {
  var startc = this.c0,
    startLoc = this.locBegin();

  var c = this.c, li = this.li, col = this.col;

  var kind = this.ltval;
  this.next();

  var strName = null;
  var name = null;

  switch ( this.lttype ) {
  case 'Identifier':
    if (!isObj) strName = this.ltval;
    name = this.memberID();
    break;
  case '[':
    name = this.memberExpr();
    break;
  case 'Literal':
    if (!isObj) strName = this.ltval;
    name = this.numstr();
    break ;
  default:
    name = { type: 'Identifier', name: this.ltval, start: startc,  end: c,
            loc: { start: startLoc, end: { line: li, column: col } } };

    return isObj ? this.parseProperty(name) : this.parseMeth(name, isObj) ;
  }

  var val = null;
  if ( isObj ) {
    val = this.parseFunc ( CONTEXT.NONE, CONST.ARGLIST_AND_BODY, kind === 'set' ? 1 : 0 );
    return { type: 'Property', key: core(name), start: startc, end: val.end,
          kind: kind, computed: name.type === CONST.PAREN,
          loc: { start: startLoc, end: val.loc.end }, method: false,
          shorthand: false, value : val };
  }

  val = this.parseFunc ( CONTEXT.NONE , CONST.ARGLIST_AND_BODY|CONST.METH_FUNCTION, kind === 'set' ? 1 : 0 );
  this.assert ( strName !== 'constructor' );

  return { type: 'MethodDefinition', key: core(name), start: startc, end: val.end,
          kind: kind, computed: name.type === CONST.PAREN,
          loc : { start: startLoc, end: val.loc.end }, 'static': false, value: val };
};

},{"../../util/constants.js":42,"../../util/core.js":43}],24:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseObjectExpression = function() {
  var startc = this.c - 1,
    startLoc = this.locOn(1),
    elem = null,
    list = [];
  var firstUnassignable = null,
    firstParen = null,
    unsatisfiedAssignment = this.unsatisfiedAssignment;
  do {
    this.next();
    this.unsatisfiedAssignment = null;
    elem = this.parseProperty(null);
    if (elem) {
      list.push(elem);
      if (!unsatisfiedAssignment && this.unsatisfiedAssignment)
        unsatisfiedAssignment = this.unsatisfiedAssignment;
      if (!firstParen && this.firstParen)
        firstParen = this.firstParen;
      if (!firstUnassignable && this.firstUnassignable)
        firstUnassignable = this.firstUnassignable;
    } else
      break;
  } while (this.lttype === ',');
  elem = {
    properties: list,
    type: 'ObjectExpression',
    start: startc,
    end: this.c,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.expectType('}');
  if (firstUnassignable) this.firstUnassignable = firstUnassignable;
  if (firstParen) this.firstParen = firstParen;
  if (unsatisfiedAssignment)
    this.unsatisfiedAssignment = unsatisfiedAssignment;
  return elem;
};
module.exports.parseProperty = function(name) {
  var val = null;
  SWITCH:
    if (name === null) switch (this.lttype) {
    case 'op':
      return this.ltraw === '*' ? this.parseGen(CONST.OBJ_MEM) : null;
    case 'Identifier':
      switch (this.ltval) {
      case 'get':
        return this.parseSetGet(CONST.OBJ_MEM);
      case 'set':
        return this.parseSetGet(CONST.OBJ_MEM);
      default:
        name = this.memberID();
        break SWITCH;
      }
    case 'Literal':
      name = this.numstr();
      break SWITCH;
    case '[':
      name = this.memberExpr();
      break SWITCH;
    default:
      return null;
    }
  this.firstUnassignable = this.firstParen = null;
  switch (this.lttype) {
  case ':':
    this.next();
    val = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE);
    return {
      type: 'Property',
      start: name.start,
      key: core(name),
      end: val.end,
      kind: 'init',
      loc: {
        start: name.loc.start,
        end: val.loc.end
      },
      computed: name.type === CONST.PAREN,
      method: false,
      shorthand: false,
      value: core(val)
    };
  case '(':
    return this.parseMeth(name, CONST.OBJ_MEM);
  default:
    this.assert(name.type === 'Identifier');
    if (this.lttype === 'op') {
      this.assert(this.ltraw === '=');
      val = this.parseAssig(name);
      this.unsatisfiedAssignment = val;
    } else
      val = name;
    return {
      type: 'Property',
      key: name,
      start: val.start,
      end: val.end,
      loc: val.loc,
      kind: 'init',
      shorthand: !false,
      method: false,
      value: val,
      computed: false
    };
  }
//  return n; // unreachable
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],25:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parsePattern = function() {
  switch (this.lttype) {
  case 'Identifier':
    var id = this.validateID(null);
    if (this.isInArgList)
      this.addArg(id);
    return id;
  case '[':
    return this.parseArrayPattern();
  case '{':
    return this.parseObjectPattern();
  default:
    return null;
  }
};
module.exports.parseArrayPattern = function() {
  var startc = this.c - 1,
    startLoc = this.locOn(1),
    elem = null,
    list = [],
    tight;
  if (this.isInArgList) {
    tight = this.tight;
    this.tight = !false;
  }
  this.next();
  while (!false) { // eslint-disable-line no-constant-condition
    elem = this.parsePattern();
    if (elem) {
      if (this.lttype === 'op' && this.ltraw === '=') elem = this.parseAssig(
        elem);
    } else {
      if (this.lttype === '...') {
        list.push(this.parseRestElement());
        break;
      }
    }
    if (this.lttype === ',') {
      list.push(elem);
      this.next();
    } else {
      if (elem) list.push(elem);
      break;
    }
  }
  if (this.isInArgList)
    this.tight = tight;
  elem = {
    type: 'ArrayPattern',
    loc: {
      start: startLoc,
      end: this.loc()
    },
    start: startc,
    end: this.c,
    elements: list
  };
  this.expectType(']');
  return elem;
};
module.exports.parseObjectPattern = function() {
  var sh = false;
  var startc = this.c - 1;
  var startLoc = this.locOn(1);
  var list = [];
  var val = null;
  var name = null;
  var tight;
  if (this.isInArgList) {
    tight = this.tight;
    this.tight = !false;
  }
  LOOP:
    do {
      sh = false;
      this.next();
      switch (this.lttype) {
      case 'Identifier':
        name = this.memberID();
        if (this.lttype === ':') {
          this.next();
          val = this.parsePattern();
        } else {
          sh = !false;
          val = name;
        }
        break;
      case '[':
        name = this.memberExpr();
        this.expectType(':');
        val = this.parsePattern();
        break;
      case 'Literal':
        name = this.numstr();
        this.expectType(':');
        val = this.parsePattern();
        break;
      default:
        break LOOP;
      }
      if (this.lttype === 'op' && this.ltraw === '=')
        val = this.parseAssig(val);
      list.push({
        type: 'Property',
        start: name.start,
        key: core(name),
        end: val.end,
        loc: {
          start: name.loc.start,
          end: val.loc.end
        },
        kind: 'init',
        computed: name.type === CONST.PAREN,
        value: val,
        method: false,
        shorthand: sh
      });
    } while (this.lttype === ',');
  if (this.isInArgList)
    this.tight = tight;
  var n = {
    type: 'ObjectPattern',
    loc: {
      start: startLoc,
      end: this.loc()
    },
    start: startc,
    end: this.c,
    properties: list
  };
  this.expectType('}');
  return n;
};
module.exports.parseAssig = function(head) {
  this.next();
  var e = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE);
  return {
    type: 'AssignmentPattern',
    start: head.start,
    left: head,
    end: e.end,
    right: core(e),
    loc: {
      start: head.loc.start,
      end: e.loc.end
    }
  };
};
module.exports.parseRestElement = function() {
  var startc = this.c - 1 - 2,
    startLoc = this.locOn(1 + 2);
  this.next();
  var e = this.parsePattern();
  this.assert(e);
  return {
    type: 'RestElement',
    loc: {
      start: startLoc,
      end: e.loc.end
    },
    start: startc,
    end: e.end,
    argument: e
  };
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],26:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseExprHead = function(context) {
  var firstUnassignable = null;
  var firstParen = null;
  var head;
  var inner;
  var elem;
  if (this.pendingExprHead) {
    head = this.pendingExprHead;
    this.pendingExprHead = null;
  } else switch (this.lttype) {
  case 'Identifier':
    if ((head = this.parseIdStatementOrId(context)))
      break;
    return null;
  case '[':
    this.firstUnassignable = this.firstParen = null;
    head = this.parseArrayExpression();
    if (this.unsatisfiedAssignment)
      return head;
    firstUnassignable = this.firstUnassignable;
    firstParen = this.firstParen;
    break;
  case '(':
    head = this.parseParen();
    if (this.unsatisfiedArg)
      return head;
    break;
  case '{':
    this.firstUnassignable = this.firstParen = null;
    head = this.parseObjectExpression();
    if (this.unsatisfiedAssignment)
      return head;
    firstUnassignable = this.firstUnassignable;
    firstParen = this.firstParen;
    break;
  case '/':
    head = this.parseRegExpLiteral();
    break;
  case '`':
    head = this.parseTemplateLiteral();
    break;
  case 'Literal':
    head = this.numstr();
    break;
  case '-':
    this.prec = PREC.U;
    return null;
  default:
    return null;
  }
  inner = core(head);
  LOOP:
    while (!false) { // eslint-disable-line no-constant-condition
      switch (this.lttype) {
      case '.':
        this.next();
        elem = this.memberID();
        this.assert(elem);
        head = {
          type: 'MemberExpression',
          property: elem,
          start: head.start,
          end: elem.end,
          loc: {
            start: head.loc.start,
            end: elem.loc.end
          },
          object: inner,
          computed: false
        };
        inner = head;
        continue;
      case '[':
        this.next();
        elem = this.parseExpr(PREC.WITH_NO_OP, CONTEXT.NONE);
        head = {
          type: 'MemberExpression',
          property: core(elem),
          start: head.start,
          end: this.c,
          loc: {
            start: head.loc.start,
            end: this.loc()
          },
          object: inner,
          computed: !false
        };
        inner = head;
        this.expectType(']');
        continue;
      case '(':
        elem = this.parseArgList();
        head = {
          type: 'CallExpression',
          callee: inner,
          start: head.start,
          end: this.c,
          arguments: elem,
          loc: {
            start: head.loc.start,
            end: this.loc()
          }
        };
        this.expectType(')');
        inner = head;
        continue;
      case '`':
        elem = this.parseTemplateLiteral();
        head = {
          type: 'TaggedTemplateExpression',
          quasi: elem,
          start: head.start,
          end: elem.end,
          loc: {
            start: head.loc.start,
            end: elem.loc.end
          },
          tag: inner
        };
        inner = head;
        continue;
      default:
        break LOOP;
      }
    }
  if (head.type !== CONST.PAREN) {
    this.firstUnassignable = firstUnassignable;
    this.firstParen = firstParen;
  }
  return head;
};
module.exports.parseMeta = function(startc, end, startLoc, endLoc, new_raw) {
  this.assert(this.ltval === 'target');
  var prop = this.id();
  return {
    type: 'MetaProperty',
    meta: {
      type: 'Identifier',
      name: 'new',
      start: startc,
      end: end,
      loc: {
        start: startLoc,
        end: endLoc
      },
      raw: new_raw
    },
    start: startc,
    property: prop,
    end: prop.end,
    loc: {
      start: startLoc,
      end: prop.loc.end
    }
  };
};
module.exports.numstr = function() {
  var n = {
    type: 'Literal',
    value: this.ltval,
    start: this.c0,
    end: this.c,
    loc: {
      start: this.locBegin(),
      end: this.loc()
    },
    raw: this.ltraw
  };
  this.next();
  return n;
};
module.exports.idLit = function(val) {
  var n = {
    type: 'Literal',
    value: val,
    start: this.c0,
    end: this.c,
    loc: {
      start: this.locBegin(),
      end: this.loc()
    },
    raw: this.ltraw
  };
  this.next();
  return n;
};
module.exports.id = function() {
  var id = {
    type: 'Identifier',
    name: this.ltval,
    start: this.c0,
    end: this.c,
    loc: {
      start: this.locBegin(),
      end: this.loc()
    },
    raw: this.ltraw
  };
  this.next();
  return id;
};
module.exports.parseParen = function() {
  var firstParen = null;
  var unsatisfiedAssignment = this.unsatisfiedAssignment,
    startc = this.c - 1,
    startLoc = this.locOn(1);
  var unsatisfiedArg = null;
  var list = null,
    elem = null;
  var firstElem = null;
  while (!false) { // eslint-disable-line no-constant-condition
    this.firstParen = null;
    this.next();
    this.unsatisfiedAssignment = null;
    elem = // unsatisfiedArg ? this.parsePattern() :
      this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.ELEM | CONTEXT.NULLABLE);
    if (!elem) {
      if (this.lttype === '...') {
        elem = this.parseSpreadElement();
        if (!firstParen && this.firstParen) firstParen = this.firstParen;
        if (!unsatisfiedArg) unsatisfiedArg = elem;
      }
      break;
    }
    if (!firstParen && this.firstParen)
      firstParen = this.firstParen;
    if (!unsatisfiedArg && this.unsatisfiedAssignment)
      unsatisfiedArg = this.unsatisfiedAssignment;
    if (this.lttype !== ',') break;
    if (list) list.push(core(elem));
    else {
      firstElem = elem;
      list = [core(elem)];
    }
  }
  // if elem is a SpreadElement, and we have a list
  if (elem && list) list.push(elem);
  // if we have a list, the expression in parens is a seq
  if (list)
    elem = {
      type: 'SequenceExpression',
      expressions: list,
      start: firstElem.start,
      end: elem.end,
      loc: {
        start: firstElem.loc.start,
        end: elem.loc.end
      }
    };
  // otherwise update the expression's paren depth if it's needed
  if (elem) {
    elem = core(elem);
    switch (elem.type) {
    case 'Identifier':
    case 'MemberExpression':
      this.firstUnassignable = null;
      break;
    default:
      this.firstUnassignable = elem;
    }
  }
  var n = {
    type: CONST.PAREN,
    expr: elem,
    start: startc,
    end: this.c,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  if (firstParen)
    this.firstParen = firstParen;
  if (unsatisfiedArg)
    this.unsatisfiedArg = unsatisfiedArg;
  else if (!elem) // we got an empty paren (), which certainly is an arg list
    this.unsatisfiedArg = n;
  this.unsatisfiedAssignment = unsatisfiedAssignment;
  this.expectType(')');
  return n;
};
module.exports.parseThis = function() {
  var n = {
    type: 'ThisExpression',
    loc: {
      start: this.locBegin(),
      end: this.loc()
    },
    start: this.c0,
    end: this.c
  };
  this.next();
  return n;
};
module.exports.parseArgList = function() {
  var elem = null;
  var list = [];
  do {
    this.next();
    elem = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NULLABLE);
    if (elem)
      list.push(core(elem));
    else if (this.lttype === '...')
      list.push(this.parseSpreadElement());
    else
      break;
  } while (this.lttype === ',');
  return list;
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],27:[function(require,module,exports){
module.exports.parseProgram =  function() {
  var startc = this.c;
  /* unused
  var li = this.li;
  var col = this.col;
  */
  var endI = this.c , startLoc = null;
  this.next();
  var list = this.blck();
  var endLoc = null;
  if (list.length) {
    var firstStatement = list[0];
    startc = firstStatement.start;
    startLoc = firstStatement.loc.start;

    var lastStatement = list[ list.length - 1 ];
    endI = lastStatement.end;
    endLoc = lastStatement.loc.end;
  }
  else {
    endLoc = startLoc = { line: 0, column: 0 };
  }

  var n = { type: 'Program', body: list, start: startc, end: endI, sourceType: !this.isScript ? 'module' : 'script' ,
           loc: { start: startLoc, end: endLoc } };

  this.expectType('eof');

  return n;
};

},{}],28:[function(require,module,exports){
/* eslint no-invalid-regexp: 0 */

var CHAR = require('../../util/char.js');
var hex = require('../../util/hex.js');

var gRegexFlag = 1,
  uRegexFlag = gRegexFlag << 1,
  yRegexFlag = uRegexFlag << 1,
  mRegexFlag = yRegexFlag << 1,
  iRegexFlag = mRegexFlag << 1;
var regexFlagsSupported = 0;
try {
  new RegExp('lube', 'g');
  regexFlagsSupported |= gRegexFlag;
  new RegExp('lube', 'u');
  regexFlagsSupported |= uRegexFlag;
  new RegExp('lube', 'y');
  regexFlagsSupported |= yRegexFlag;
  new RegExp('lube', 'm');
  regexFlagsSupported |= mRegexFlag;
  new RegExp('lube', 'i');
  regexFlagsSupported |= iRegexFlag;
} catch (r) {
  // swoosh
}
module.exports.curlyReplace = function(matchedString, b, matchIndex,
  wholeString) { // FIXME: wholestring unused
  var c = parseInt('0x' + b);
  if (c <= 0xFFFF) return '\\u' + hex(c);
  return '\\uFFFF';
};
module.exports.regexReplace = function(matchedString, b, noB, matchIndex,
  wholeString) { // FIXME: wholestring unused
  var c = parseInt('0x' + (b || noB));
  this.assert(c <= 0x010FFFF);
  if (c <= 0xFFFF) return String.fromCharCode(c);
  c -= 0x010000;
  return '\uFFFF';
};
module.exports.verifyRegex = function(regex, flags) {
  var regexVal = null; // FIXME: unused
  try {
    return new RegExp(regex, flags);
  } catch (e) {
    throw e;
  }
};
module.exports.parseRegExpLiteral = function() {
  var startc = this.c - 1,
    startLoc = this.locOn(1),
    c = this.c,
    src = this.src,
    len = src.length;
  var inSquareBrackets = false;
  WHILE:
    while (c < len) {
      switch (src.charCodeAt(c)) {
      case CHAR.LSQBRACKET:
        if (!inSquareBrackets)
          inSquareBrackets = !false;
        break;
      case CHAR.BACK_SLASH:
        ++c;
        break;
      case CHAR.RSQBRACKET:
        if (inSquareBrackets)
          inSquareBrackets = false;
        break;
      case CHAR.DIV:
        if (inSquareBrackets)
          break;
        break WHILE;
        //       default:if ( o >= 0x0D800 && o <= 0x0DBFF ) { this.col-- ; }
      }
      c++;
    }
  this.assert(src.charCodeAt(c) === CHAR.DIV);
  var flags = 0;
  var flagCount = 0;
  WHILE:
    while (flagCount <= 5) {
      switch (src.charCodeAt(++c)) {
      case CHAR.g:
        this.assert(!(flags & gRegexFlag));
        flags |= gRegexFlag;
        break;
      case CHAR.u:
        this.assert(!(flags & uRegexFlag));
        flags |= uRegexFlag;
        break;
      case CHAR.y:
        this.assert(!(flags & yRegexFlag));
        flags |= yRegexFlag;
        break;
      case CHAR.m:
        this.assert(!(flags & mRegexFlag));
        flags |= mRegexFlag;
        break;
      case CHAR.i:
        this.assert(!(flags & iRegexFlag));
        flags |= iRegexFlag;
        break;
      default:
        break WHILE;
      }
      flagCount++;
    }
  var patternString = src.slice(this.c, c - flagCount - 1),
    flagsString = src.slice(c - flagCount, c);
  var val = null;
  var normalizedRegex = patternString;
  // those that contain a 'u' flag need special treatment when RegExp constructor they get sent to
  // doesn't support the 'u' flag: since they can have surrogate pair sequences (which are not allowed without the 'u' flag),
  // they must be checked for having such surrogate pairs, and should replace them with a character that is valid even
  // without being in the context of a 'u'
  if ((flags & uRegexFlag) && !(regexFlagsSupported & uRegexFlag))
    normalizedRegex = normalizedRegex.replace(/\\u\{([A-F0-9a-f]+)\}/g,
      exports.curlyReplace) // normalize curlies
    .replace(/\\u([A-F0-9a-f][A-F0-9a-f][A-F0-9a-f][A-F0-9a-f])/g,
      exports.regexReplace) // convert
    .replace(/[\ud800-\udbff][\udc00-\udfff]/g, '\uFFFF');
  // all of the 1 bits in flags must also be 1 in the same bit index in regexsupportedFlags;
  // flags ^ rsf returns a bit set in which the 1 bits mean "this flag is either not used in flags, or yt is not supported";
  // for knowing whether the 1 bit has also been 1 in flags, we '&' the above bit set with flags; the 1 bits in the
  // given bit set must both be 1 in flags and in flags ^ rsf; that is, they are both "used" and "unsupoorted or unused",
  // which would be equal to this: [used && (unsupported || !used)] == unsopprted
  if (flags & (regexFlagsSupported ^ flags))
    exports.verifyRegex(normalizedRegex, '');
  else
    val = exports.verifyRegex(patternString, flagsString);
  this.col += (c - this.c);
  var regex = {
    type: 'Literal',
    regex: {
      pattern: patternString,
      flags: flagsString
    },
    start: startc,
    end: c,
    value: val,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.c = c;
  this.next();
  return regex;
};

},{"../../util/char.js":40,"../../util/hex.js":48}],29:[function(require,module,exports){
module.exports.semiLoc =  function() {
  switch (this.lttype) {
  case ';':
    var n = this.loc();
    this.next();
    return n;

  case 'eof':
    return this.newLineBeforeLookAhead ? null : this.loc();

  case '}':
    if ( !this.newLineBeforeLookAhead )
      return this.locOn(1);
  }
  if (this.newLineBeforeLookAhead) return null;

  console.log('EOS expected; found ' + this.ltraw ) ;
};

module.exports.semiI = function() {
  return this.lttype === ';' ? this.c : this.newLineBeforeLookAhead ? 0 : this.lttype === '}' ? this.c - 1 : this.lttype === 'eof' ? this.c : 0; };

},{}],30:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseSpreadElement = function() {
  var startc = this.c - 1 - 2; // FIXME: -3?
  var startLoc = this.locOn(1 + 2);
  this.next ();

  var e = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE);

  return {
    type: 'SpreadElement',
    loc: { start: startLoc, end: e.loc.end },
    start: startc, end: e.end,
    argument: core(e) // FIXME: this.core?
  };
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],31:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;
var core = require('../../util/core.js');
var has = require('../../util/has.js');

module.exports.parseStatement = function(allowNull) {
  var head = null, e;
  // var l; // unused
  switch (this.lttype) {
  case '{':
    return this.parseBlckStatement();
  case ';':
    return this.parseEmptyStatement();
  case 'Identifier':
    this.canBeStatement = !false;
    head = this.parseIdStatementOrId(CONTEXT.NONE);
    if (this.foundStatement) {
      this.foundStatement = false;
      return head;
    }
    break;
  case 'eof':
    this.assert(allowNull);
    return null;
  }
  this.assert(head === null);
  head = this.parseExpr(CONTEXT.NULLABLE);
  if (!head) {
    this.assert(allowNull, 'statement must not be null');
    return null;
  }
  if (head.type == 'Identifier' && this.lttype == ':')
    return this.parseLabeledStatement(head, allowNull);
  this.fixupLabels(false);
  e = this.semiI() || head.end;
  return {
    type: 'ExpressionStatement',
    expression: core(head),
    start: head.start,
    end: e,
    loc: {
      start: head.loc.start,
      end: this.semiLoc() || head.loc.end
    }
  };
};
module.exports.findLabel = function(name) {
  return has.call(this.labels, name) ? this.labels[name] : null;
};
module.exports.parseLabeledStatement = function(label, allowNull) {
  this.next();
  var l = label.name;
  l += '%';
  this.assert(!this.findLabel(l));
  this.labels[l] =
    this.unsatisfiedLabel ?
    this.unsatisfiedLabel :
    this.unsatisfiedLabel = {
      loop: false
    };
  var stmt = this.parseStatement(allowNull);
  this.labels[l] = null;
  return {
    type: 'LabeledStatement',
    label: label,
    start: label.start,
    end: stmt.end,
    loc: {
      start: label.loc.start,
      end: stmt.loc.end
    },
    body: stmt
  };
};
module.exports.ensureStmt = function() {
  if (this.canBeStatement) this.canBeStatement = false;
  else this.assert(false);
};
module.exports.fixupLabels = function(loop) {
  if (this.unsatisfiedLabel) {
    this.unsatisfiedLabel.loop = loop;
    this.unsatisfiedLabel = null;
  }
};
module.exports.parseEmptyStatement = function() {
  var n = {
    type: 'EmptyStatement',
    start: this.c - 1,
    loc: {
      start: this.locOn(1),
      end: this.loc()
    },
    end: this.c
  };
  this.next();
  return n;
};
module.exports.parseIfStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  this.expectType('(');
  var cond = core(this.parseExpr(CONTEXT.NONE));
  this.expectType(')');
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= SCOPE.BREAK;
  var nbody = this.parseStatement(false);
  this.scopeFlags = scopeFlags;
  var alt = null;
  if (this.lttype === 'Identifier' && this.ltval === 'else') {
    this.next();
    alt = this.parseStatement(!false);
  }
  this.foundStatement = !false;
  return {
    type: 'IfStatement',
    test: cond,
    start: startc,
    end: (alt || nbody).end,
    loc: {
      start: startLoc,
      end: (alt || nbody).loc.end
    },
    consequent: nbody,
    alternate: alt
  };
};
module.exports.parseWhileStatement = function() {
  this.ensureStmt();
  this.fixupLabels(!false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  this.expectType('(');
  var cond = core(this.parseExpr(CONTEXT.NONE));
  this.expectType(')');
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= (SCOPE.CONTINUE | SCOPE.BREAK);
  var nbody = this.parseStatement(false);
  this.scopeFlags = scopeFlags;
  this.foundStatement = !false;
  return {
    type: 'WhileStatement',
    test: cond,
    start: startc,
    end: nbody.end,
    loc: {
      start: startLoc,
      end: nbody.loc.end
    },
    body: nbody
  };
};
module.exports.parseBlckStatement = function() {
  this.fixupLabels(false);
  var startc = this.c - 1,
    startLoc = this.locOn(1);
  this.next();
  var n = {
    type: 'BlockStatement',
    body: this.blck(),
    start: startc,
    end: this.c,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.expectType('}');
  return n;
};
module.exports.parseDoWhileStatement = function() {
  this.ensureStmt();
  this.fixupLabels(!false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= (SCOPE.BREAK | SCOPE.CONTINUE);
  var nbody = this.parseStatement(!false);
  this.scopeFlags = scopeFlags;
  this.expectID('while');
  this.expectType('(');
  var cond = core(this.parseExpr(CONTEXT.NONE));
  var c = this.c,
    li = this.li,
    col = this.col;
  this.expectType(')');
  if (this.lttype === ';') {
    c = this.c;
    li = this.li;
    col = this.col;
    this.next();
  }
  this.foundStatement = !false;
  return {
    type: 'DoWhileStatement',
    test: cond,
    start: startc,
    end: c,
    body: nbody,
    loc: {
      start: startLoc,
      end: {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseContinueStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  this.assert(this.scopeFlags & SCOPE.CONTINUE);
  var startc = this.c0,
    startLoc = this.locBegin();
  var c = this.c,
    li = this.li,
    col = this.col;
  this.next();
  var name = null,
    label = null,
    semi = 0;
  if (!this.newLineBeforeLookAhead && this.lttype === 'Identifier') {
    label = this.validateID(null);
    name = this.findLabel(label.name + '%');
    this.assert(name && name.loop);
    semi = this.semiI();
    this.foundStatement = !false;
    return {
      type: 'ContinueStatement',
      label: label,
      start: startc,
      end: semi || label.end,
      loc: {
        start: startLoc,
        end: this.semiLoc() || label.loc.end
      }
    };
  }
  semi = this.semiI();
  this.foundStatement = !false;
  return {
    type: 'ContinueStatement',
    label: null,
    start: startc,
    end: semi || c,
    loc: {
      start: startLoc,
      end: this.semiLoc() || {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseBreakStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  this.assert(this.scopeFlags & SCOPE.BREAK);
  var startc = this.c0,
    startLoc = this.locBegin();
  var c = this.c,
    li = this.li,
    col = this.col;
  this.next();
  var name = null,
    label = null,
    semi = 0;
  if (!this.newLineBeforeLookAhead && this.lttype === 'Identifier') {
    label = this.validateID(null);
    name = this.findLabel(label.name + '%');
    this.assert(name);
    semi = this.semiI();
    this.foundStatement = !false;
    return {
      type: 'BreakStatement',
      label: label,
      start: startc,
      end: semi || label.end,
      loc: {
        start: startLoc,
        end: this.semiLoc() || label.loc.end
      }
    };
  }
  semi = this.semiI();
  this.foundStatement = !false;
  return {
    type: 'BreakStatement',
    label: null,
    start: startc,
    end: semi || c,
    loc: {
      start: startLoc,
      end: this.semiLoc() || {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseSwitchStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin(),
    cases = [],
    hasDefault = false,
    scopeFlags = this.scopeFlags,
    elem = null;
  this.next();
  this.expectType('(');
  var switchExpr = core(this.parseExpr(CONTEXT.NONE));
  this.expectType(')');
  this.expectType('{');
  this.scopeFlags |= SCOPE.BREAK;
  while ((elem = this.parseSwitchCase())) {
    if (elem.test === null) {
      this.assert(!hasDefault);
      hasDefault = !false;
    }
    cases.push(elem);
  }
  this.scopeFlags = scopeFlags;
  this.foundStatement = !false;
  var n = {
    type: 'SwitchStatement',
    cases: cases,
    start: startc,
    discriminant: switchExpr,
    end: this.c,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.expectType('}');
  return n;
};
module.exports.parseSwitchCase = function() {
  var startc,
    startLoc;
  var nbody = null,
    cond = null;
  if (this.lttype === 'Identifier') switch (this.ltval) {
  case 'case':
    startc = this.c0;
    startLoc = this.locBegin();
    this.next();
    cond = core(this.parseExpr(CONTEXT.NONE));
    break;
  case 'default':
    startc = this.c0;
    startLoc = this.locBegin();
    this.next();
    break;
  default:
    return null;
  }
  else
    return null;
  var c = this.c,
    li = this.li,
    col = this.col;
  this.expectType(':');
  nbody = this.blck();
  var last = nbody.length ? nbody[nbody.length - 1] : null;
  return {
    type: 'SwitchCase',
    test: cond,
    start: startc,
    end: last ? last.end : c,
    loc: {
      start: startLoc,
      end: last ? last.loc.end : {
        line: li,
        column: col
      }
    },
    consequent: nbody
  };
};

module.exports.parseReturnStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  this.assert(this.scopeFlags & SCOPE.FUNCTION);
  var startc = this.c0,
    startLoc = this.locBegin(),
    retVal = null,
    li = this.li,
    c = this.c,
    col = this.col;
  this.next();
  var semi;
  if (!this.newLineBeforeLookAhead)
    retVal = this.parseExpr(CONTEXT.NULLABLE);
  semi = this.semiI();
  if (retVal) {
    this.foundStatement = !false;
    return {
      type: 'ReturnStatement',
      argument: core(retVal),
      start: startc,
      end: semi || retVal.end,
      loc: {
        start: startLoc,
        end: this.semiLoc() || retVal.loc.end
      }
    };
  }
  this.foundStatement = !false;
  return {
    type: 'ReturnStatement',
    argument: retVal,
    start: startc,
    end: semi || c,
    loc: {
      start: startLoc,
      end: this.semiLoc() || {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseThrowStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin(),
    retVal = null,
    li = this.li,
    c = this.c,
    col = this.col;
  this.next();
  var semi;
  if (!this.newLineBeforeLookAhead)
    retVal = this.parseExpr(CONTEXT.NULLABLE);
  semi = this.semiI();
  if (retVal) {
    this.foundStatement = !false;
    return {
      type: 'ThrowStatement',
      argument: core(retVal),
      start: startc,
      end: semi || retVal.end,
      loc: {
        start: startLoc,
        end: this.semiLoc() || retVal.loc.end
      }
    };
  }
  this.foundStatement = !false;
  return {
    type: 'ThrowStatement',
    argument: null,
    start: startc,
    end: semi || c,
    loc: {
      start: startLoc,
      end: this.semiLoc() || {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseBlockStatement_dependent = function() {
  var startc = this.c - 1,
    startLoc = this.locOn(1);
  this.expectType('{');
  var n = {
    type: 'BlockStatement',
    body: this.blck(),
    start: startc,
    end: this.c,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.expectType('}');
  return n;
};
module.exports.parseTryStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  var tryBlock = this.parseBlockStatement_dependent();
  var finBlock = null,
    catBlock = null;
  if (this.lttype === 'Identifier' && this.ltval === 'catch')
    catBlock = this.parseCatchClause();
  if (this.lttype === 'Identifier' && this.ltval === 'finally') {
    this.next();
    finBlock = this.parseBlockStatement_dependent();
  }
  var finOrCat = finBlock || catBlock;
  this.assert(finOrCat);
  this.foundStatement = !false;
  return {
    type: 'TryStatement',
    block: tryBlock,
    start: startc,
    end: finOrCat.end,
    handler: catBlock,
    finalizer: finBlock,
    loc: {
      start: startLoc,
      end: finOrCat.loc.end
    }
  };
};
module.exports.parseCatchClause = function() {
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  this.expectType('(');
  var catParam = this.parsePattern();
  this.expectType(')');
  var catBlock = this.parseBlockStatement_dependent();
  return {
    type: 'CatchClause',
    loc: {
      start: startLoc,
      end: catBlock.loc.end
    },
    start: startc,
    end: catBlock.end,
    param: catParam,
    body: catBlock
  };
};
module.exports.parseWithStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  this.expectType('(');
  var obj = this.parseExpr(CONTEXT.NONE);
  this.expectType(')');
  var nbody = this.parseStatement(!false);
  this.foundStatement = !false;
  return {
    type: 'WithStatement',
    loc: {
      start: startLoc,
      end: nbody.loc.end
    },
    start: startc,
    end: nbody.end,
    object: obj,
    body: nbody
  };
};
module.exports.prseDbg = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin();
  var c = this.c,
    li = this.li,
    col = this.col;
  this.next();
  if (this.lttype === ';') {
    c = this.c;
    li = this.li;
    col = this.col;
    this.next();
  }
  this.foundStatement = !false;
  return {
    type: 'DebuggerStatement',
    loc: {
      start: startLoc,
      end: {
        line: li,
        column: col
      }
    },
    start: startc,
    end: c
  };
};
module.exports.blck = function() { // blck ([]stmt)
  var stmts = [],
    stmt;
  while ((stmt = this.parseStatement(!false))) stmts.push(stmt);
  return (stmts);
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/has.js":47}],32:[function(require,module,exports){
var CHAR = require('../../util/char.js');

module.exports.readStrLiteral = function(start) {
  this.li0 = this.li;
  this.col0 = this.col;
  this.c0 = this.c;
  var c = this.c += 1,
    l = this.src,
    e = l.length,
    i = 0,
    v = '',
    v_start = c,
    startC = c - 1;
  while (c < e && (i = l.charCodeAt(c)) !== start) {
    switch (i) {
    case CHAR.BACK_SLASH:
      v += l.slice(v_start, c);
      this.col += (c - startC);
      startC = this.c = c;
      v += this.readEsc();
      c = this.c;
      if (this.col == 0) startC = c + 1;
      else {
        this.col += (c - startC);
        startC = c;
      }
      v_start = ++c;
      continue;
    case CHAR.CARRIAGE_RETURN:
      if (l.charCodeAt(c + 1) == CHAR.LINE_FEED) c++;
      break;
    case CHAR.LINE_FEED:
    case 0x2028:
    case 0x2029:
      this.err('a newline can not appear in a str literal');
    }
    c++;
  }
  if (v_start != c) {
    v += l.slice(v_start, c);
  }
  if (!(c < e && (l.charCodeAt(c)) === start)) {
    this.err('s lit open');
  }
  this.c = c + 1;
  this.col += (this.c - startC);
  this.lttype = 'Literal';
  this.ltraw = l.slice(this.c0, this.c);
  this.ltval = v;
};

},{"../../util/char.js":40}],33:[function(require,module,exports){
var SCOPE = require( '../../util/constants.js' ).SCOPE ;

module.exports.parseSuper = function() {
  var n = {
    type: 'Super',
    loc: { start: this.locBegin(), end: this.loc() },
    start: this.c0 , end: this.c
  };

  this.next() ;

  switch ( this.lttype ) {
  case '(':
    this.assert(this.scopeFlags & SCOPE.CONSTRUCTOR);
    return n;
  case '.':
  case '[':
    this.assert( this.scopeFlags & SCOPE.METH);
    return n;
  default:
    this.assert(false);
  }
};

},{"../../util/constants.js":42}],34:[function(require,module,exports){
var CHAR = require('../../util/char.js');
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;

module.exports.parseTemplateLiteral = function() {
  var li = this.li,
    col = this.col;
  var startc = this.c - 1,
    startLoc = this.locOn(1);
  var c = this.c,
    src = this.src,
    len = src.length;
  var templStr = [],
    templExpressions = [];
  var startElemFragment = c, // an element's content might get fragmented by an esc appearing in it,
                             // e.g., 'eeeee\nee' has two fragments, 'eeeee' and 'ee'
    startElem = c,
    currentElemContents = '',
    startColIndex = c,
    ch = 0;
  while (c < len) {
    ch = src.charCodeAt(c);
    if (ch === CHAR.BACKTICK) break;
    switch (ch) {
    case CHAR.$:
      if (src.charCodeAt(c + 1) === CHAR.LCURLY) {
        currentElemContents += src.slice(startElemFragment, c);
        this.col += (c - startColIndex);
        templStr.push({
          type: 'TemplateElement', start: startElem, end: c, tail: false,
          loc: { start: { line: li, column: col }, end: { line: this.li, column: this.col } },
          value: { raw: src.slice(startElem, c).replace(/\r\n|\r/g, '\n'), cooked: currentElemContents } });
        this.c = c + 2; // ${
        this.col += 2; // ${
        this.next(); // this must be done manually because we must have a lookahead before starting to parse an actual expression
        templExpressions.push(this.parseExpr(CONTEXT.NONE));
        this.assert(this.lttype === '}');
        currentElemContents = '';
        startElemFragment = startElem = c = this.c; // right after the '}'
        startColIndex = c;
        li = this.li;
        col = this.col;
      } else
        c++;
      continue;
    case CHAR.CARRIAGE_RETURN:
      currentElemContents += src.slice(startElemFragment, c) + '\n';
      c++;
      if (src.charCodeAt(c) === CHAR.LINE_FEED) c++;
      startElemFragment = startColIndex = c;
      this.li++;
      this.col = 0;
      continue;
    case CHAR.LINE_FEED:
      currentElemContents += src.slice(startElemFragment, c) + '\n';
      c++;
      startElemFragment = startColIndex = c;
      this.li++;
      this.col = 0;
      continue;
    case 0x2028:
    case 0x2029:
      currentElemContents += src.slice(startElemFragment, c) + src.charAt(c);
      startColIndex = c;
      c++;
      startElemFragment = c;
      this.li++;
      this.col = 0;
      continue;
    case CHAR.BACK_SLASH:
      this.c = c;
      currentElemContents += src.slice(startElemFragment, c) + this.readEsc();
      c = this.c;
      c++;
      if (this.col == 0) // if we had an escaped newline
        startColIndex = c;
      startElemFragment = c;
      continue;
    }
    c++;
  }
  this.assert(ch === CHAR.BACKTICK);
  if (startElem < c) {
    this.col += (c - startColIndex);
    if (startElemFragment < c)
      currentElemContents += src.slice(startElemFragment, c);
  } else currentElemContents = '';
  templStr.push({
    type: 'TemplateElement',
    start: startElem,
    loc: {
      start: {
        line: li,
        column: col
      },
      end: {
        line: this.li,
        column: this.col
      }
    },
    end: startElem < c ? c : startElem,
    tail: !false,
    value: {
      raw: src.slice(startElem, c).replace(/\r\n|\r/g, '\n'),
      cooked: currentElemContents
    }
  });
  c++; // backtick
  this.col++;
  var n = {
    type: 'TemplateLiteral',
    start: startc,
    quasis: templStr,
    end: c,
    expressions: templExpressions,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.c = c;
  this.next(); // prepare the next token
  return n;
};

},{"../../util/char.js":40,"../../util/constants.js":42}],35:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var SCOPE = CONST.SCOPE;

module.exports.validateID = function(e) {
  var n = e || this.ltval;
  SWITCH:
    switch (n.length) {
    case 1:
      break SWITCH;
    case 2:
      switch (n) {
      case 'do':
      case 'if':
      case 'in':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
    case 3:
      switch (n) {
      case 'int':
        if (this.v > 5)
          break SWITCH;
        return this.errorReservedID();
      case 'let':
        if (this.v <= 5 || !this.tight)
          break SWITCH;
        break;
      case 'for':
      case 'try':
      case 'var':
      case 'new':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
      break;
    case 4:
      switch (n) {
      case 'byte':
      case 'char':
      case 'goto':
      case 'long':
        if (this.v > 5) break SWITCH;
        break;
      case 'case':
      case 'else':
      case 'this':
      case 'void':
      case 'with':
      case 'enum':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
      break;
    case 5:
      switch (n) {
      case 'await':
        if (this.isScript) break SWITCH;
        break;
      case 'final':
      case 'float':
      case 'short':
        if (this.v > 5) break SWITCH;
        return this.errorReservedID();
      case 'yield':
        if (!(this.tight || (this.scopeFlags & SCOPE.YIELD)))
          break SWITCH;
        break;
      case 'break':
      case 'catch':
      case 'class':
      case 'const':
      case 'super':
      case 'throw':
      case 'while':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
      break;
    case 6:
      switch (n) {
      case 'double':
      case 'native':
      case 'throws':
        if (this.v > 5)
          break SWITCH;
        return this.errorReservedID();
      case 'public':
      case 'static':
        if (this.v > 5 && !this.tight)
          break SWITCH;
        break;
      case 'delete':
      case 'export':
      case 'import':
      case 'return':
      case 'switch':
      case 'typeof':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
      break;
    case 7:
      switch (n) {
      case 'package':
      case 'private':
        if (this.tight) return this.errorReservedID();
        break;
      case 'boolean':
        if (this.v > 5) break;
        break;
      case 'default':
      case 'extends':
      case 'finally':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
      break;
    case 8:
      switch (n) {
      case 'abstract':
      case 'volatile':
        if (this.v > 5) break;
      case 'continue': // eslint-disable-line no-fallthrough
      case 'debugger':
      case 'function':
        return this.errorReservedID();
      default:
        break SWITCH;
      }
      break;
    case 9:
      switch (n) {
      case 'interface':
        if (this.tight) this.resv();
        break;
      case 'protected':
      case 'transient':
        if (this.v <= 5)
          this.errorReservedID();
        break;
      default:
        break SWITCH;
      }
      break;
    case 10:
      switch (n) {
      case 'implements':
        if (this.v > 5 && !this.tight) break;
      case 'instanceof': // eslint-disable-line no-fallthrough
        this.errorReservedID();
        break;
      default:
        break SWITCH;
      }
      break;
    case 12:
      switch (n) {
      case 'synchronized':
        if (this.v <= 5) this.errorReservedID();
        break;
      default:
        break SWITCH;
      }
    }
  return e ? null : this.id();
};
module.exports.errorReservedID = function() {
  if (!this.throwReserved) {
    this.throwReserved = !false;
    return null;
  }
  this.err(this.ltraw + ' is not an identifier ');
};

},{"../../util/constants.js":42}],36:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseVariableDeclaration = function(context) {
  this.assert(this.canBeStatement);
  this.canBeStatement = false;
  var startc = this.c0,
    startLoc = this.locBegin(),
    kind = this.ltval;
  var elem = null;
  this.next();
  elem = this.parseVariableDeclarator(context);
  if (elem === null) {
    this.assert(kind === 'let');
    return null;
  }
  var list = [elem];
  if (!this.unsatisfiedAssignment) { // parseVariableDeclarator sets it when it finds an uninitialized BindingPattern
    while (this.lttype === ',') {
      this.next();
      elem = this.parseVariableDeclarator(context);
      this.assert(elem);
      list.push(elem);
    }
  }
  var lastItem = list[list.length - 1];
  var endI = 0,
    endLoc = null;
  if (!(context & CONTEXT.FOR)) {
    endI = this.semiI() || lastItem.end;
    endLoc = this.semiLoc() || lastItem.loc.end;
  } else {
    endI = lastItem.end;
    endLoc = lastItem.loc.end;
  }
  this.foundStatement = !false;
  return {
    declarations: list,
    type: 'VariableDeclaration',
    start: startc,
    end: endI,
    loc: {
      start: startLoc,
      end: endLoc
    },
    kind: kind
  };
};
module.exports.parseVariableDeclarator = function(context) {
  if ((context & CONTEXT.FOR) &&
    this.lttype === 'Identifier' &&
    this.ltval === 'in')
    return null;
  var head = this.parsePattern(),
    init = null;
  if (!head) return null;
  if (this.lttype === 'op' && this.ltraw === '=') {
    this.next();
    init = this.parseNonSeqExpr(PREC.WITH_NO_OP, context);
  } else if (head.type !== 'Identifier') { // our pattern is an arr or an obj?
    this.assert(context & CONTEXT.FOR); // bail out in case it is not a 'for' loop's init
    if (!this.unsatisfiedAssignment)
      this.unsatisfiedAssignment = head; // an 'in' or 'of' will satisfy it
  }
  var initOrHead = init || head;
  return {
    type: 'VariableDeclarator',
    id: head,
    start: head.start,
    end: initOrHead.end,
    loc: {
      start: head.loc.start,
      end: initOrHead.loc.end
    },
    init: init && core(init)
  };
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],37:[function(require,module,exports){
var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');
var core = require('../../util/core.js');

module.exports.parseYield = function(context) { // FIXME: context never used
  var arg = null,
    deleg = false;
  var c = this.c,
    li = this.li,
    col = this.col;
  var startc = this.c0,
    startLoc = this.locBegin();

  this.next();
  if (!this.newLineBeforeLookAhead) {
    if (this.lttype === 'op' && this.ltraw === '*') {
      deleg = !false;
      this.next();
      arg = this.parseNonSeqExpr(PREC.WITH_NO_OP, context );
      this.assert(arg);
    } else
      arg = this.parseNonSeqExpr(PREC.WITH_NO_OP, context|CONTEXT.NULLABLE);
  }
  var endI, endLoc;
  if (arg) {
    endI = arg.end;
    endLoc = arg.loc.end;
  } else {
    endI = c;
    endLoc = {
      line: li,
      column: col
    };
  }
  return {
    type: 'YieldExpression',
    argument: arg && core(arg),
    start: startc,
    delegate: deleg,
    end: endI,
    loc: {
      start: startLoc,
      end: endLoc
    }
  };
};

},{"../../util/constants.js":42,"../../util/core.js":43,"../../util/precedence.js":49}],38:[function(require,module,exports){

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

module.exports.default = module.exports = assert;

},{}],39:[function(require,module,exports){
function arguments_or_eval(l) {
  switch ( l ) {
  case 'arguments':
  case 'eval':
    return !false;
  }

  return false;
}

module.exports.default = module.exports = arguments_or_eval;

},{}],40:[function(require,module,exports){
var char2int = require('./char2int.js');

module.exports = {
  // 0-9
  '0': char2int('0'),
  '1': char2int('1'),
  '2': char2int('2'),
  '3': char2int('3'),
  '4': char2int('4'),
  '5': char2int('5'),
  '6': char2int('6'),
  '7': char2int('7'),
  '8': char2int('8'),
  '9': char2int('9'),

  // A-Za-z
  // FIXME: missing letters?
  'a':  char2int('a'), 'A':  char2int('A'),
  'b':  char2int('b'), 'B':  char2int('B'),
  'e':  char2int('e'), 'E':  char2int('E'),
  'g':  char2int('g'),
  'f':  char2int('f'), 'F':  char2int('F'),
  'i':  char2int('i'),
  'm':  char2int('m'),
  'n':  char2int('n'),
  'o':  char2int('o'), 'O':  char2int('O'),
  'r':  char2int('r'),
  't':  char2int('t'),
  'u':  char2int('u'), 'U':  char2int('U'),
  'v':  char2int('v'), 'X':  char2int('X'),
  'x':  char2int('x'),
  'y':  char2int('y'),
  'z':  char2int('z'), 'Z':  char2int('Z'),

  // other characters
  'UNDERLINE': char2int('_'),
  '$': char2int('$'),

  'TAB': char2int('\t'),
  'CARRIAGE_RETURN': char2int('\r'),
  'LINE_FEED': char2int('\n'),
  'VTAB': char2int('\v'),
  'FORM_FEED': char2int( '\f') ,

  'WHITESPACE': char2int(' '),

  'BACKTICK': char2int('`'),
  'SINGLE_QUOTE': char2int('\''),
  'MULTI_QUOTE': char2int('"'),
  'BACK_SLASH': char2int(('\\')),

  'DIV': char2int('/'),
  'MUL': char2int('*'),
  'MIN': char2int('-'),
  'ADD': char2int('+'),
  'AND': char2int('&'),
  'XOR': char2int('^'),
  'MODULO': char2int('%'),
  'OR': char2int('|'),
  'EQUALITY_SIGN': char2int('='),

  'SEMI': char2int(';'),
  'COMMA': char2int(','),
  'SINGLEDOT': char2int('.'),
  'COLON': char2int((':')),
  'QUESTION': char2int('?'),

  'EXCLAMATION': char2int('!'),
  'COMPLEMENT': char2int('~'),

  'ATSIGN': char2int('@'),

  'LPAREN': char2int('('),
  'RPAREN': char2int(')'),
  'LSQBRACKET': char2int('['),
  'RSQBRACKET': char2int(']'),
  'LCURLY': char2int('{'),
  'RCURLY': char2int('}'),
  'LESS_THAN': char2int('<'),
  'GREATER_THAN': char2int('>')
};

},{"./char2int.js":41}],41:[function(require,module,exports){
function char2int(c) {
  return c.charCodeAt(0);
}

module.exports.default = module.exports = char2int;

},{}],42:[function(require,module,exports){
var INTBITLEN = (function() { var i = 0;
  while ( 0 < (1 << (i++))) if (i >= 512) return 8;
  return i;
}());

var D_INTBITLEN = 0, M_INTBITLEN = INTBITLEN - 1;
while ( M_INTBITLEN >> (++D_INTBITLEN) );

var BREAK=        1,
    CONTINUE=     BREAK << 1,
    FUNCTION=     CONTINUE << 1,
    METH=         FUNCTION << 1,
    YIELD=        METH << 1,
    CONSTRUCTOR=  YIELD << 1
 
module.exports.default = module.exports = {
  SCOPE: {
    BREAK:      BREAK ,  
    CONTINUE:   CONTINUE,
    FUNCTION:   FUNCTION,
    METH:       METH ,
    YIELD:      YIELD,
    CONSTRUCTOR: CONSTRUCTOR
  },

  CONTEXT: {
    FOR: 1, ELEM: 2, NONE: 0, NULLABLE: 4, DEFAULT: 32
  },

  // INT BIT LEN
  INTBITLEN: INTBITLEN,
  D_INTBITLEN: D_INTBITLEN,
  M_INTBITLEN: M_INTBITLEN,

  // MISC
  PAREN: 'paren',

  ANY_ARG_LEN: -1,

  WHOLE_FUNCTION: 8,
  ARGLIST_AND_BODY_GEN: 1,
  ARGLIST_AND_BODY: 2,
  METH_FUNCTION: 4,
  CONSTRUCTOR_FUNCTION: 128,

  OBJ_MEM: !false,

  STRING_TYPE: typeof 'string'
};

},{}],43:[function(require,module,exports){
var CONST = require('./constants.js');

function core(n) {
  return n.type === CONST.PAREN ? n.expr : n;
}

module.exports.default = module.exports = core;

},{"./constants.js":42}],44:[function(require,module,exports){
var CHAR = require('./char.js');
var CONST = require('./constants.js');
var UNICODE = require('./unicode');

// TODO: import IDS_, IDC_;
// FIXME: Num, num unused?

function Num(c) {
  return (c >= CHAR[0] && c <= CHAR[9]);
}

function isIDHead(c) {
  return (c <= CHAR.z && c >= CHAR.a) ||
          c === CHAR.$ ||
         (c <= CHAR.Z && c >= CHAR.A) ||
          c === CHAR.UNDERLINE ||
         (UNICODE.IDS[c >> CONST.D_INTBITLEN] & (1 << (c & CONST.M_INTBITLEN)));
}

function isIDBody (c) {
  return (c <= CHAR.z && c >= CHAR.a) ||
          c === CHAR.$ ||
         (c <= CHAR.Z && c >= CHAR.A) ||
          c === CHAR.UNDERLINE ||
         (c <= CHAR[9] && c >= CHAR[0]) ||
         (UNICODE.IDC[c >> CONST.D_INTBITLEN] & (1 << (c & CONST.M_INTBITLEN)));
}

function isHex(e) {
  return ( e >= CHAR.a && e <= CHAR.f ) ||
         ( e >= CHAR[0] && e <= CHAR[9] ) ||
         ( e >= CHAR.A && e <= CHAR.F );
}

module.exports.default = module.exports = {
  isIDHead: isIDHead,
  isIDBody: isIDBody,
  isHex: isHex,
  Num: Num,
  num: Num
};

},{"./char.js":40,"./constants.js":42,"./unicode":51}],45:[function(require,module,exports){
var CONST = require('./constants.js');

function fromRunLenCodes(runLenArray, bitm) {
  bitm = bitm || [];
  var bit = runLenArray[0];
  var runLenIdx = 1, bitIdx = 0;
  var runLen = 0;
  while (runLenIdx < runLenArray.length) {
    runLen = runLenArray[runLenIdx];
    while (runLen--) {
      while ((CONST.INTBITLEN * (bitm.length)) < bitIdx) bitm.push(0);
      if (bit) bitm[bitIdx >> CONST.D_INTBITLEN] |= (1 << (CONST.M_INTBITLEN & bitIdx));
      bitIdx++ ;
    }
    runLenIdx++ ;
    bit ^= 1;
  }
  return (bitm);
}

module.exports.default = module.exports = fromRunLenCodes;

},{"./constants.js":42}],46:[function(require,module,exports){
function fromcode(codePoint ) {
  if (codePoint <= 0xFFFF) return String.fromCharCode(codePoint);

  return String.fromCharCode(
    ((codePoint - 0x10000 ) >> 10) + 0x0D800,
    ((codePoint - 0x10000 ) & (1024 - 1)) + 0x0DC00
  );
}

module.exports.default = module.exports = fromcode;

},{}],47:[function(require,module,exports){
module.exports.default = module.exports = Object.prototype.hasOwnProperty;

},{}],48:[function(require,module,exports){
var hexD = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

function hex(number) {
  var str = '';

  str = hexD[number&0xf] + str;
  str = hexD[(number>>=4)&0xf] + str ;
  str = hexD[(number>>=4)&0xf] + str ;
  str = hexD[(number>>=4)&0xf] + str ;

  return str;
}

module.exports.default = module.exports = hex;

},{}],49:[function(require,module,exports){
// ! ~ - + typeof void delete    % ** * /    - +    << >>
// > <= < >= in instanceof   == !=    &    ^   |   ?:    =       ...

var WITH_NO_OP= 0;
var SIMP_ASSIG= WITH_NO_OP + 1  ;
var OP_ASSIG= SIMP_ASSIG + 40 ;
var COND= OP_ASSIG + 1;
var OO= -12 ;

var BOOL_OR= COND + 2;
var BOOL_AND = BOOL_OR + 2 ;
var BIT_OR= BOOL_AND + 2 ;
var XOR= BIT_OR + 2;
var BIT_AND= XOR + 2;
var EQUAL= BIT_AND + 2;
var COMP= EQUAL + 2;
var SH= COMP + 2;
var ADD_MIN= SH + 2;
var MUL= ADD_MIN + 2;
var U= MUL + 1;


var PREC = module.exports.default = module.exports = {

WITH_NO_OP:WITH_NO_OP,
SIMP_ASSIG:SIMP_ASSIG,
OP_ASSIG:OP_ASSIG,
COND:COND,
OO:OO,

BOOL_OR:BOOL_OR,
BOOL_AND :BOOL_AND ,
BIT_OR:BIT_OR,
XOR:XOR,
BIT_AND:BIT_AND,
EQUAL:EQUAL,
COMP:COMP,
SH:SH,
ADD_MIN:ADD_MIN,
MUL:MUL,
U:U
};

   PREC. isAssignment = function (prec) {
    return prec === PREC.SIMP_ASSIG || prec === PREC.OP_ASSIG;
  };

  PREC.isRassoc= function(prec) {
    return prec === PREC.PREC_U;
  };

  PREC. isBin = function(prec) {
    return prec !== PREC.BOOL_OR && prec !== PREC.BOOL_AND;
  };

  PREC. isMMorAA = function(prec) {
    return prec < 0;
  };

  PREC. isQuestion= function(prec) {
    return prec === PREC.COND;
  }


},{}],50:[function(require,module,exports){
var CHAR = require('./char.js');

function toNum (n) {
  return (n >= CHAR[0] && n <= CHAR[9]) ? n - CHAR[0] :
         (n <= CHAR.f && n >= CHAR.a) ? 10 + n - CHAR.a :
         (n >= CHAR.A && n <= CHAR.F) ? 10 + n - CHAR.A : -1;
}

module.exports.default = module.exports = toNum;

},{"./char.js":40}],51:[function(require,module,exports){
var CONST = require('./constants.js');
var fromRunLenCodes = require('./fromRunLenCodes.js');

var IDS_ = fromRunLenCodes([0, 8472, 1, 21, 1, 3948, 2],
  fromRunLenCodes([0, 65, 26, 6, 26, 47, 1, 10, 1, 4, 1, 5, 23, 1, 31, 1, 458,
    4, 12, 14, 5, 7, 1, 1, 1, 129,
    5, 1, 2, 2, 4, 1, 1, 6, 1, 1, 3, 1, 1, 1, 20, 1, 83, 1, 139, 8, 166, 1,
    38, 2, 1, 7, 39, 72, 27, 5, 3, 45, 43, 35, 2,
    1, 99, 1, 1, 15, 2, 7, 2, 10, 3, 2, 1, 16, 1, 1, 30, 29, 89, 11, 1, 24,
    33, 9, 2, 4, 1, 5, 22, 4, 1, 9, 1, 3, 1, 23,
    25, 71, 21, 79, 54, 3, 1, 18, 1, 7, 10, 15, 16, 4, 8, 2, 2, 2, 22, 1, 7,
    1, 1, 3, 4, 3, 1, 16, 1, 13, 2, 1, 3, 14, 2,
    19, 6, 4, 2, 2, 22, 1, 7, 1, 2, 1, 2, 1, 2, 31, 4, 1, 1, 19, 3, 16, 9,
    1, 3, 1, 22, 1, 7, 1, 2, 1, 5, 3, 1, 18, 1, 15,
    2, 23, 1, 11, 8, 2, 2, 2, 22, 1, 7, 1, 2, 1, 5, 3, 1, 30, 2, 1, 3, 15,
    1, 17, 1, 1, 6, 3, 3, 1, 4, 3, 2, 1, 1, 1, 2, 3,
    2, 3, 3, 3, 12, 22, 1, 52, 8, 1, 3, 1, 23, 1, 16, 3, 1, 26, 3, 5, 2, 35,
    8, 1, 3, 1, 23, 1, 10, 1, 5, 3, 1, 32, 1, 1,
    2, 15, 2, 18, 8, 1, 3, 1, 41, 2, 1, 16, 1, 16, 3, 24, 6, 5, 18, 3, 24,
    1, 9, 1, 1, 2, 7, 58, 48, 1, 2, 12, 7, 58, 2,
    1, 1, 2, 2, 1, 1, 2, 1, 6, 4, 1, 7, 1, 3, 1, 1, 1, 1, 2, 2, 1, 4, 1, 2,
    9, 1, 2, 5, 1, 1, 21, 4, 32, 1, 63, 8, 1, 36, 27,
    5, 115, 43, 20, 1, 16, 6, 4, 4, 3, 1, 3, 2, 7, 3, 4, 13, 12, 1, 17, 38,
    1, 1, 5, 1, 2, 43, 1, 333, 1, 4, 2, 7, 1, 1,
    1, 4, 2, 41, 1, 4, 2, 33, 1, 4, 2, 7, 1, 1, 1, 4, 2, 15, 1, 57, 1, 4, 2,
    67, 37, 16, 16, 86, 2, 6, 3, 620, 2, 17, 1,
    26, 5, 75, 3, 11, 7, 13, 1, 4, 14, 18, 14, 18, 14, 13, 1, 3, 15, 52, 35,
    1, 4, 1, 67, 88, 8, 41, 1, 1, 5, 70, 10,
    31, 49, 30, 2, 5, 11, 44, 4, 26, 54, 23, 9, 53, 82, 1, 93, 47, 17, 7,
    55, 30, 13, 2, 10, 44, 26, 36, 41, 3, 10,
    36, 107, 4, 1, 4, 3, 2, 9, 192, 64, 278, 2, 6, 2, 38, 2, 6, 2, 8, 1, 1,
    1, 1, 1, 1, 1, 31, 2, 53, 1, 7, 1, 1, 3, 3, 1,
    7, 3, 4, 2, 6, 4, 13, 5, 3, 1, 7, 116, 1, 13, 1, 16, 13, 101, 1, 4, 1,
    2, 10, 1, 1, 2, 6, 6, 1, 1, 1, 1, 1, 1, 16, 2,
    4, 5, 5, 4, 1, 17, 41, 2679, 47, 1, 47, 1, 133, 6, 4, 3, 2, 12, 38, 1,
    1, 5, 1, 2, 56, 7, 1, 16, 23, 9, 7, 1, 7, 1,
    7, 1, 7, 1, 7, 1, 7, 1, 7, 1, 7, 550, 3, 25, 9, 7, 5, 2, 5, 4, 86, 4, 5,
    1, 90, 1, 4, 5, 41, 3, 94, 17, 27, 53, 16, 512,
    6582, 74, 20950, 42, 1165, 67, 46, 2, 269, 3, 16, 10, 2, 20, 47, 16, 31,
    2, 80, 39, 9, 2, 103, 2, 35, 2, 8, 63,
    11, 1, 3, 1, 4, 1, 23, 29, 52, 14, 50, 62, 6, 3, 1, 1, 1, 12, 28, 10,
    23, 25, 29, 7, 47, 28, 1, 16, 5, 1, 10, 10,
    5, 1, 41, 23, 3, 1, 8, 20, 23, 3, 1, 3, 50, 1, 1, 3, 2, 2, 5, 2, 1, 1,
    1, 24, 3, 2, 11, 7, 3, 12, 6, 2, 6, 2, 6, 9, 7,
    1, 7, 1, 43, 1, 10, 10, 115, 29, 11172, 12, 23, 4, 49, 8452, 366, 2,
    106, 38, 7, 12, 5, 5, 1, 1, 10, 1, 13, 1,
    5, 1, 1, 1, 2, 1, 2, 1, 108, 33, 363, 18, 64, 2, 54, 40, 12, 116, 5, 1,
    135, 36, 26, 6, 26, 11, 89, 3, 6, 2, 6, 2,
    6, 2, 3, 35, 12, 1, 26, 1, 19, 1, 2, 1, 15, 2, 14, 34, 123, 69, 53, 267,
    29, 3, 49, 47, 32, 16, 27, 5, 38, 10, 30,
    2, 36, 4, 8, 1, 5, 42, 158, 98, 40, 8, 52, 156, 311, 9, 22, 10, 8, 152,
    6, 2, 1, 1, 44, 1, 2, 3, 1, 2, 23, 10, 23,
    9, 31, 65, 19, 1, 2, 10, 22, 10, 26, 70, 56, 6, 2, 64, 1, 15, 4, 1, 3,
    1, 27, 44, 29, 3, 29, 35, 8, 1, 28, 27, 54,
    10, 22, 10, 19, 13, 18, 110, 73, 55, 51, 13, 51, 784, 53, 75, 45, 32,
    25, 26, 36, 41, 35, 3, 1, 12, 48, 14, 4,
    21, 1, 1, 1, 35, 18, 1, 25, 84, 7, 1, 1, 1, 4, 1, 15, 1, 10, 7, 47, 38,
    8, 2, 2, 2, 22, 1, 7, 1, 2, 1, 5, 3, 1, 18, 1,
    12, 5, 286, 48, 20, 2, 1, 1, 184, 47, 41, 4, 36, 48, 20, 1, 59, 43, 85,
    26, 390, 64, 31, 1, 448, 57, 1287, 922,
    102, 111, 17, 196, 2748, 1071, 4049, 583, 8633, 569, 7, 31, 113, 30, 18,
    48, 16, 4, 31, 21, 5, 19, 880, 69,
    11, 1, 66, 13, 16480, 2, 3070, 107, 5, 13, 3, 9, 7, 10, 5990, 85, 1, 71,
    1, 2, 2, 1, 2, 2, 2, 4, 1, 12, 1, 1, 1,
    7, 1, 65, 1, 4, 2, 8, 1, 7, 1, 28, 1, 4, 1, 5, 1, 1, 3, 7, 1, 340, 2,
    25, 1, 25, 1, 31, 1, 25, 1, 31, 1, 25, 1, 31, 1,
    25, 1, 31, 1, 25, 1, 8, 4148, 197, 1339, 4, 1, 27, 1, 2, 1, 1, 2, 1, 1,
    10, 1, 4, 1, 1, 1, 1, 6, 1, 4, 1, 1, 1, 1, 1,
    1, 3, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 4, 1, 7,
    1, 4, 1, 4, 1, 1, 1, 10, 1, 17, 5, 3, 1, 5, 1, 17,
    4420, 42711, 41, 4149, 11, 222, 2, 5762, 10590, 542
  ]));
var IDC_ = fromRunLenCodes([0, 183, 1, 719, 1, 4065, 9, 1640, 1],
  fromRunLenCodes(([0,
    48, 10, 7, 26, 4, 1, 1, 26, 47, 1, 10, 1, 1, 1, 2, 1, 5, 23, 1, 31, 1,
    458, 4, 12, 14, 5, 7, 1, 1, 1, 17, 117, 1, 2,
    2, 4, 1, 1, 6, 5, 1, 1, 1, 20, 1, 83, 1, 139, 1, 5, 2, 166, 1, 38, 2,
    1, 7, 39, 9, 45, 1, 1, 1, 2, 1, 2, 1, 1, 8, 27,
    5, 3, 29, 11, 5, 74, 4, 102, 1, 8, 2, 10, 1, 19, 2, 1, 16, 59, 2, 101,
    14, 54, 4, 1, 5, 46, 18, 28, 68, 21, 46, 129,
    2, 10, 1, 19, 1, 8, 2, 2, 2, 22, 1, 7, 1, 1, 3, 4, 2, 9, 2, 2, 2, 4,
    8, 1, 4, 2, 1, 5, 2, 12, 15, 3, 1, 6, 4, 2, 2, 22,
    1, 7, 1, 2, 1, 2, 1, 2, 2, 1, 1, 5, 4, 2, 2, 3, 3, 1, 7, 4, 1, 1, 7,
    16, 11, 3, 1, 9, 1, 3, 1, 22, 1, 7, 1, 2, 1, 5, 2, 10,
    1, 3, 1, 3, 2, 1, 15, 4, 2, 10, 9, 1, 7, 3, 1, 8, 2, 2, 2, 22, 1, 7,
    1, 2, 1, 5, 2, 9, 2, 2, 2, 3, 8, 2, 4, 2, 1, 5, 2, 10,
    1, 1, 16, 2, 1, 6, 3, 3, 1, 4, 3, 2, 1, 1, 1, 2, 3, 2, 3, 3, 3, 12, 4,
    5, 3, 3, 1, 4, 2, 1, 6, 1, 14, 10, 16, 4, 1, 8, 1,
    3, 1, 23, 1, 16, 3, 8, 1, 3, 1, 4, 7, 2, 1, 3, 5, 4, 2, 10, 17, 3, 1,
    8, 1, 3, 1, 23, 1, 10, 1, 5, 2, 9, 1, 3, 1, 4, 7,
    2, 7, 1, 1, 4, 2, 10, 1, 2, 14, 3, 1, 8, 1, 3, 1, 41, 2, 8, 1, 3, 1,
    5, 8, 1, 7, 5, 2, 10, 10, 6, 2, 2, 1, 18, 3, 24, 1,
    9, 1, 1, 2, 7, 3, 1, 4, 6, 1, 1, 1, 8, 6, 10, 2, 2, 13, 58, 5, 15, 1,
    10, 39, 2, 1, 1, 2, 2, 1, 1, 2, 1, 6, 4, 1, 7, 1,
    3, 1, 1, 1, 1, 2, 2, 1, 13, 1, 3, 2, 5, 1, 1, 1, 6, 2, 10, 2, 4, 32,
    1, 23, 2, 6, 10, 11, 1, 1, 1, 1, 1, 4, 10, 1, 36,
    4, 20, 1, 18, 1, 36, 9, 1, 57, 74, 6, 78, 2, 38, 1, 1, 5, 1, 2, 43, 1,
    333, 1, 4, 2, 7, 1, 1, 1, 4, 2, 41, 1, 4, 2, 33,
    1, 4, 2, 7, 1, 1, 1, 4, 2, 15, 1, 57, 1, 4, 2, 67, 2, 3, 9, 9, 14, 16,
    16, 86, 2, 6, 3, 620, 2, 17, 1, 26, 5, 75, 3,
    11, 7, 13, 1, 7, 11, 21, 11, 20, 12, 13, 1, 3, 1, 2, 12, 84, 3, 1, 4,
    2, 2, 10, 33, 3, 2, 10, 6, 88, 8, 43, 5, 70,
    10, 31, 1, 12, 4, 12, 10, 40, 2, 5, 11, 44, 4, 26, 6, 11, 37, 28, 4,
    63, 1, 29, 2, 11, 6, 10, 13, 1, 8, 14, 66, 76,
    4, 10, 17, 9, 12, 116, 12, 56, 8, 10, 3, 49, 82, 3, 1, 35, 1, 2, 6,
    246, 6, 282, 2, 6, 2, 38, 2, 6, 2, 8, 1, 1, 1,
    1, 1, 1, 1, 31, 2, 53, 1, 7, 1, 1, 3, 3, 1, 7, 3, 4, 2, 6, 4, 13, 5,
    3, 1, 7, 66, 2, 19, 1, 28, 1, 13, 1, 16, 13, 51,
    13, 4, 1, 3, 12, 17, 1, 4, 1, 2, 10, 1, 1, 2, 6, 6, 1, 1, 1, 1, 1, 1,
    16, 2, 4, 5, 5, 4, 1, 17, 41, 2679, 47, 1, 47,
    1, 133, 6, 9, 12, 38, 1, 1, 5, 1, 2, 56, 7, 1, 15, 24, 9, 7, 1, 7, 1,
    7, 1, 7, 1, 7, 1, 7, 1, 7, 1, 7, 1, 32, 517, 3,
    25, 15, 1, 5, 2, 5, 4, 86, 2, 7, 1, 90, 1, 4, 5, 41, 3, 94, 17, 27,
    53, 16, 512, 6582, 74, 20950, 42, 1165, 67,
    46, 2, 269, 3, 28, 20, 48, 4, 10, 1, 115, 37, 9, 2, 103, 2, 35, 2, 8,
    63, 49, 24, 52, 12, 69, 11, 10, 6, 24, 3,
    1, 1, 1, 2, 46, 2, 36, 12, 29, 3, 65, 14, 11, 6, 31, 1, 55, 9, 14, 2,
    10, 6, 23, 3, 73, 24, 3, 2, 16, 2, 5, 10, 6,
    2, 6, 2, 6, 9, 7, 1, 7, 1, 43, 1, 10, 10, 123, 1, 2, 2, 10, 6, 11172,
    12, 23, 4, 49, 8452, 366, 2, 106, 38, 7, 12,
    5, 5, 12, 1, 13, 1, 5, 1, 1, 1, 2, 1, 2, 1, 108, 33, 363, 18, 64, 2,
    54, 40, 12, 4, 16, 16, 16, 3, 2, 24, 3, 32, 5,
    1, 135, 19, 10, 7, 26, 4, 1, 1, 26, 11, 89, 3, 6, 2, 6, 2, 6, 2, 3,
    35, 12, 1, 26, 1, 19, 1, 2, 1, 15, 2, 14, 34, 123,
    69, 53, 136, 1, 130, 29, 3, 49, 15, 1, 31, 32, 16, 27, 5, 43, 5, 30,
    2, 36, 4, 8, 1, 5, 42, 158, 2, 10, 86, 40,
    8, 52, 156, 311, 9, 22, 10, 8, 152, 6, 2, 1, 1, 44, 1, 2, 3, 1, 2, 23,
    10, 23, 9, 31, 65, 19, 1, 2, 10, 22, 10, 26,
    70, 56, 6, 2, 64, 4, 1, 2, 5, 8, 1, 3, 1, 27, 4, 3, 4, 1, 32, 29, 3,
    29, 35, 8, 1, 30, 25, 54, 10, 22, 10, 19, 13,
    18, 110, 73, 55, 51, 13, 51, 781, 71, 31, 10, 15, 60, 21, 25, 7, 10,
    6, 53, 1, 10, 16, 36, 2, 1, 9, 69, 5, 3, 3,
    11, 1, 1, 35, 18, 1, 37, 72, 7, 1, 1, 1, 4, 1, 15, 1, 10, 7, 59, 5,
    10, 6, 4, 1, 8, 2, 2, 2, 22, 1, 7, 1, 2, 1, 5, 2,
    9, 2, 2, 2, 3, 2, 1, 6, 1, 5, 7, 2, 7, 3, 5, 267, 70, 1, 1, 8, 10,
    166, 54, 2, 9, 23, 6, 34, 65, 3, 1, 11, 10, 38, 56,
    8, 10, 54, 26, 3, 15, 4, 10, 358, 74, 21, 1, 448, 57, 1287, 922, 102,
    111, 17, 196, 2748, 1071, 4049, 583,
    8633, 569, 7, 31, 1, 10, 102, 30, 2, 5, 11, 55, 9, 4, 12, 10, 9, 21,
    5, 19, 880, 69, 11, 47, 16, 17, 16480, 2,
    3070, 107, 5, 13, 3, 9, 7, 10, 3, 2, 5318, 5, 3, 6, 8, 8, 2, 7, 30, 4,
    148, 3, 443, 85, 1, 71, 1, 2, 2, 1, 2, 2, 2,
    4, 1, 12, 1, 1, 1, 7, 1, 65, 1, 4, 2, 8, 1, 7, 1, 28, 1, 4, 1, 5, 1,
    1, 3, 7, 1, 340, 2, 25, 1, 25, 1, 31, 1, 25, 1, 31,
    1, 25, 1, 31, 1, 25, 1, 31, 1, 25, 1, 8, 2, 50, 512, 55, 4, 50, 8, 1,
    14, 1, 22, 5, 1, 15, 3408, 197, 11, 7, 1321,
    4, 1, 27, 1, 2, 1, 1, 2, 1, 1, 10, 1, 4, 1, 1, 1, 1, 6, 1, 4, 1, 1, 1,
    1, 1, 1, 3, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 2, 1, 1, 2, 4, 1, 7, 1, 4, 1, 4, 1, 1, 1, 10, 1, 17, 5, 3, 1, 5,
    1, 17, 4420, 42711, 41, 4149, 11, 222, 2, 5762,
    10590, 542, 722658, 240
  ])));

function set(bits, i) {
  bits[i >> CONST.D_INTBITLEN] |= (1 << (i & CONST.M_INTBITLEN));
}
set(IDC_, 0x200C);
set(IDC_, 0x200D);

module.exports = {
  IDS: IDS_,
  IDC: IDC_,
  set: set
};

},{"./constants.js":42,"./fromRunLenCodes.js":45}]},{},[2])(2)
});