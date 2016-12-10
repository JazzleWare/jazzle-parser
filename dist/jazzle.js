(function(){
"use strict";
;
function ErrorString(stringsAndTemplates) {
  this.stringsAndTemplates = stringsAndTemplates;
}

function eof_rcurly(str, i) {
  if (i >= str.length)
    ASSERT.call(this, false, 'reached eof before a }');

  return str.charCodeAt(i) === CHAR_RCURLY; 
}

function readTemplate(str, i) {
  if (str.charCodeAt(i) === CHAR_RCURLY)
    return null;
  return Template.from(str, i, eof_rcurly);
}

ErrorString.from = function(str) {
  var elem = "", i = 0, list = [];
  while (i < str.length) {
    if (str.charCodeAt(i) === CHAR_LCURLY) {
      i++;
      var template = readTemplate(str, i);
      if (template === null)
        elem += '{';
      else {
        list.push(elem);
        list.push(template);
        elem = "";
        i += template.str.length;
      }
    }
    else
      elem += str.charAt(i);
    
    i++;
  }
  if (elem.length)
    list.push(elem);

  var error = new ErrorString(list);
  error.str = str;

  return error;
};
;
var Parser = function (src, isModule) {

  this.src = src;

  this.unsatisfiedAssignment = null;
  this.unsatisfiedArg = null;
  this.unsatisfiedLabel = null;

  this.newLineBeforeLookAhead = false;

  this.ltval = null;
  this.lttype= "";
  this.ltraw = "" ;
  this.prec = 0 ;
  this.isVDT = VDT_NONE;

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
  this.tight = !!isModule ;

  this.parenYS = null;
  this.firstNonSimpArg = null;

  this.isScript = !isModule;
  this.v = 12/2;

  this.firstParen = null;
  this.firstUnassignable = null;

  this.firstElemWithYS = null;
  this.firstYS = null;
  
  this.throwReserved = true;
 
  this.errorHandlers = {};
  this.errorHandlerOutput = null;

  this.arrowParen = false;
  this.firstEA = null;
  this.firstEAContainer = null;
  this.defaultEA = null;

  this.first__proto__ = false;
  this.firstNonTailRest = null;

  this.scope = null;
  this.directive = DIRECTIVE_NONE;
  
  this.declMode = DECL_MODE_NONE;
};

;
function Scope(parent, type) {
  this.type = type;

  if (!parent) 
    ASSERT.call(this.isConcrete(), 'sub-scopes must have a parent');

  this.parent = parent;
  this.funcScope = 
     this.isConcrete() ? this : this.parent.funcScope;

  this.definedNames = {};


  this.idNames = {};
  this.isInComplexArgs = false;
  this.strict = this.parent ? this.parent.strict : false;
  this.synth = false;
  
}

Scope.createFunc = function(parent, decl) {
  var scope = new Scope(parent, decl ?
       SCOPE_TYPE_FUNCTION_DECLARATION :
       SCOPE_TYPE_FUNCTION_EXPRESSION );
  return scope;
};

Scope.createLexical = function(parent, loop) {
   return new Scope(parent, !loop ?
        SCOPE_TYPE_LEXICAL_SIMPLE :
        SCOPE_TYPE_LEXICAL_LOOP);
};
;
function Template(idxList) {
  this.idxList = idxList;
  this.str = "";
}

function readParen(str, i, eof) {
  var elem = "";
  while (!eof(str, i)) {
    switch (str.charCodeAt(i)) {
    case CHAR_SINGLEDOT: elem += '.'; break;
    case CHAR_GREATER_THAN: elem += ')'; break;
    case CHAR_LESS_THAN: elem += '('; break;
    case CHAR_RPAREN: return elem;
    default:
      ASSERT.call(this, false, 
        'invalid character at index '+i+' -- "'+str.charAt(i)+'"');
    }
    i++;
  }
  ASSERT.call(this, false, 
    'reached eof before any ")" was found');
}

function eof_default(str, i) {
  return i >= str.length;
}

Template.from = function(str, i, eof) {
  i = i || 0;
  eof = eof || eof_default;
  var start = i, needDot = false, list = [], pendingDot = false, elem = "";
  while (!eof(str, i)) {
    var ch = str.charCodeAt(i);
    if (ch === CHAR_SINGLEDOT) {
      if (pendingDot)
        break;

      i++;
      list.push(elem);
      elem = "";
      if (needDot)
        needDot = false;

      pendingDot = true;
      continue;
    }
    if (needDot)
      ASSERT.call(this, false, 'dot expected at index'+(i-1));

    pendingDot = false;
    if (ch === CHAR_LPAREN) {
      i++;
      elem += readParen(str, i, eof);
      if (elem.length === 0)
        needDot = true; 
      
      i += elem.length + 1; // length + ')'.length
      continue;
    }

    // TODO: can be faster, yet for its limited use case it looks fast enough
    elem += str.charAt(i);
    i++;
  }

  pendingDot && ASSERT.call(this, false, 
    'unexpected ' + (!eof(str, i) ? 'dot (index='+i+')' : 'eof'));

  if (needDot || elem.length > 0)
    list.push(elem);

  var template = new Template(list);
  template.str = (start === 0 && i === str.length) ?
    str :
    str.substring(start, i);

  return template;
};
;
var CHAR_1 = char2int('1'),
    CHAR_2 = char2int('2'),
    CHAR_3 = char2int('3'),
    CHAR_4 = char2int('4'),
    CHAR_5 = char2int('5'),
    CHAR_6 = char2int('6'),
    CHAR_7 = char2int('7'),
    CHAR_8 = char2int('8'),
    CHAR_9 = char2int('9'),
    CHAR_0 = char2int('0'),

    CHAR_a = char2int('a'), CHAR_A = char2int('A'),
    CHAR_b = char2int('b'), CHAR_B = char2int('B'),
    CHAR_e = char2int('e'), CHAR_E = char2int('E'),
    CHAR_g = char2int('g'),
    CHAR_f = char2int('f'), CHAR_F = char2int('F'),
    CHAR_i = char2int('i'),
    CHAR_m = char2int('m'),
    CHAR_n = char2int('n'),
    CHAR_o = char2int('o'), CHAR_O = char2int('O'),
    CHAR_r = char2int('r'),
    CHAR_t = char2int('t'),
    CHAR_u = char2int('u'), CHAR_U = char2int('U'),
    CHAR_v = char2int('v'), CHAR_X = char2int('X'),
    CHAR_x = char2int('x'),
    CHAR_y = char2int('y'),
    CHAR_z = char2int('z'), CHAR_Z = char2int('Z'),

    CHAR_UNDERLINE = char2int('_'),
    CHAR_$ = char2int('$'),

    CHAR_TAB = char2int('\t'),
    CHAR_CARRIAGE_RETURN = char2int('\r'),
    CHAR_LINE_FEED = char2int('\n'),
    CHAR_VTAB = char2int('\v'),
    CHAR_FORM_FEED   = char2int( '\f') ,

    CHAR_WHITESPACE = char2int(' '),

    CHAR_BACKTICK = char2int('`'),
    CHAR_SINGLE_QUOTE = char2int('\''),
    CHAR_MULTI_QUOTE = char2int('"'),
    CHAR_BACK_SLASH = char2int(('\\')),

    CHAR_DIV = char2int('/'),
    CHAR_MUL = char2int('*'),
    CHAR_MIN = char2int('-'),
    CHAR_ADD = char2int('+'),
    CHAR_AND = char2int('&'),
    CHAR_XOR = char2int('^'),
    CHAR_MODULO = char2int('%'),
    CHAR_OR = char2int('|'),
    CHAR_EQUALITY_SIGN = char2int('='),

    CHAR_SEMI = char2int(';'),
    CHAR_COMMA = char2int(','),
    CHAR_SINGLEDOT = char2int('.'),
    CHAR_COLON = char2int((':')),
    CHAR_QUESTION = char2int('?'),

    CHAR_EXCLAMATION = char2int('!'),
    CHAR_COMPLEMENT = char2int('~'),

    CHAR_ATSIGN = char2int('@'),

    CHAR_LPAREN = char2int('('),
    CHAR_RPAREN = char2int(')'),
    CHAR_LSQBRACKET = char2int('['),
    CHAR_RSQBRACKET = char2int(']'),
    CHAR_LCURLY = char2int('{'),
    CHAR_RCURLY = char2int('}'),
    CHAR_LESS_THAN = char2int('<'),
    CHAR_GREATER_THAN = char2int('>')
 ;

var INTBITLEN = (function() { var i = 0;
  while ( 0 < (1 << (i++)))
     if (i >= 512) return 8;

  return i;
}());


var D_INTBITLEN = 0, M_INTBITLEN = INTBITLEN - 1;
while ( M_INTBITLEN >> (++D_INTBITLEN) );

var PAREN = 'paren';

var STRING_TYPE = typeof "string";
var NUMBER_TYPE = typeof 0;
var HAS = {}.hasOwnProperty;

function ASSERT(cond, message) { if (!cond) throw new Error(message); }

var SCOPE_TYPE_FUNCTION_EXPRESSION = 1;
var SCOPE_TYPE_FUNCTION_DECLARATION = SCOPE_TYPE_FUNCTION_EXPRESSION|2;
var SCOPE_TYPE_LEXICAL_SIMPLE = 8;
var SCOPE_TYPE_LEXICAL_LOOP = SCOPE_TYPE_LEXICAL_SIMPLE|16;
var SCOPE_TYPE_SCRIPT = 32;
var SCOPE_TYPE_CATCH = 128;
var SCOPE_TYPE_GLOBAL = 256;

var CONTEXT_NONE = 0,
    CONTEXT_ELEM = 1,
    CONTEXT_FOR = CONTEXT_ELEM << 1,
    CONTEXT_PARAM = CONTEXT_FOR << 1,
    CONTEXT_ELEM_OR_PARAM = CONTEXT_ELEM|CONTEXT_PARAM,
    CONTEXT_UNASSIGNABLE_CONTAINER = CONTEXT_PARAM << 1,
    CONTEXT_NULLABLE = CONTEXT_UNASSIGNABLE_CONTAINER << 1,
    CONTEXT_DEFAULT = CONTEXT_NULLABLE << 1;

// TODO: order matters in the first few declarations below, mostly due to a 
// slight performance gain in parseFunc, where MEM_CONSTRUCTOR and MEM_SUPER in `flags` are
// getting added to the current scope flags.
// the ordering is also to make the relevant value sets (i.e., SCOPE_FLAG_* and MEM_*)
// span less bit lengths; this order sensitivity is something that must change in a very
// near future.
var MEM_CLASS = 1, 
    MEM_GEN = MEM_CLASS << 1,
   
    SCOPE_FLAG_GEN = MEM_GEN,
    SCOPE_FLAG_ALLOW_YIELD_EXPR = SCOPE_FLAG_GEN,

    MEM_SUPER = MEM_GEN << 1,
    SCOPE_FLAG_ALLOW_SUPER = MEM_SUPER,    

    MEM_CONSTRUCTOR = MEM_SUPER << 1,
    SCOPE_FLAG_IN_CONSTRUCTOR = MEM_CONSTRUCTOR,

    SCOPE_FLAG_BREAK = SCOPE_FLAG_IN_CONSTRUCTOR << 1,
    SCOPE_FLAG_CONTINUE = SCOPE_FLAG_BREAK << 1,
    SCOPE_FLAG_FN = SCOPE_FLAG_CONTINUE << 1,
    SCOPE_FLAG_ARG_LIST = SCOPE_FLAG_FN << 1,
    SCOPE_FLAG_IN_BLOCK = SCOPE_FLAG_ARG_LIST << 1,
    SCOPE_FLAG_IN_IF = SCOPE_FLAG_IN_BLOCK << 1,
    SCOPE_FLAG_ALLOW_RETURN_STMT = SCOPE_FLAG_FN,
    SCOPE_FLAG_CONSTRUCTOR_WITH_SUPER = SCOPE_FLAG_IN_CONSTRUCTOR|SCOPE_FLAG_ALLOW_SUPER,
    SCOPE_FLAG_NONE = 0,
    INHERITED_SCOPE_FLAGS = SCOPE_FLAG_ALLOW_SUPER|MEM_CONSTRUCTOR,
    CLEAR_IB = ~(SCOPE_FLAG_IN_BLOCK|SCOPE_FLAG_IN_IF),

    MEM_OBJ = MEM_CONSTRUCTOR << 1,
    MEM_SET = MEM_OBJ << 1,
    MEM_GET = MEM_SET << 1,
    MEM_STATIC = MEM_GET << 1,
    MEM_PROTOTYPE = MEM_STATIC << 1,
    MEM_OBJ_METH = MEM_PROTOTYPE << 1,
    MEM_PROTO = MEM_OBJ_METH << 1,
    CONTEXT_PROTO = MEM_PROTO,
    MEM_HAS_CONSTRUCTOR = MEM_PROTO << 1,
    MEM_ACCESSOR = MEM_GET|MEM_SET,
    MEM_SPECIAL = MEM_ACCESSOR|MEM_GEN,
    MEM_FLAGS = MEM_CLASS|MEM_SPECIAL|MEM_CONSTRUCTOR|
                MEM_PROTO|MEM_SUPER|MEM_OBJ_METH|MEM_PROTOTYPE,
    MEM_ANY = MEM_CLASS|MEM_OBJ_METH|MEM_SPECIAL|MEM_ACCESSOR|MEM_GEN,
    MEM_CLASS_OR_OBJ = MEM_CLASS|MEM_OBJ;

var ARGLEN_GET = 0,
    ARGLEN_SET = 1,
    ARGLEN_ANY = -1;

var DECL_MODE_VAR = 1,
    DECL_MODE_LET = 2,
    DECL_MODE_NONE = 0,
    DECL_MODE_FUNCTION_PARAMS = 4|DECL_MODE_VAR,
    DECL_MODE_CATCH_PARAMS = 8,
    DECL_MODE_FUNCTION_DECL = 32|DECL_MODE_VAR,
    DECL_MODE_FUNCTION_EXPR = 128|DECL_MODE_LET,
    DECL_MODE_CLASS_DECL = 256|DECL_MODE_VAR,
    DECL_MODE_CLASS_EXPR = 512|DECL_MODE_LET;

var DECL_NOT_FOUND = 
  DECL_MODE_NONE;

var DECL_BASE = DECL_MODE_VAR|DECL_MODE_LET;

var DECL_DUPE = 64;

var VDT_VOID = 1;
var VDT_TYPEOF = 2;
var VDT_NONE = 0;
var VDT_DELETE = 4;

var DIRECTIVE_TOP = 1,
    DIRECTIVE_FUNC = 2,
    DIRECTIVE_NONE = 0,
    DIRECTIVE_MODULE = DIRECTIVE_TOP,
    DIRECTIVE_SCRIPT = DIRECTIVE_MODULE;
;
var Num,num = Num = function (c) { return (c >= CHAR_0 && c <= CHAR_9)};
function isIDHead(c) {
  return (c <= CHAR_z && c >= CHAR_a) ||
          c === CHAR_$ ||
         (c <= CHAR_Z && c >= CHAR_A) ||
          c === CHAR_UNDERLINE ||
         (IDS_[c >> D_INTBITLEN] & (1 << (c & M_INTBITLEN)));
};

function isIDBody (c) {
  return (c <= CHAR_z && c >= CHAR_a) ||
          c === CHAR_$ ||
         (c <= CHAR_Z && c >= CHAR_A) ||
          c === CHAR_UNDERLINE ||
         (c <= CHAR_9 && c >= CHAR_0) ||
         (IDC_[c >> D_INTBITLEN] & (1 << (c & M_INTBITLEN)));
};

function isHex(e) {
    return ( e >= CHAR_a && e <= CHAR_f ) ||
           ( e >= CHAR_0 && e <= CHAR_9 ) ||
           ( e >= CHAR_A && e <= CHAR_F );
}


;
// ! ~ - + typeof void delete    % ** * /    - +    << >>
// > <= < >= in instanceof   === !==    &    ^   |   ?:    =       ...



var PREC_WITH_NO_OP = 0;
var PREC_SIMP_ASSIG = PREC_WITH_NO_OP + 1  ;
var PREC_OP_ASSIG = PREC_SIMP_ASSIG + 40 ;
var PREC_COND = PREC_OP_ASSIG + 1;
var PREC_OO = -12 ;

var PREC_BOOL_OR = PREC_COND + 2;
var PREC_BOOL_AND  = PREC_BOOL_OR + 2 ;
var PREC_BIT_OR = PREC_BOOL_AND + 2 ;
var PREC_XOR = PREC_BIT_OR + 2;
var PREC_BIT_AND = PREC_XOR + 2;
var PREC_EQUAL = PREC_BIT_AND + 2;
var PREC_COMP = PREC_EQUAL + 2;
var PREC_SH = PREC_COMP + 2;
var PREC_ADD_MIN = PREC_SH + 2;
var PREC_MUL = PREC_ADD_MIN + 2;
var PREC_U = PREC_MUL + 1;

function isAssignment(prec) { return prec === PREC_SIMP_ASSIG || prec === PREC_OP_ASSIG ;  }
function isRassoc(prec) { return prec === PREC_U ; }
function isBin(prec) { return prec !== PREC_BOOL_OR && prec !== PREC_BOOL_AND ;  }
function isMMorAA(prec) { return prec < 0 ;  }
function isQuestion(prec) { return prec === PREC_COND  ; }


;

var SCOPE_FUNC = 1, SCOPE_CATCH = 2, SCOPE_LEXICAL = 0;

var REF_I = 1, REF_D = 2;

var has = Object.hasOwnProperty; 

var VAR_DEF = 1, LET_OR_CONST = 2;
     
var SCOPE_LOOP = 4;

;
var IDS_ = fromRunLenCodes([0,8472,1,21,1,3948,2],
 fromRunLenCodes([0,65,26,6,26,47,1,10,1,4,1,5,23,1,31,1,458,4,12,14,5,7,1,1,1,129,
5,1,2,2,4,1,1,6,1,1,3,1,1,1,20,1,83,1,139,8,166,1,38,2,1,7,39,72,27,5,3,45,43,35,2,
1,99,1,1,15,2,7,2,10,3,2,1,16,1,1,30,29,89,11,1,24,33,9,2,4,1,5,22,4,1,9,1,3,1,23,
25,71,21,79,54,3,1,18,1,7,10,15,16,4,8,2,2,2,22,1,7,1,1,3,4,3,1,16,1,13,2,1,3,14,2,
19,6,4,2,2,22,1,7,1,2,1,2,1,2,31,4,1,1,19,3,16,9,1,3,1,22,1,7,1,2,1,5,3,1,18,1,15,
2,23,1,11,8,2,2,2,22,1,7,1,2,1,5,3,1,30,2,1,3,15,1,17,1,1,6,3,3,1,4,3,2,1,1,1,2,3,
2,3,3,3,12,22,1,52,8,1,3,1,23,1,16,3,1,26,3,5,2,35,8,1,3,1,23,1,10,1,5,3,1,32,1,1,
2,15,2,18,8,1,3,1,41,2,1,16,1,16,3,24,6,5,18,3,24,1,9,1,1,2,7,58,48,1,2,12,7,58,2,
1,1,2,2,1,1,2,1,6,4,1,7,1,3,1,1,1,1,2,2,1,4,1,2,9,1,2,5,1,1,21,4,32,1,63,8,1,36,27,
5,115,43,20,1,16,6,4,4,3,1,3,2,7,3,4,13,12,1,17,38,1,1,5,1,2,43,1,333,1,4,2,7,1,1,
1,4,2,41,1,4,2,33,1,4,2,7,1,1,1,4,2,15,1,57,1,4,2,67,37,16,16,86,2,6,3,620,2,17,1,
26,5,75,3,11,7,13,1,4,14,18,14,18,14,13,1,3,15,52,35,1,4,1,67,88,8,41,1,1,5,70,10,
31,49,30,2,5,11,44,4,26,54,23,9,53,82,1,93,47,17,7,55,30,13,2,10,44,26,36,41,3,10,
36,107,4,1,4,3,2,9,192,64,278,2,6,2,38,2,6,2,8,1,1,1,1,1,1,1,31,2,53,1,7,1,1,3,3,1,
7,3,4,2,6,4,13,5,3,1,7,116,1,13,1,16,13,101,1,4,1,2,10,1,1,2,6,6,1,1,1,1,1,1,16,2,
4,5,5,4,1,17,41,2679,47,1,47,1,133,6,4,3,2,12,38,1,1,5,1,2,56,7,1,16,23,9,7,1,7,1,
7,1,7,1,7,1,7,1,7,1,7,550,3,25,9,7,5,2,5,4,86,4,5,1,90,1,4,5,41,3,94,17,27,53,16,512,
6582,74,20950,42,1165,67,46,2,269,3,16,10,2,20,47,16,31,2,80,39,9,2,103,2,35,2,8,63,
11,1,3,1,4,1,23,29,52,14,50,62,6,3,1,1,1,12,28,10,23,25,29,7,47,28,1,16,5,1,10,10,
5,1,41,23,3,1,8,20,23,3,1,3,50,1,1,3,2,2,5,2,1,1,1,24,3,2,11,7,3,12,6,2,6,2,6,9,7,
1,7,1,43,1,10,10,115,29,11172,12,23,4,49,8452,366,2,106,38,7,12,5,5,1,1,10,1,13,1,
5,1,1,1,2,1,2,1,108,33,363,18,64,2,54,40,12,116,5,1,135,36,26,6,26,11,89,3,6,2,6,2,
6,2,3,35,12,1,26,1,19,1,2,1,15,2,14,34,123,69,53,267,29,3,49,47,32,16,27,5,38,10,30,
2,36,4,8,1,5,42,158,98,40,8,52,156,311,9,22,10,8,152,6,2,1,1,44,1,2,3,1,2,23,10,23,
9,31,65,19,1,2,10,22,10,26,70,56,6,2,64,1,15,4,1,3,1,27,44,29,3,29,35,8,1,28,27,54,
10,22,10,19,13,18,110,73,55,51,13,51,784,53,75,45,32,25,26,36,41,35,3,1,12,48,14,4,
21,1,1,1,35,18,1,25,84,7,1,1,1,4,1,15,1,10,7,47,38,8,2,2,2,22,1,7,1,2,1,5,3,1,18,1,
12,5,286,48,20,2,1,1,184,47,41,4,36,48,20,1,59,43,85,26,390,64,31,1,448,57,1287,922,
102,111,17,196,2748,1071,4049,583,8633,569,7,31,113,30,18,48,16,4,31,21,5,19,880,69,
11,1,66,13,16480,2,3070,107,5,13,3,9,7,10,5990,85,1,71,1,2,2,1,2,2,2,4,1,12,1,1,1,
7,1,65,1,4,2,8,1,7,1,28,1,4,1,5,1,1,3,7,1,340,2,25,1,25,1,31,1,25,1,31,1,25,1,31,1,
25,1,31,1,25,1,8,4148,197,1339,4,1,27,1,2,1,1,2,1,1,10,1,4,1,1,1,1,6,1,4,1,1,1,1,1,
1,3,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,4,1,7,1,4,1,4,1,1,1,10,1,17,5,3,1,5,1,17,
4420,42711,41,4149,11,222,2,5762,10590,542]));

var IDC_ = fromRunLenCodes([0,183,1,719,1,4065,9,1640,1],fromRunLenCodes ( ( [ 0 ,
48,10,7,26,4,1,1,26,47,1,10,1,1,1,2,1,5,23,1,31,1,458,4,12,14,5,7,1,1,1,17,117,1,2,
2,4,1,1,6,5,1,1,1,20,1,83,1,139,1,5,2,166,1,38,2,1,7,39,9,45,1,1,1,2,1,2,1,1,8,27,
5,3,29,11,5,74,4,102,1,8,2,10,1,19,2,1,16,59,2,101,14,54,4,1,5,46,18,28,68,21,46,129,
2,10,1,19,1,8,2,2,2,22,1,7,1,1,3,4,2,9,2,2,2,4,8,1,4,2,1,5,2,12,15,3,1,6,4,2,2,22,
1,7,1,2,1,2,1,2,2,1,1,5,4,2,2,3,3,1,7,4,1,1,7,16,11,3,1,9,1,3,1,22,1,7,1,2,1,5,2,10,
1,3,1,3,2,1,15,4,2,10,9,1,7,3,1,8,2,2,2,22,1,7,1,2,1,5,2,9,2,2,2,3,8,2,4,2,1,5,2,10,
1,1,16,2,1,6,3,3,1,4,3,2,1,1,1,2,3,2,3,3,3,12,4,5,3,3,1,4,2,1,6,1,14,10,16,4,1,8,1,
3,1,23,1,16,3,8,1,3,1,4,7,2,1,3,5,4,2,10,17,3,1,8,1,3,1,23,1,10,1,5,2,9,1,3,1,4,7,
2,7,1,1,4,2,10,1,2,14,3,1,8,1,3,1,41,2,8,1,3,1,5,8,1,7,5,2,10,10,6,2,2,1,18,3,24,1,
9,1,1,2,7,3,1,4,6,1,1,1,8,6,10,2,2,13,58,5,15,1,10,39,2,1,1,2,2,1,1,2,1,6,4,1,7,1,
3,1,1,1,1,2,2,1,13,1,3,2,5,1,1,1,6,2,10,2,4,32,1,23,2,6,10,11,1,1,1,1,1,4,10,1,36,
4,20,1,18,1,36,9,1,57,74,6,78,2,38,1,1,5,1,2,43,1,333,1,4,2,7,1,1,1,4,2,41,1,4,2,33,
1,4,2,7,1,1,1,4,2,15,1,57,1,4,2,67,2,3,9,9,14,16,16,86,2,6,3,620,2,17,1,26,5,75,3,
11,7,13,1,7,11,21,11,20,12,13,1,3,1,2,12,84,3,1,4,2,2,10,33,3,2,10,6,88,8,43,5,70,
10,31,1,12,4,12,10,40,2,5,11,44,4,26,6,11,37,28,4,63,1,29,2,11,6,10,13,1,8,14,66,76,
4,10,17,9,12,116,12,56,8,10,3,49,82,3,1,35,1,2,6,246,6,282,2,6,2,38,2,6,2,8,1,1,1,
1,1,1,1,31,2,53,1,7,1,1,3,3,1,7,3,4,2,6,4,13,5,3,1,7,66,2,19,1,28,1,13,1,16,13,51,
13,4,1,3,12,17,1,4,1,2,10,1,1,2,6,6,1,1,1,1,1,1,16,2,4,5,5,4,1,17,41,2679,47,1,47,
1,133,6,9,12,38,1,1,5,1,2,56,7,1,15,24,9,7,1,7,1,7,1,7,1,7,1,7,1,7,1,7,1,32,517,3,
25,15,1,5,2,5,4,86,2,7,1,90,1,4,5,41,3,94,17,27,53,16,512,6582,74,20950,42,1165,67,
46,2,269,3,28,20,48,4,10,1,115,37,9,2,103,2,35,2,8,63,49,24,52,12,69,11,10,6,24,3,
1,1,1,2,46,2,36,12,29,3,65,14,11,6,31,1,55,9,14,2,10,6,23,3,73,24,3,2,16,2,5,10,6,
2,6,2,6,9,7,1,7,1,43,1,10,10,123,1,2,2,10,6,11172,12,23,4,49,8452,366,2,106,38,7,12,
5,5,12,1,13,1,5,1,1,1,2,1,2,1,108,33,363,18,64,2,54,40,12,4,16,16,16,3,2,24,3,32,5,
1,135,19,10,7,26,4,1,1,26,11,89,3,6,2,6,2,6,2,3,35,12,1,26,1,19,1,2,1,15,2,14,34,123,
69,53,136,1,130,29,3,49,15,1,31,32,16,27,5,43,5,30,2,36,4,8,1,5,42,158,2,10,86,40,
8,52,156,311,9,22,10,8,152,6,2,1,1,44,1,2,3,1,2,23,10,23,9,31,65,19,1,2,10,22,10,26,
70,56,6,2,64,4,1,2,5,8,1,3,1,27,4,3,4,1,32,29,3,29,35,8,1,30,25,54,10,22,10,19,13,
18,110,73,55,51,13,51,781,71,31,10,15,60,21,25,7,10,6,53,1,10,16,36,2,1,9,69,5,3,3,
11,1,1,35,18,1,37,72,7,1,1,1,4,1,15,1,10,7,59,5,10,6,4,1,8,2,2,2,22,1,7,1,2,1,5,2,
9,2,2,2,3,2,1,6,1,5,7,2,7,3,5,267,70,1,1,8,10,166,54,2,9,23,6,34,65,3,1,11,10,38,56,
8,10,54,26,3,15,4,10,358,74,21,1,448,57,1287,922,102,111,17,196,2748,1071,4049,583,
8633,569,7,31,1,10,102,30,2,5,11,55,9,4,12,10,9,21,5,19,880,69,11,47,16,17,16480,2,
3070,107,5,13,3,9,7,10,3,2,5318,5,3,6,8,8,2,7,30,4,148,3,443,85,1,71,1,2,2,1,2,2,2,
4,1,12,1,1,1,7,1,65,1,4,2,8,1,7,1,28,1,4,1,5,1,1,3,7,1,340,2,25,1,25,1,31,1,25,1,31,
1,25,1,31,1,25,1,31,1,25,1,8,2,50,512,55,4,50,8,1,14,1,22,5,1,15,3408,197,11,7,1321,
4,1,27,1,2,1,1,2,1,1,10,1,4,1,1,1,1,6,1,4,1,1,1,1,1,1,3,1,2,1,1,2,1,1,1,1,1,1,1,1,
1,1,2,1,1,2,4,1,7,1,4,1,4,1,1,1,10,1,17,5,3,1,5,1,17,4420,42711,41,4149,11,222,2,5762,
10590,542,722658,240 ]) ) )  ;

function set(bits, i) {
  bits[i>>D_INTBITLEN] |= ( 1 << ( i & M_INTBITLEN ) );

}

set(IDC_,0x200C);
set(IDC_,0x200D);


;

function char2int(c) { return c.charCodeAt(0); }
var hexD = [ '1', '2', '3', '4', '5',
             '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' ];
hexD = ['0'].concat(hexD);

function hex(number) {
  var str = "";
  str = hexD[number&0xf] + str
  str = hexD[(number>>=4)&0xf] + str ;
  str = hexD[(number>>=4)&0xf] + str ;
  str = hexD[(number>>=4)&0xf] + str ;
  
  return str;
}

function hex2(number) {
  var str = "";
  str = hexD[number&0xf] + str
  str = hexD[(number>>=4)&0xf] + str ;
  
  return str;
}

function fromRunLenCodes(runLenArray, bitm) {
  bitm = bitm || [];
  var bit = runLenArray[0];
  var runLenIdx = 1, bitIdx = 0;
  var runLen = 0;
  while (runLenIdx < runLenArray.length) {
    runLen = runLenArray[runLenIdx];
    while (runLen--) {
      while ((INTBITLEN * (bitm.length)) < bitIdx) bitm.push(0);
      if (bit) bitm[bitIdx >> D_INTBITLEN] |= (1 << (M_INTBITLEN & bitIdx));
      bitIdx++ ;
    }
    runLenIdx++ ;
    bit ^= 1;
  }
  return (bitm);
}

function arguments_or_eval(l) {
  switch ( l ) {
     case 'arguments':
     case 'eval':
       return true;
  }

  return false;
};

var has   = Object.prototype.hasOwnProperty;

function fromcode(codePoint )  {
  if ( codePoint <= 0xFFFF)
    return String.fromCharCode(codePoint) ;

  return String.fromCharCode(((codePoint-0x10000 )>>10)+0x0D800,
                             ((codePoint-0x10000 )&(1024-1))+0x0DC00);

}

function core(n) { return n.type === PAREN ? n.expr : n; };

function toNum (n) {
  return (n >= CHAR_0 && n <= CHAR_9) ? n - CHAR_0 :
         (n <= CHAR_f && n >= CHAR_a) ? 10 + n - CHAR_a :
         (n >= CHAR_A && n <= CHAR_F) ? 10 + n - CHAR_A : -1;
};

function createObj(fromPrototype) {
  function Obj() {}
  Obj.prototype = fromPrototype;
  return new Obj();
}

function getOwnN(obj, name, notHave) {
  return HAS.call(obj, name) ? obj[name] : notHave;
}

function getOwn(obj, name) {
  return getOwnN(obj, name, null);
}

function hasOwn(obj, name) {
  return HAS.call(obj, name);
}

;
 (function(){
       var i = 0;
       while(i < this.length){
          var def = this[i++];
          if ( !def ) continue;
          var e = 0;
          while ( e < def[1].length )
             def[1][e++].call(def[0]);
       }
     }).call([
[ErrorString.prototype, [function(){
this.applyTo = function(obj) {
  var errorMessage = "",
      isString = true,
      list = this.stringsAndTemplates,
      e = 0;
  while (e < list.length) {
    errorMessage += isString ?
      list[e] : list[e].applyTo(obj);
    e++;
    isString = !isString;
  }
  
  return errorMessage;
};


}]  ],
[Parser.prototype, [function(){
this.parseArrayExpression = function (context ) {
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  var elem = null,
      list = [];

  this.next () ;

  if ( context & CONTEXT_UNASSIGNABLE_CONTAINER )
      context = (context & CONTEXT_PARAM)|CONTEXT_NULLABLE;

  else
      context = (context & CONTEXT_PARAM)|CONTEXT_NULLABLE|CONTEXT_ELEM;

  var firstEA = null,
      firstElemWithYS = null,
      firstUnassignable = null,
      parenYS = null,
      firstParen = null,
      unsatisfiedAssignment = null,
      firstYS = this.firstYS,
      restElem = false, 
      firstNonTailRest = null ;

  do {
     this.firstUnassignable =
     this.firstParen = 
     this.unsatisfiedAssignment = 
     this.firstEA = 
     this.firstElemWithYS = null;

     elem = this.parseNonSeqExpr (PREC_WITH_NO_OP, context );
     if ( !elem && this.lttype === '...' ) {
         elem = this.parseSpreadElement();
         restElem = true;
     }

     if ( !unsatisfiedAssignment && this.unsatisfiedAssignment ) {
           if ( !(context & CONTEXT_ELEM) && 
                this.err('err.prop.init', this.unsatisfiedAssignment) )
                return this.errorHandlerOutput ;
           unsatisfiedAssignment =  this.unsatisfiedAssignment;
     }
 
     if ( !firstParen && this.firstParen )
           firstParen =  this.firstParen ;

     if ( !firstUnassignable && this.firstUnassignable )
           firstUnassignable =  this.firstUnassignable ;

     if ( !firstEA && this.firstEA )
           firstEA =  this.firstEA ;

     if ( context & CONTEXT_PARAM) {
        if ( !firstElemWithYS && this.firstElemWithYS ) {
              firstElemWithYS =  this.firstElemWithYS;
              parenYS = this.parenYS;
        }
     }

     if ( !firstYS && this.firstYS ) firstYS = this.firstYS;

     if ( this.lttype === ',' ) { 
        if (restElem) { 
           if (firstNonTailRest===null)
             firstNonTailRest = elem;

           restElem = false;
        }
        list.push(elem) ;
        this.next();
     }
     else  {
        if ( elem ) list.push(elem);
        break ;
     }
 
  } while ( true );

  if ( firstParen ) this.firstParen = firstParen ;
  if ( firstUnassignable ) this.firstUnassignable = firstUnassignable;
  if ( firstEA ) this.firstEA = firstEA;
  if ( unsatisfiedAssignment ) this.unsatisfiedAssignment = unsatisfiedAssignment;
  if ( firstElemWithYS ) {
     this.firstElemWithYS = firstElemWithYS;
     this.parenYS = parenYS;
  } 
  this.firstYS = firstYS;
  this.firstNonTailRest = firstNonTailRest;

  elem = { type: 'ArrayExpression', loc: { start: startLoc, end: this.loc() },
           start: startc, end: this.c, elements : list /* ,y:-1*/};

  this. expectType ( ']' ) ;

  return elem;
};

this . parseSpreadElement = function() {
  var startc = this.c-1-2,
      startLoc = this.locOn(1+2);
  this.next ();
  
  var e = this.parseNonSeqExpr(PREC_WITH_NO_OP,CONTEXT_NONE );
  return { type: 'SpreadElement',
          loc: { start: startLoc, end: e.loc.end },
          start: startc,
           end: e.end,
          argument: core(e) };
};



},
function(){

this.parenParamError = function() {
  return this.err('err.arrow.arg', this.firstParen);
};

this.restError = function(r) {
  return this.err('err.arrow.arg', r);
};

this.containsYieldOrSuperError = function() {
  return this.err('err.arrow.arg', this.firstElemWithYS );
};
 
this.notBindableError = function(l) {
  return this.err('err.arrow.arg', l) ;
};

this.notParamList = function(l) {
  return this.err('err.arrow.arg', l);
};

this .asArrowFuncArgList = function(head) {
   if ( head === null )
     return;

   if ( head.type === 'SequenceExpression' ) {
         if ( head === this.firstParen && this.parenParamError() )
           return this.errorHandlerOutput ;

         var i = 0, list = head.expressions;
         while ( i < list.length ) {
           this.asArrowFuncArg(list[i]);
           i++;
         }
   }
   else
      this.asArrowFuncArg(head);
};

this. asArrowFuncArg = function(arg) {
    var i = 0, list = null;

    if (arg.type !== 'Identifier')
      this.firstNonSimpArg = arg;

    switch  ( arg.type ) {
        case 'Identifier':
           if ( arg === this.firstParen && this.parenParamError() )
              return this.errorHandlerOutput ;

           if (this.tight)
             this.assert(!arguments_or_eval(arg.name));

           return this.declare(arg);

        case 'ArrayExpression':
           if ( arg === this.firstParen && this.parenParamError() ) 
             return errorHandlerOutput ;

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
           if ( i !== list.length && this.restError() )
             return this.errorHandlerOutput;

           arg.type = 'ArrayPattern';
           return;

        case 'AssignmentExpression':
           if (arg === this.firstParen && this.parenParamError() )
             return this.errorHandlerOutput;

           if (arg.operator !== '=' && this.notBindableError(arg) )
             return this.errorHandlerOutput ;

           this.asArrowFuncArg(arg.left);
           if ( arg === this.firstElemWithYS && this.containsYieldOrSuperError() )
             return this.errorHandlerOutput;

           arg.type = 'AssignmentPattern';
           delete arg.operator ;
           return;

        case 'ObjectExpression':
           if (arg === this.firstParen && this.parenParamError() )
             return this.errorHandlerOutput ;
           list = arg.properties;
           while ( i < list.length )
              this.asArrowFuncArg(list[i++].value );

           arg.type = 'ObjectPattern';
           return;

        case 'AssignmentPattern':
           if (arg === this.firstParen && this.parenParamError() )
             return this.errorHandlerOutput ;

           if ( arg === this.firstElemWithYS && this.containsYieldOrSuper() )
             return this.errorHandlerOutput;

           this.asArrowFuncArg(arg.left) ;
           return;

        case 'ArrayPattern' :
           list = arg.elements;
           while ( i < list.length )
             this.asArrowFuncArg(list[i++] ) ;

           return;

        case 'SpreadElement':
            this.assert(arg !== this.firstNonTailRest);
            if (arg.argument.type !== 'Identifier')
              this.err('binding.rest.arg.not.id');
            this.asArrowFuncArg(arg.argument);
            arg.type = 'RestElement';
            return;

        case 'RestElement':
            if (arg.argument.type !== 'Identifier')
              this.err('binding.rest.arg.not.id');
            this.asArrowFuncArg(arg.argument);
            return;

        case 'ObjectPattern':
            list = arg.properties;
            while ( i < list.length )
               this.asArrowFuncArgList ( list[i++].value  );

            return;

        default:
           if ( this.notBindableError(arg) )
             return this.errorHandlerOutput;
    }
};


this . parseArrowFunctionExpression = function(arg,context)   {

  if ( this.unsatisfiedArg )
       this.unsatisfiedArg = null;

  var tight = this.tight;

  this.enterFuncScope(false);
  this.declMode = DECL_MODE_FUNCTION_PARAMS;
  this.enterComplex();

  switch ( arg.type ) {
    case 'Identifier':
       this.asArrowFuncArg(arg, 0)  ;
       break ;

    case PAREN:
       this.asArrowFuncArgList(core(arg));
       break ;

    default:
       if ( this.notParamList(arg) )
         return this.errorHandlerOutput ;
  }

  if ( this.firstEA )
     this.firstEA = null;

  if ( this.newLineBeforeLookAhead &&
       this.err('new.line.before.arrow'))
     return this.errorHandlerOutput;

  this.next();

  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= INHERITED_SCOPE_FLAGS;

  var isExpr = true, nbody = null;

  if ( this.lttype === '{' ) {
       var prevLabels = this.labels, prevYS = this.firstYS;
       this.firstYS = null;
       this.labels = {};
       isExpr = false;
       this.scopeFlags |= SCOPE_FLAG_FN;
       nbody = this.parseFuncBody(CONTEXT_NONE);
       this.labels = prevLabels;
       this.firstYS = prevYS;
  }
  else
    nbody = this. parseNonSeqExpr(PREC_WITH_NO_OP, context) ;

  this.exitScope();
  var params = core(arg);
  this.tight = tight;

  this.scopeFlags = scopeFlags;

  return { type: 'ArrowFunctionExpression',
           params: params ?  params.type === 'SequenceExpression' ? params.expressions : [params] : [] ,
           start: arg.start,
           end: nbody.end,
           loc: { start: arg.loc.start, end: nbody.loc.end },
           generator: false,
           expression: isExpr,
           body: core(nbody),
           id : null
  }; 
};



},
function(){
this . assert = function(cond, message) { if ( !cond ) throw new Error ( message )  ; }

},
function(){

this.evalArgumentsError = function(l) {
  return this.err('err.assig.not', l || this.firstEA ) ;
};

this.notSimpleError = function(l) {
  return this.err('err.assig.simple.not', l);
};

this.notAssignableError = function(l) {
  return this.err('err.assig.not', l || this.firstUnassignable );
};

this.parenUnassigableError = this.notAssignableError;

this.restNotLastError = this.notAssignableError;

this .ensureSimpAssig = function(head) {
  switch(head.type) {
    case 'Identifier':
       if ( this.tight && arguments_or_eval(head.name) )
         this.err('assig.to.eval.or.arguments',head);

    case 'MemberExpression':
       return;

    default:
       return this.err('assig.not.simple',head);
  }
};

this .ensureSimpAssig_soft = function(head) {
  switch(head.type) {
    case 'Identifier':
       if ( this.tight && arguments_or_eval(head.name) )
         this.err('assig.to.eval.or.arguments',head);

    case 'MemberExpression':
       return true ;

    default:
       return false ;
  }
};

this.ensureSpreadToRestArgument_soft = function(head) {
  return head.type !== 'AssignmentExpression';
};

// an arr-pat is always to the left of an assig;
this .toAssig = function(head) {

  var i = 0;
  var firstEA = null;
  var list = null;

  this.firstEA = null;

  switch(head.type) {
     case 'Identifier':
        if ( this.tight && arguments_or_eval(head.name) )
          this.firstEA = head;
     case 'MemberExpression':
        return;

     case 'ObjectExpression':
        if (head === this.firstUnassignable && this.parenUnassignableError() )
          return this.errorHandlerOutput  ;

        list = head.properties;

        while ( i < list.length ) {
           this.toAssig(list[i].value);
           if ( !firstEA && this.firstEA )
                 firstEA =  this.firstEA ;
           list[i].type = 'AssignmentProperty';
           i++;
        }
        head.type = 'ObjectPattern';
        this.firstEA = firstEA ;
        return;

     case 'ArrayExpression':
        if (head === this.firstUnassignable && this.parenUnassignableError() )
          return this.errorHandlerOutput   ;

        list = head.elements;
        while ( i < list.length ) {
          if ( list[i] ) {
             this.toAssig(list[i]);
             if ( !firstEA && this.firstEA )
                   firstEA =  this.firstEA ;

             if ( list[i].type === 'SpreadElement' ) {
                i++;
                break ;
             }
          }
          i++;
        }
        if ( i !== list.length && this.restNotLastError() )
          return this.errorHandlerOutput ;

        head.type = 'ArrayPattern';
        this.firstEA = firstEA ;
        return;

     case 'AssignmentExpression':
       if (head === this.firstUnassignable && this.parenUnassignableError() )
         return this.errorHandlerOutput ;

       if (head.operator !== '=' && this.notAssignableError()  )
         return this.errorHandlerOutput ;

       head.type = 'AssignmentPattern';
       delete head.operator;
       if ( head === this.firstEAContainer )
          this.firstEA = this.defaultEA ;

       return;

     case 'SpreadElement':
       this.assert(head !== this.firstNonTailRest);
       if (!this.ensureSpreadToRestArgument_soft(head.argument))
         this.err('rest.assig.non.id.arg', head);

       this.toAssig(head.argument);
       head.type = 'RestElement';
       return;
   
     case 'AssignmentPattern': // this would be the case in the event of converting an obj prop in the form of "name = val" rather than "name: val"
       this.toAssig(head.left);
       return;

     default:
        if ( this.notAssignableError(head) )
          return this.errorHandlerOutput;
  }
};

this .parseAssignment = function(head, context ) {
    var o = this.ltraw;
    var firstEA = null ;

    if ( o === '=' ) {
       if ( this.firstEA ) {
            this.defaultEA = this.firstEA;
            this.firstEA = null;
       }

       this.toAssig(core(head));
       firstEA = this.firstEA;
    }
    else if ( o === '=>' )
      return this.parseArrowFunctionExpression (head, context & CONTEXT_FOR );
    else this.ensureSimpAssig(core(head));

    if ( this.unsatisfiedAssignment ) {
       if ( o !== '=' && this.err('err.prop.init', this.unsatisfiedAssignment ) )
          return this.errorHandlerOutput ;

       this.unsatisfiedAssignment = false ;
    }

    if ( firstEA ) {
      
       if ( !( context & CONTEXT_ELEM_OR_PARAM ) && this.evalArgumentsError() )
         return this.errorHandlerOutput ;
    }

    var prec = this.prec;
    this.next();

    this.firstEA = null;
    var currentYS = this.firstYS; // save the current YS
    this.firstYS = null; // look for first YS in right hand side; please note this is the only case
                         // where firstYS is nulld

    if ( context & CONTEXT_PARAM ) { // if head is in paramPosition
      // save the first YS found in head
      var firstElemWithYS = this.firstElemWithYS; 
      var parenYS = this.parenYS;
    }

    var right = this. parseNonSeqExpr(PREC_WITH_NO_OP, context & CONTEXT_FOR ) ;
    this.firstEA = firstEA;
    var n = { type: 'AssignmentExpression', operator: o, start: head.start, end: right.end,
             left: core(head), right: core(right), loc: { start: head.loc.start, end: right.loc.end }/* ,y:-1*/};

    if ( this.firstYS ) { // if there was a YS in the right hand side; for example [ e = yield ] = -->yield 12<--is yield!
       if ( context & CONTEXT_PARAM ) { 
            this.firstElemWithYS = n; // the current assignment has a YS in its right hand side (`[e=yield]=yield 12`)
            this.parenYS = this.firstYS; // this is the YS in the right hand side (`yield 12`)
       }
    }
    else { // if there is no YS in the right hand side; for example [e = yield 120 ] = --> 12 <--not yield
       if ( context & CONTEXT_PARAM ) {
            this.firstElemWithYS = firstElemWithYS; // `e = yield 120`
            this.parenYS = parenYS; // `yield 120`
       }  
       this.firstYS = currentYS;
    }

    if ( firstEA )
      this.firstEAContainer = n;

    return n;
};



},
function(){
this. parseClass = function(context) {
  var startc = this.c0,
      startLoc = this.locBegin();

  var isStmt = false, name = null;
  if (this.canBeStatement) {
    isStmt = true;
    this.canBeStatement = false;
  }
  this.next(); // 'class'

  if (isStmt) {
    if (!this.canDeclareClassInScope())
      this.err('class.decl.not.in.block', startc, startLoc);
    if (this.lttype === 'Identifier' && this.ltval !== 'extends') {
      this.declMode = DECL_MODE_CLASS_DECL;
      name = this.parsePattern();
    }
    else if (!(context & CONTEXT_DEFAULT))
      this.err('class.decl.has.no.name');
  }
  else if (this.lttype === 'Identifier' && this.ltval !== 'extends') {
    this.enterLexicalScope(false);
    this.scope.synth = true;
    this.declMode = DECL_MODE_CLASS_EXPR;
    name = this.parsePattern();
  }

  var memParseFlags = MEM_CLASS;
  var superClass = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'extends' ) {
     this.next();
     superClass = this.parseExprHead(CONTEXT_NONE);
     memParseFlags |= MEM_SUPER;
  }

  var list = [];
  var startcBody = this.c - 1, startLocBody = this.locOn(1);

  this.expectType('{');
  var elem = null;

  while (true) {
    if (this.lttype === ';') {
      this.next();
      continue;
    }
    elem = this.parseMem(CONTEXT_NONE, memParseFlags);
    if (elem !== null) {
      list.push(elem);
      if (elem.kind === 'constructor')
        memParseFlags |= MEM_HAS_CONSTRUCTOR;
    }
    else break;
  }

  var endLoc = this.loc();
  var n = {
    type: isStmt ? 'ClassDeclaration' : 'ClassExpression', id: name, start: startc,
    end: this.c, superClass: superClass,
    loc: { start: startLoc, end: endLoc },
    body: {
      type: 'ClassBody', loc: { start: startLocBody, end: endLoc },
      start: startcBody, end: this.c,
      body: list/* ,y:-1*/
    }/* ,y:-1*/ 
  };

  this.expectType('}');

  if (isStmt)
    this.foundStatement = true;

  return n;
};

this.parseSuper = function() {
  var n = {
    type: 'Super', loc: { start: this.locBegin(), end: this.loc() },
    start: this.c0, end: this.c
  };
 
  this.next();
  switch ( this.lttype ) {
  case '(':
    if (
      (this.scopeFlags & SCOPE_FLAG_CONSTRUCTOR_WITH_SUPER) !==
      SCOPE_FLAG_CONSTRUCTOR_WITH_SUPER
    ) this.err('class.super.call');
 
    break;
 
  case '.':
  case '[':
    if (!(this.scopeFlags & SCOPE_FLAG_ALLOW_SUPER))
      this.err('class.super.mem');
 
    break ;
  
  default:
    this.err('class.super.lone'); 

  }
 
  if (!this.firstYS)
    this.firstYS = n;
 
  return n;
};

},
function(){

this.readMultiComment = function () {
   var c = this.c,
       l = this.src,
       e = l.length,
       r,
       start = c,
       n = true ;

   while ( c < e )
        switch (r = l.charCodeAt(c++ ) ) {
          case CHAR_MUL:
             if ( l.charCodeAt(c) === CHAR_DIV) {
                c++;
                this.col += (c-start);
                this.c=c;
                return n;
             }
             continue ;

          case CHAR_CARRIAGE_RETURN: if( CHAR_LINE_FEED === l.charCodeAt(c)) c++;
          case CHAR_LINE_FEED:
          case 0x2028:
          case 0x2029:
            start = c;
            if ( n ) n = false ;
            this.col = 0 ;
            this.li ++ ;
            continue;

//          default : if ( r >= 0x0D800 && r <= 0x0DBFF ) this.col-- ;
        }

   if ( this.err( 'comment.multi.unfinished' ) )
     return this.errorHandlerOutput ;
};

this.readLineComment = function() {
    var c = this.c,
        l = this.src,
        e = l.length,
        r ;
    L:
    while ( c < e )
     switch (r = l.charCodeAt(c++ ) ) {
        case CHAR_CARRIAGE_RETURN : if ( CHAR_LINE_FEED === l . charCodeAt ( c) ) c++ ;
        case CHAR_LINE_FEED :
        case 0x2028:
        case 0x2029 :
          this.col = 0 ;
          this.li ++ ;
          break L ;

//        default : if ( r >= 0x0D800 && r <= 0x0DBFF ) this.col-- ;
     }
     this.c=c;
     return ;
};



},
function(){
this.parseExport = function() {
   if ( !this.canBeStatement && this.err('not.stmt', 'export') )
     return this.errorHandlerOutput ;

   this.canBeStatement = false;

   var startc = this.c0, startLoc = this.locBegin();
   this.next();

   var list = [], local = null, src = null ;
   var endI = 0;
   var ex = null;

   var semiLoc = null;
   switch ( this.lttype ) {
      case 'op':
         if (this.ltraw !== '*' &&
             this.err('export.all.not.*',startc,startLoc) )
           return this.errorHandlerOutput;
 
         this.next();
         if ( !this.expectID_soft('from') &&
               this.err('export.all.no.from',startc, startLoc) )
           return this.errorHandlerOutput;

         if (!(this.lttype === 'Literal' &&
              typeof this.ltval === STRING_TYPE ) && 
              this.err('export.all.source.not.str',startc,startLoc) )
           return this.errorHandlerOutput;

         src = this.numstr();
         
         endI = this.semiI();
         semiLoc = this.semiLoc_soft();
         if ( !semiLoc && !this.hasNewlineBeforeLookAhead &&
              this.err('no.semi', 'export.all',
              { s:startc, l:startLoc, src: src, endI: endI } ) )
           return this.errorHandlerOutput;

         this.foundStatement = true;
         
         return  { type: 'ExportAllDeclaration',
                    start: startc,
                    loc: { start: startLoc, end: semiLoc || src.loc.end },
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
                this.throwReserved = true;
            }
            ex = local;
            if ( this.lttype === 'Identifier' ) {
              if ( this.ltval !== 'as' && 
                   this.err('export.specifier.not.as',
                     { s: startc, l: startLoc, list: list, local, ex: ex }) )
                return this.errorHandlerOutput ;

              this.next();
              if ( this.lttype !== 'Identifier' ) { 
                 if (  this.err('export.specifier.after.as.id',
                       { s:startc, l:startLoc, list:list, ex:ex }) )
                return this.errorHandlerOutput;
              }
              else
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
   
         if ( !this.expectType_soft('}') && 
               this.err('export.named.list.not.finished',
                  {s: startc,l: loc, list:list}) )
           return this.errorHandlerOutput  ;

         if ( this.lttype === 'Identifier' ) {
           if ( this.ltval !== 'from' &&
                this.err('export.named.not.id.from',
                    {s: startc, l:startLoc, list:list, end: [endI, li, col]}
              ) )
              return this.errorHandlerOutput;

           else this.next();
           if ( !( this.lttype === 'Literal' &&
                  typeof this.ltval ===  STRING_TYPE) &&
                this.err('export.named.source.not.str',
                   { s:startc,l:startLoc,list:list,end:[endI,li,col] }) )
             return this.errorHandlerOutput ;

           else {
              src = this.numstr();
              endI = src.end;
           }
         }
         else
            if (firstReserved && this.err('export.named.has.reserved',
               { s:startc, l:startLoc, list:list, end:[endI,li,col], resv: firstReserved}) )
              return this.errorHandlerOutput ;

         endI = this.semiI() || endI;
         semiLoc = this.semiLoc_soft();
         if ( !semiLoc && !this.newLineBeforeLookAhead &&
              this.err('no.semi','export.named',
                  { s:startc, l:startLoc, list: list, end: [endI,li,col], src: src } ))
           return this.errorHandlerOutput; 

         this.foundStatement = true;
         return { type: 'ExportNamedDeclaration',
                 start: startc,
                 loc: { start: startLoc, end: semiLoc || ( src && src.loc.end ) ||
                                              { line: li, column: col } },
                  end: endI, declaration: null,
                   specifiers: list,
                  source: src };

   }

   var context = CONTEXT_NONE;

   if ( this.lttype === 'Identifier' && 
        this.ltval === 'default' ) { context = CONTEXT_DEFAULT; this.next(); }
  
   if ( this.lttype === 'Identifier' ) {
       switch ( this.ltval ) {
          case 'let':
          case 'const':
             if (context === CONTEXT_DEFAULT && 
                 this.err('export.default.const.let',startc,startLoc) )
               return this.errorHandlerOutput;
                 
             this.canBeStatement = true;
             ex = this.parseVariableDeclaration(CONTEXT_NONE);
             break;
               
          case 'class':
             this.canBeStatement = true;
             ex = this.parseClass(context);
             break;
  
          case 'var':
             this.canBeStatement = true;
             ex = this.parseVariableDeclaration(CONTEXT_NONE ) ;
             break ;

          case 'function':
             this.canBeStatement = true;
             ex = this.parseFunc( context, 0 );
             break ;
        }
   }

   if ( context !== CONTEXT_DEFAULT ) {

     if (!ex && this.err('export.named.no.exports',startc, startLoc) )
       return this.errorHandlerOutput ;
     
     this.foundStatement = true;
     return { type: 'ExportNamedDeclaration',
            start: startc,
            loc: { start: startLoc, end: ex.loc.end },
             end: ex.end , declaration: ex,
              specifiers: list ,
             source: null };
   }

   var endLoc = null;
   if ( ex === null ) {
        ex = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE );
        endI = this.semiI();
        endLoc = this.semiLoc_soft(); // TODO: semiLoc rather than endLoc
        if ( !endLoc && !this.newLineBeforeLookAhead &&
             this.err('no.semi', 'export.named', 
                 { s: startc, l:startLoc, e: ex } ) )
          return this.errorHandlerOutput;
   }

   this.foundStatement = true;
   return { type: 'ExportDefaultDeclaration',    
           start: startc,
           loc: { start: startLoc, end: endLoc || ex.loc.end },
            end: endI || ex.end, declaration: core( ex ) };
}; 

},
function(){
// TODO: needs a thorough simplification
this.parseImport = function() {
  if (!this.canBeStatement)
    this.err('not.stmt','import');

  this.canBeStatement = false;

  var startc = this.c0,
      startLoc = this.locBegin(),
      hasList = false;

  this.next();

  var hasMore = true, list = [], local = null;
  if ( this.lttype === 'Identifier' ) {
    local = this.validateID(null);
    list.push({
      type: 'ImportDefaultSpecifier',
      start: local.start,
      loc: local.loc,
      end: local.end,
      local: local
    });
    if (this.lttype === ',')
      this.next();
    else
      hasMore = false;
  }

  var spStartc = 0, spStartLoc = null;
  
  if (hasMore) switch (this.lttype) {   
  case 'op':
    if (this.ltraw !== '*')
      this.err('import.namespace.specifier.not.*',startc, startLoc);
    else {
      spStartc = this.c - 1;
      spStartLoc = this.locOn(1);
  
      this.next();
      if (!this.expectID_soft('as'))
        this.err('import.namespace.specifier.no.as',startc, startLoc, spStartc, spStartLoc);
      if (this.lttype !== 'Identifier')
        this.err('import.namespace.specifier.local.not.id',startc,startLoc,spStartc, spStartLoc );
 
      local = this.validateID(null);
      list.push({
        type: 'ImportNamespaceSpecifier',
        start: spStartc,
        loc: { start: spStartLoc, end: local.loc.end },
        end: local.end,
        local: local
      });
    }
    break;
  
  case '{':
    hasList = true;
    this.next();
    while ( this.lttype === 'Identifier' ) {
      local = this.id();
      var im = local; 
      if ( this.lttype === 'Identifier' ) {
        if ( this.ltval !== 'as' && 
             this.err('import.specifier.no.as',startc,startLoc,local) )
          return this.errorHandlerOutput ;
 
        this.next();
        if ( this.lttype !== 'Identifier' &&
             this.err('import.specifier.local.not.id',startc,startLoc,local) )
          return this.errorHandlerOutput ;
 
        local = this.validateID(null);
      }
      else this.validateID(local.name);
 
      list.push({
        type: 'ImportSpecifier',
        start: im.start,
        loc: { start: im.loc.start, end: local.loc.end },
        end: local.end, imported: im,
        local: local
      });
 
      if ( this.lttype === ',' )
         this.next();
      else
         break ;                                  
    }
 
    if (!this.expectType_soft('}')) 
      this.err('import.specifier.list.unfinished',startc,startLoc,list);
 
    break ;

  default:
    if (list.length) {
      ASSERT.call(this, list.length === 1,
        'how come has more than a single specifier been parsed before the comma was reached?!');
      this.err('import.invalid.specifier.after.comma');
    }
  }

   if (list.length || hasList) {
     if (!this.expectID_soft('from'))
       this.err('import.from',startc,startLoc,list);
   }

   // TODO: even though it's working the way it should, errors might be misleading for cases like:
   // `import , from "a"`
   if (!(this.lttype === 'Literal' &&
        typeof this.ltval === STRING_TYPE))
     this.err('import.source.is.not.str');

   var src = this.numstr();
   var endI = this.semiI() || src.end, 
       semiLoc = this.semiLoc();

   if (!semiLoc && !this.newLineBeforeLookAhead)
     this.err('no.semi','import');
   
   this.foundStatement = true;

   return {
     type: 'ImportDeclaration',
     start: startc,
     loc: {
       start: startLoc,
       end: semiLoc || src.loc.end
     },
     end:  endI , specifiers: list,
     source: src
   };
}; 

},
function(){
this.err = function(errorType, errParams) {
   if ( has.call(this.errorHandlers, errorType) )
     return this.handleError(this.errorHandlers[errorType], errParams);

   var message = "";
   if (!HAS.call(ErrorBuilders, errorType))
     message = "Error: " + errorType + "\n" +
       this.src.substr(this.c-120,120) +
       ">>>>" + this.src.charAt(this.c+1) + "<<<<" +
       this.src.substr(this.c, 120);

   else {
     var errorBuilder = ErrorBuilders[errorType];
     var messageBuilder = errorBuilder.m;
     var offsetBuilder = errorBuilder.o;
     var locBuilder = errorBuilder.l;
   
     message += "Error: ";

     // TODO: add a way to print a 'pinpoint', i.e., the particular chunk of the
     // source code that is causing the error
     message += buildLoc(locBuilder, errParams)+"(src@";
     message += buildOffset(offsetBuilder, errParams)+"): ";
     message += buildMessage(messageBuilder, errParams);
   }

   throw new Error(message);
};
  
this.handleError = function(handlerFunction, errorTok, args ) {
   var output = handlerFunction.call( this, params, coords );
   if ( output ) {
     this.errorHandlerOutput = output;
     return true;
   }

   return false;
};


},
function(){
this.readEsc = function ()  {
  var src = this.src, b0 = 0, b = 0;
  switch ( src.charCodeAt ( ++this.c ) ) {
   case CHAR_BACK_SLASH: return '\\';
   case CHAR_MULTI_QUOTE: return'\"' ;
   case CHAR_SINGLE_QUOTE: return '\'' ;
   case CHAR_b: return '\b' ;
   case CHAR_v: return '\v' ;
   case CHAR_f: return '\f' ;
   case CHAR_t: return '\t' ;
   case CHAR_r: return '\r' ;
   case CHAR_n: return '\n' ;
   case CHAR_u:
      b0 = this.peekUSeq();
      if ( b0 >= 0x0D800 && b0 <= 0x0DBFF ) {
        this.c++;
        return String.fromCharCode(b0, this.peekTheSecondByte());
      }
      return fromcode(b0);

   case CHAR_x :
      b0 = toNum(this.src.charCodeAt(++this.c));
      if ( b0 === -1 && this.err('hex.esc.byte.not.hex') )
        return this.errorHandlerOutput;
      b = toNum(this.src.charCodeAt(++this.c));
      if ( b0 === -1 && this.err('hex.esc.byte.not.hex') )
        return this.errorHandlerOutput;
      return String.fromCharCode((b0<<4)|b);

   case CHAR_0: case CHAR_1: case CHAR_2:
   case CHAR_3:
       b0 = src.charCodeAt(this.c);
       if ( this.tight ) {
          if ( b0 === CHAR_0 ) {
               b0 = src.charCodeAt(this.c +  1);
               if ( b0 < CHAR_0 || b0 >= CHAR_8 )
                 return '\0';
          }
          if ( this.err('strict.oct.str.esc') )
            return this.errorHandlerOutput
       }

       b = b0 - CHAR_0;
       b0 = src.charCodeAt(this.c + 1 );
       if ( b0 >= CHAR_0 && b0 < CHAR_8 ) {
          this.c++;
          b <<= 3;
          b += (b0-CHAR_0);
          b0 = src.charCodeAt(this.c+1);
          if ( b0 >= CHAR_0 && b0 < CHAR_8 ) {
             this.c++;
             b <<= 3;
             b += (b0-CHAR_0);
          }
       }
       return String.fromCharCode(b)  ;

    case CHAR_4: case CHAR_5: case CHAR_6: case CHAR_7:
       if (this.tight && this.err('strict.oct.str.esc') )
         return this.errorHandlerOutput  ;

       b0 = src.charCodeAt(this.c);
       b  = b0 - CHAR_0;
       b0 = src.charCodeAt(this.c + 1 );
       if ( b0 >= CHAR_0 && b0 < CHAR_8 ) {
          this.c++; 
          b <<= 3; 
          b += (b0-CHAR_0);
       }
       return String.fromCharCode(b)  ;

   case CHAR_8:
   case CHAR_9:
       if ( this.err('esc.8.or.9') ) 
         return this.errorHandlerOutput ;
       return '';

   case CHAR_CARRIAGE_RETURN:
      if ( src.charCodeAt(this.c + 1) === CHAR_LINE_FEED ) this.c++;
   case CHAR_LINE_FEED:
   case 0x2028:
   case 0x2029:
      this.col = 0;
      this.li++;
      return '';

   default:
      return src.charAt(this.c) ;
  }
};

this.readStrictEsc = function ()  {
  var src = this.src, b0 = 0, b = 0;
  switch ( src.charCodeAt ( ++this.c ) ) {
   case CHAR_BACK_SLASH: return '\\';
   case CHAR_MULTI_QUOTE: return'\"' ;
   case CHAR_SINGLE_QUOTE: return '\'' ;
   case CHAR_b: return '\b' ;
   case CHAR_v: return '\v' ;
   case CHAR_f: return '\f' ;
   case CHAR_t: return '\t' ;
   case CHAR_r: return '\r' ;
   case CHAR_n: return '\n' ;
   case CHAR_u:
      b0 = this.peekUSeq();
      if ( b0 >= 0x0D800 && b0 <= 0x0DBFF ) {
        this.c++;
        return String.fromCharCode(b0, this.peekTheSecondByte());
      }
      return fromcode(b0);

   case CHAR_x :
      b0 = toNum(this.src.charCodeAt(++this.c));
      if ( b0 === -1 && this.err('hex.esc.byte.not.hex') )
        return this.errorHandlerOutput;
      b = toNum(this.src.charCodeAt(++this.c));
      if ( b0 === -1 && this.err('hex.esc.byte.not.hex') )
        return this.errorHandlerOutput;
      return String.fromCharCode((b0<<4)|b);

   case CHAR_0: case CHAR_1: case CHAR_2:
   case CHAR_3:
       b0 = src.charCodeAt(this.c);
       if ( b0 === CHAR_0 ) {
            b0 = src.charCodeAt(this.c +  1);
            if ( b0 < CHAR_0 || b0 >= CHAR_8 )
              return '\0';
       }
       if ( this.err('strict.oct.str.esc') )
         return this.errorHandlerOutput

    case CHAR_4: case CHAR_5: case CHAR_6: case CHAR_7:
       if (this.err('strict.oct.str.esc') )
         return this.errorHandlerOutput  ;

   case CHAR_8:
   case CHAR_9:
       if ( this.err('esc.8.or.9') ) 
         return this.errorHandlerOutput ;

   case CHAR_CARRIAGE_RETURN:
      if ( src.charCodeAt(this.c + 1) === CHAR_LINE_FEED ) this.c++;
   case CHAR_LINE_FEED:
   case 0x2028:
   case 0x2029:
      this.col = 0;
      this.li++;
      return '';

   default:
      return src.charAt(this.c) ;
  }
};



},
function(){

this.peekTheSecondByte = function () {
  var e = this.src.charCodeAt(this.c);
  if (CHAR_BACK_SLASH === e) {
    if (CHAR_u !== this.src.charCodeAt(++this.c) &&
        this.err('u.second.esc.not.u') )
      return this.errorHandlerOutput ;

    e = (this.peekUSeq());
  }
//  else this.col--;
  if ( (e < 0x0DC00 || e > 0x0DFFF) && this.err('u.second.not.in.range',e) )
    return this.errorHandlerOutput;

  return e;
};

this.peekUSeq = function () {
  var c = ++this.c, l = this.src, e = l.length;
  var byteVal = 0;
  var n = l.charCodeAt(c);
  if (CHAR_LCURLY === n) { // u{ 
    ++c;
    n = l.charCodeAt(c);
    do {
      n = toNum(n);
      if ( n === - 1 && this.err('u.esc.hex','curly',c,byteVal) )
        return this.errorHandlerOutput ;

      byteVal <<= 4;
      byteVal += n;
      if (byteVal > 0x010FFFF && this.err('u.curly.not.in.range',c,byteVal) )
        return this.errorHandler ;

      n = l.charCodeAt( ++ c);
    } while (c < e && n !== CHAR_RCURLY);

    if ( n !== CHAR_RCURLY && this.err('u.curly.is.unfinished',c,byteVal) ) 
      return this.errorHandlerOutput ;

    this.c = c;
    return byteVal;
  }
 
  n = toNum(l.charCodeAt(c));
  if ( n === -1 && this.err('u.esc.hex','u',c,byteVal) )
    return this.errorHandlerOutput;
  byteVal = n;
  c++ ;
  n = toNum(l.charCodeAt(c));
  if ( n === -1 && this.err('u.esc.hex','u',c,byteVal) )
    return this.errorHandlerOutput;
  byteVal <<= 4; byteVal += n;
  c++ ;
  n = toNum(l.charCodeAt(c));
  if ( n === -1 && this.err('u.esc.hex','u',c,byteVal) )
    return this.errorHandlerOutput;
  byteVal <<= 4; byteVal += n;
  c++ ;
  n = toNum(l.charCodeAt(c));
  if ( n === -1 && this.err('u.esc.hex','u',c,byteVal) )
    return this.errorHandlerOutput;
  byteVal <<= 4; byteVal += n;

  this.c = c;

  return byteVal;
};



},
function(){

this . parseFor = function() {
  this.ensureStmt();
  this.fixupLabels(true) ;

  var startc = this.c0,
      startLoc = this.locBegin();

  this.next () ;
  if ( !this.expectType_soft ('(' ) &&
        this.err('for.with.no.opening.paren',startc, startLoc) )
    return this.errorHandlerOutput ;

  var head = null;
  var headIsExpr = false;

  var scopeFlags = this.scopeFlags;

  this.scopeFlags = SCOPE_FLAG_IN_BLOCK;

  this.enterLexicalScope(true);

  if ( this.lttype === 'Identifier' ) switch ( this.ltval ) {
     case 'var':
        this.canBeStatement = true;
        head = this.parseVariableDeclaration(CONTEXT_FOR);
        break;

     case 'let':
        if ( this.v >= 5 ) {
          this.canBeStatement = true;
          head = this.parseLet(CONTEXT_FOR);
        }

        break;

     case 'const' :

        if ( this.v < 5 && this.err('const.not.in.v5',startc, startLoc) )
          return this.errorHandlerOutput ;

        this.canBeStatement = true;
        head = this. parseVariableDeclaration(CONTEXT_FOR);
           break ;
  }
  this.scopeFlags = scopeFlags;

  if ( head === null ) {
       headIsExpr = true;
       head = this.parseExpr( CONTEXT_NULLABLE|CONTEXT_ELEM|CONTEXT_FOR ) ;
  }
  else 
     this.foundStatement = false;

  var kind = 'ForOfStatement';
  var nbody = null;
  var afterHead = null;

  if ( head !== null /* && // if we have a head
       ( headIsExpr || // that is an expression
       (head.declarations.length === 1  && !head.declarations[0].init ) ) */ && // or one and only one lone declarator
       this.lttype === 'Identifier' ) { // then if the token ahead is an id
    switch ( this.ltval ) {
       case 'in':
          kind = 'ForInStatement';

       case 'of':
          if (!headIsExpr) {
             if ( head.declarations.length !== 1 &&
                  this.err('for.in.or.of.multi',startc, startLoc,head) )
                return this.errorHandlerOutput;
//           if ( head.kind === 'const' &&
//                this.err( 'for.in.or.of.const', startc, starLoc, head) )
//              return this.errorHandlerOutput;
          }

          if (kind === 'ForOfStatement')
            this.ensureVarsAreNotResolvingToCatchParams();

          if ( this.unsatisfiedAssignment )
            this.unsatisfiedAssignment = null;

          if (headIsExpr) this.toAssig(core(head));

          this.next();
          afterHead = kind === 'ForOfStatement' ? 
            this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE) :
            this.parseExpr(CONTEXT_NONE);

          if ( ! this.expectType_soft (')') &&
                 this.err('for.iter.no.end.paren',start,startLoc,head,afterHead) )
            return this.errorHandlerOutput ;

          this.scopeFlags &= CLEAR_IB;
          this.scopeFlags |= ( SCOPE_FLAG_BREAK|SCOPE_FLAG_CONTINUE );
          nbody = this.parseStatement(true);
          if ( !nbody && this.err('null.stmt','for.iter',
               { s:startc, l:startLoc, h: head, iter: afterHead, scopeFlags: scopeFlags }) )
            return this.errorHandlerOutput;

          this.scopeFlags = scopeFlags;

          this.foundStatement = true;
          this.exitScope();
          return { type: kind, loc: { start: startLoc, end: nbody.loc.end },
            start: startc, end: nbody.end, right: core(afterHead), left: core(head), body: nbody/* ,y:-1*/ };

       default:
          return this.err('for.iter.not.of.in',startc, startLoc,head);
    }
  }

  if ( this.unsatisfiedAssignment &&
       this.err('for.simple.head.is.unsatisfied',startc,startLoc,head) )
    return this.errorHandlerOutput ;

/*
  if ( head && !headIsExpr ) {
    head.end = this.c;
    head.loc.end = { line: head.loc.end.line, column: this.col };
  }
*/
  if ( ! this.expectType_soft (';') &&
         this.err('for.simple.no.init.comma',startc,startLoc,head) )
    return this.errorHandlerOutput ;

  afterHead = this.parseExpr(CONTEXT_NULLABLE );
  if ( ! this.expectType_soft (';') &&
         this.err('for.simple.no.test.comma',startc,startLoc,head,afterHead) )
    return this.errorHandlerOutput ;

  var tail = this.parseExpr(CONTEXT_NULLABLE );

  if ( ! this.expectType_soft (')') &&
         this.err('for.simple.no.end.paren',startc,startLoc,head,afterHead,tail) )
    return this.errorHandlerOutput ;

  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= ( SCOPE_FLAG_CONTINUE|SCOPE_FLAG_BREAK );
  nbody = this.parseStatement(true);
  if ( !nbody && this.err('null.stmt','for.simple',
      { s:startc, l:startc, h: head, t: afterHead, u: tail, scopeFlags: scopeFlags } ) )
    return this.errorhandlerOutput;  

  this.scopeFlags = scopeFlags;

  this.foundStatement = true;

  this.exitScope();
  return { type: 'ForStatement', init: head && core(head), start : startc, end: nbody.end,
         test: afterHead && core(afterHead),
         loc: { start: startLoc, end: nbody.loc.end },
          update: tail && core(tail),
         body: nbody/* ,y:-1*/ };
};

this.ensureVarsAreNotResolvingToCatchParams = function() {
  for (var name in this.scope.definedNames) {
    if (this.scope.definedNames[name] & DECL_MODE_CATCH_PARAMS)
      this.err('for.of.var.overrides.catch', name.substr(0, name.length-1));
  }
};

},
function(){
this.parseArgs = function (argLen) {
  var list = [], elem = null;

  if (!this.expectType_soft('('))
    this.err('func.args.no.opening.paren',argLen);

  var firstNonSimpArg = null;
  while (list.length !== argLen) {
    elem = this.parsePattern();
    if (elem) {
      if (this.lttype === 'op' && this.ltraw === '=') {
        elem = this.parseAssig(elem);
        this.makeComplex();
      }
      if (!firstNonSimpArg && elem.type !== 'Identifier')
        firstNonSimpArg =  elem;
      list.push(elem);
    }
    else break ;
    
    if (this.lttype === ',' ) this.next();
    else break;
  }
  if (argLen === ARGLEN_ANY) {
    if (this.lttype === '...') {
      this.makeComplex();
      elem = this.parseRestElement();
      list.push( elem  );
      if ( !firstNonSimpArg )
        firstNonSimpArg = elem;
    }
  }
  else if (list.length !== argLen)
    this.err('func.args.not.enough',argLen,list);

  if (!this.expectType_soft (')'))
    this.err('func.args.no.end.paren',argLen,list);

  if (firstNonSimpArg)
    this.firstNonSimpArg = firstNonSimpArg;
 
  return list;
};

this.parseFuncBody = function(context) {
  var elem = null;
  
  if ( this.lttype !== '{' ) {
    elem = this.parseNonSeqExpr(PREC_WITH_NO_OP, context|CONTEXT_NULLABLE);
    if ( elem === null )
      return this.err('func.body.is.empty.expr',context);
    return elem;
  }

  this.scopeFlags |= SCOPE_FLAG_IN_BLOCK;
  var startc= this.c - 1, startLoc = this.locOn(1);
  this.next() ;

  this.directive = DIRECTIVE_FUNC;
  var list = this.blck();

  var n = { type : 'BlockStatement', body: list, start: startc, end: this.c,
           loc: { start: startLoc, end: this.loc() }/* ,scope: this.scope ,y:-1*/ };

  if ( ! this.expectType_soft ( '}' ) &&
         this.err('func.body.is.unfinished',n) )
    return this.errorHandlerOutput ;

  return  n;
};

this . makeStrict  = function() {
   if ( this.firstNonSimpArg )
     return this.err('func.strict.non.simple.param')  ; 

   if ( this.tight ) return;

   // TODO: squash them into one
   this.tight = true;
   this.scope.strict = true;

   var a = null, argNames = this.scope.definedNames;
   for (a in argNames) {
     var declType = argNames[a];
     a = a.substring(0,a.length-1);
     if (declType&DECL_DUPE)
       this.err('func.args.has.dup',a);

     ASSERT.call(this, !arguments_or_eval(a));
     this.validateID(a);
   }
};


},
function(){
this.parseFunc = function(context, flags) {
  var prevLabels = this.labels,
      prevStrict = this.tight,
      prevScopeFlags = this.scopeFlags,
      prevDeclMode = this.declMode,
      prevYS = this.firstYS,
      prevNonSimpArg = this.firstNonSimpArg;

  var isStmt = false, startc = this.c0, startLoc = this.locBegin();
  if (this.canBeStatement) {
    isStmt = true;
    this.canBeStatement = false;
  }

  var isGen = false,
      isWhole = !(flags & MEM_CLASS_OR_OBJ);
   
  var argLen = !(flags & MEM_ACCESSOR) ? ARGLEN_ANY :
    (flags & MEM_SET) ? ARGLEN_SET : ARGLEN_GET;

  // current func name
  var cfn = null;

  if (isWhole) { 
    this.next();
    if (this.lttype === 'op' && this.ltraw === '*') {
      isGen = true;
      this.next();
    }

    if (isStmt) {
      if (!this.canDeclareFunctionsInScope())
        this.err('func.decl.not.allowed');
      if (this.unsatisfiedLabel) {
        if (!this.canLabelFunctionsInScope())
          this.err('func.decl.not.alowed');
        this.fixupLabels(false);
      }
      if (this.lttype === 'Identifier') {
        this.declMode = DECL_MODE_FUNCTION_DECL;
        cfn = this.parsePattern();
      }
      else if (!(context & CONTEXT_DEFAULT))
        this.err('missing.name', 'func');
    }
    else {
      // FunctionExpression's BindingIdentifier can be yield regardless of context;
      // but a GeneratorExpression's BindingIdentifier can't be 'yield'
      this.scopeFlags = isGen ?
        SCOPE_FLAG_ALLOW_YIELD_EXPR :
        SCOPE_FLAG_NONE;
      if (this.lttype === 'Identifier') {
        this.enterLexicalScope(false);
        this.scope.synth = true;
        this.declMode = DECL_MODE_FUNCTION_EXPR;
        cfn = this.parsePattern();
      }
    }
  }
  else if (flags & MEM_GEN)
    isGen = true;

  this.enterFuncScope(isStmt); 
  this.declMode = DECL_MODE_FUNCTION_PARAMS;

  this.scopeFlags = SCOPE_FLAG_ARG_LIST;
  if (isGen)
    this.scopeFlags |= SCOPE_FLAG_ALLOW_YIELD_EXPR;
  else if (flags & MEM_SUPER)
    this.scopeFlags |= (flags & (MEM_SUPER|MEM_CONSTRUCTOR));
  
  // class members, along with obj-methods, have strict formal parameter lists,
  // which is a rather misleading name for a parameter list in which dupes are not allowed
  if (!this.tight && !isWhole)
    this.enterComplex();

  this.firstNonSimpArg = null;
  var argList = this.parseArgs(argLen);

  this.scopeFlags &= ~SCOPE_FLAG_ARG_LIST;
  this.scopeFlags |= SCOPE_FLAG_FN;  

  this.labels = {};
  var nbody = this.parseFuncBody(context & CONTEXT_FOR);

  var n = {
    type: isStmt ? 'FunctionDeclaration' : 'FunctionExpression', id: cfn,
    start: startc, end: nbody.end, generator: isGen,
    body: nbody, loc: { start: startLoc, end: nbody.loc.end },
    expression: nbody.type !== 'BlockStatement', params: argList 
  };

  if (isStmt)
    this.foundStatement = true;

  this.labels = prevLabels;
  this.tight = prevStrict;
  this.scopeFlags = prevScopeFlags;
  this.declMode = prevDeclMode;
  this.firstYS = prevYS;
  this.firstNonSimpArg = prevNonSimpArg;
  
  this.exitScope();
  return n;
};
  
this.parseMeth = function(name, flags) {
  if (this.lttype !== '(')
    this.err('meth.paren', name, flags);
  var val = null;
  if (flags & MEM_CLASS) {
    // all modifiers come at the beginning
    if (flags & MEM_STATIC) {
      if (flags & MEM_PROTOTYPE)
        this.err('class.prototype.is.static.mem', name, flags);

      flags &= ~(MEM_CONSTRUCTOR|MEM_SUPER);
    }

    if (flags & MEM_CONSTRUCTOR) {
      if (flags & MEM_SPECIAL)
        this.err('class.constructor.is.special.mem', name, flags);
      if (flags & MEM_HAS_CONSTRUCTOR)
        this.err('class.constructor.is.a.dup', name, flags);
    }

    val = this.parseFunc(CONTEXT_NONE, flags);

    return {
      type: 'MethodDefinition', key: core(name),
      start: name.start, end: val.end,
      kind: (flags & MEM_CONSTRUCTOR) ? 'constructor' : (flags & MEM_GET) ? 'get' :
            (flags & MEM_SET) ? 'set' : 'method',
      computed: name.type === PAREN,
      loc: { start: name.loc.start, end: val.loc.end },
      value: val, 'static': !!(flags & MEM_STATIC)/* ,y:-1*/
    }
  }
   
  val = this.parseFunc(CONTEXT_NONE, flags);

  return {
    type: 'Property', key: core(name),
    start: name.start, end: val.end,
    kind:
     !(flags & MEM_ACCESSOR) ? 'init' :
      (flags & MEM_SET) ? 'set' : 'get',
    computed: name.type === PAREN,
    loc: { start: name.loc.start, end : val.loc.end },
    method: (flags & MEM_ACCESSOR) === 0, shorthand: false,
    value : val/* ,y:-1*/
  }
};


},
function(){
this . notId = function(id) { throw new Error ( 'not a valid id '   +   id )   ;  } ;
this. parseIdStatementOrId = function ( context ) {
  var id = this.ltval ;
  var pendingExprHead = null;

  SWITCH:
  switch (id.length) {
    case 1:
       pendingExprHead = this.id(); break SWITCH ;

    case 2: switch (id) {
        case 'do': return this.parseDoWhileStatement();
        case 'if': return this.parseIfStatement();
        case 'in':
           if ( context & CONTEXT_FOR )
             return null;
 
           this.notId() ;
        default: pendingExprHead = this.id(); break SWITCH ;
    }

    case 3: switch (id) {
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
               return this.parseLet(CONTEXT_NONE);

             if (this.tight ) this.err('strict.let.is.id',context);

             pendingExprHead = this.id();
             break SWITCH;

        case 'var': return this.parseVariableDeclaration( context & CONTEXT_FOR );
        case 'int':
            if ( this.v <= 5 )
              this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 4: switch (id) {
        case 'null':
            pendingExprHead = this.parseNull();
            break SWITCH;
        case 'void':
            if ( this.canBeStatement )
               this.canBeStatement = false;
            this.lttype = 'u'; 
            this.isVDT = VDT_VOID;
            return null;
        case 'this':
            pendingExprHead = this. parseThis();
            break SWITCH;
        case 'true':
            pendingExprHead = this.parseTrue();
            break SWITCH;
        case 'case':
            if ( this.canBeStatement ) {
              this.foundStatement = true;
              this.canBeStatement = false ;
              return null;
            }

        case 'else':
            this.notId();
        case 'with':
            return this.parseWithStatement();
        case 'enum': case 'byte': case 'char': case 'goto':
        case 'long':
            if ( this. v <= 5 ) this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 5: switch (id) {
        case 'super': pendingExprHead = this.parseSuper(); break SWITCH;
        case 'break': return this.parseBreakStatement();
        case 'catch': this.notId ()  ;
        case 'class': return this.parseClass(CONTEXT_NONE ) ;
        case 'const':
            if (this.v<5) this.err('const.not.in.v5',context) ;
            return this.parseVariableDeclaration(CONTEXT_NONE);

        case 'throw': return this.parseThrowStatement();
        case 'while': return this.parseWhileStatement();
        case 'yield': 
             if ( this.scopeFlags & SCOPE_FLAG_GEN ) {
                if (this.scopeFlags & SCOPE_FLAG_ARG_LIST)
                  this.err('yield.args');

                if ( this.canBeStatement )
                     this.canBeStatement = false;

                this.lttype = 'yield';
                return null;
             }
             else if (this.tight) this.errorReservedID(null);

             pendingExprHead = this.id();
             break SWITCH;
                 
        case 'false':
                pendingExprHead = this.parseFalse();
                break  SWITCH;
        case 'final':
        case 'float':
        case 'short':
            if ( this. v <= 5 ) this.errorReservedID() ;
        case 'await':
        default: pendingExprHead = this.id(); break SWITCH ;
    }

    case 6: switch (id) {
        case 'static':
            if ( this.tight || this.v <= 5 )
               this.error();

        case 'delete':
        case 'typeof':
            if ( this.canBeStatement )
               this.canBeStatement = false ;
            this.lttype = 'u'; 
            this.isVDT = id === 'delete' ? VDT_DELETE : VDT_VOID;
            return null;

        case 'export': 
            if ( this.isScript && this.err('export.not.in.module',context) )
              return this.errorHandlerOutput;

            return this.parseExport() ;

        case 'import':
            if ( this.isScript && this.err('import.not.in.module',context) )
              return this.errorHandlerOutput;

            return this.parseImport();

        case 'return': return this.parseReturnStatement();
        case 'switch': return this.parseSwitchStatement();
        case 'public':
            if (this.tight) this.errorReservedID();
        case 'double': case 'native': case 'throws':
            if ( this. v <= 5 ) this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH ;
    }

    case 7: switch (id) {
        case 'default':
           if ( this.canBeStatement ) this.canBeStatement = false ;
           return null;

        case 'extends': case 'finally':
           this.notId() ;

        case 'package': case 'private':
            if ( this. tight  )
               this.errorReservedID();

        case 'boolean':
            if ( this. v <= 5 )
               this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 8: switch (id) {
        case 'function': return this.parseFunc(context&CONTEXT_FOR, 0 );
        case 'debugger': return this.prseDbg();
        case 'continue': return this.parseContinueStatement();
        case 'abstract': case 'volatile':
           if ( this. v <= 5 ) this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 9: switch (id ) {
        case 'interface': case 'protected':
           if (this.tight) this.errorReservedID() ;

        case 'transient':
           if (this.v <= 5) this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 10: switch ( id ) {
        case 'instanceof':
           this.notId()  ;
        case 'implements':
           if ( this.v <= 5 || this.tight )
             this.resv();

        default: pendingExprHead = this.id(); break SWITCH ;
    }

    case 12:
       if ( this.v <= 5 && id === 'synchronized' ) this.errorReservedID();

    default: pendingExprHead = this.id();

  }

  if ( this.canBeStatement ) {
    this.canBeStatement = false;
    this.pendingExprHead = pendingExprHead;
    return null;
  }

  return pendingExprHead;
};
 

},
function(){
this.readAnIdentifierToken = function (v) {
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



},
function(){

this.parseLet = function(context) {

// this function is only calld when we have a 'let' at the start of a statement,
// or else when we have a 'let' at the start of a for's init; so, CONTEXT_FOR means "at the start of a for's init ",
// not 'in for'
 
  if ( !(this.scopeFlags & SCOPE_FLAG_IN_BLOCK) )
    this.err('lexical.decl.not.in.block');

  var startc = this.c0, startLoc = this.locBegin();
  var c = this.c, li = this.li, col = this.col;

  var letDecl = this.parseVariableDeclaration(context);

  if ( letDecl )
    return letDecl;

  if (this.tight && this.err('strict.let.is.id',{
      s: startc,l: startLoc,c: c,li: li,col: col}) )
    return this.errorHandlerOutput ;

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



},
function(){
this.loc = function() { return { line: this.li, column: this.col }; };
this.locBegin = function() { return  { line: this.li0, column: this.col0 }; };
this.locOn = function(l) { return { line: this.li, column: this.col - l }; };



},
function(){
// TODO: the values for li, col, and c can be calculated
// by adding the value of raw.length to li0, col0, and c0, respectively,
// but this holds only in a limited use case where the
// value of the `raw` param is known to be either 'static', 'get', or 'set';
// but if this is going to be called for any value of raw containing surrogates, it may not work correctly.
function assembleID(c0, li0, col0, raw, val) {
  return { 
    type: 'Identifier', raw: raw,
    name: val, end: c0 + raw.length,
    start: c0, 
    loc: {
      start: { line: li0, column: col0 },
      end: { line: li0, column: col0 + raw.length }
    }
  }
}

this.parseMem = function(context, flags) {
  var c0 = 0, li0 = 0, col0 = 0, nmod = 0,
      nli0 = 0, nc0 = 0, ncol0 = 0, nraw = "", nval = "", latestFlag = 0;

  if (this.lttype === 'Identifier') {
    c0 = this.c0; li0 = this.li; col0 = this.col0;
    LOOP:  
    // TODO: check version number when parsing get/set
    do {
      switch (this.ltval) {
      case 'static':
        if (!(flags & MEM_CLASS)) break LOOP;
        if (flags & MEM_STATIC) break LOOP;
        nc0 = this.c0; nli0 = this.li0;
        ncol0 = this.col0; nraw = this.ltraw;
        nval = this.ltval;
        nmod++;
        flags |= latestFlag = MEM_STATIC; this.next();
        break;

      case 'get':
      case 'set':
        if (flags & MEM_ACCESSOR) break LOOP;
        nc0 = this.c0; nli0 = this.li0;
        ncol0 = this.col0; nraw = this.ltraw;
        nval = this.ltval;
        flags |= latestFlag = this.ltval === 'get' ? MEM_GET : MEM_SET;
        nmod++; this.next();
        break;

      default: break LOOP;
      }
    } while (this.lttype === 'Identifier');
  }
  
  if (this.lttype === 'op' && this.ltraw === '*') {
    if (!c0) { c0 = this.c-1; li0 = this.li; col0 = this.col-1; }

    flags |= latestFlag = MEM_GEN;
    nmod++;
    this.next();
  }

  var nmem = null;
  switch (this.lttype) {
  case 'Identifier':
    if ((flags & MEM_CLASS)) {
      if (this.ltval === 'constructor') flags |= MEM_CONSTRUCTOR;
      if (this.ltval === 'prototype') flags |= MEM_PROTOTYPE;
    }
    else if (this.ltval === '__proto__')
      flags |= MEM_PROTO;

    nmem = this.memberID();
    break;
  case 'Literal':
    if ((flags & MEM_CLASS)) {
      if (this.ltval === 'constructor') flags |= MEM_CONSTRUCTOR;
      if (this.ltval === 'prototype') flags |= MEM_PROTOTYPE;
    }
    else if (this.ltval === '__proto__')
      flags |= MEM_PROTO;

    nmem = this.numstr();
    break;
  case '[':
    nmem = this.memberExpr();
    break;
  default:
    if (nmod && latestFlag !== MEM_GEN) {
      nmem = assembleID(nc0, nli0, ncol0, nraw, nval);
      flags &= ~latestFlag; // it's found out to be a name, not a modifier
      nmod--;
    }
  }

  if (nmem === null) {
    if (flags & MEM_GEN)
      this.err('mem.gen.has.no.name');
    return null;
  } 

  if (this.lttype === '(') {

    var mem = this.parseMeth(nmem, flags);
    if (c0) {
      mem.start = c0;
      mem.loc.start = { line: li0, column: col0 };
    }
    return mem;
  }

  if (flags & MEM_CLASS)
    this.err('unexpected.lookahead');

  if (nmod)
    this.err('unexpected.lookahead');

  return this.parseObjElem(nmem, context|(flags & MEM_PROTO));
};
 
this.parseObjElem = function(name, context) {
  var hasProto = context & CONTEXT_PROTO, firstProto = this.first__proto__;
  var val = null;
  context &= ~CONTEXT_PROTO;

  this.firstUnassignable = this.firstParen = null;
  switch (this.lttype) {
  case ':':
    if (hasProto && firstProto)
      this.err('obj.proto.has.dup');
    this.next();
    val = this.parseNonSeqExpr(PREC_WITH_NO_OP, context);
    // TODO: `this.unsatisfiedAssignment` is supposed to have been set to null
    // before this.parseObjElem(name, context); currently, this is always the case,
    // but maybe it would be better to omit the if below and let an
    // unsatisfied assignment get trapped in somewhere else, like parseNonSeqExpr.
    // the only reason of the if below is to fail early (that is, without parsing a whole node before failing.)
    if (this.unsatisfiedAssignment && !(context & CONTEXT_ELEM))
      this.err('obj.prop.assig.not.allowed', name, context);

    val = {
      type: 'Property', start: name.start,
      key: core(name), end: val.end,
      kind: 'init',
      loc: { start: name.loc.start, end: val.loc.end },
      computed: name.type === PAREN,
      method: false, shorthand: false, value: core(val)/* ,y:-1*/
    };
    if (hasProto)
      this.first__proto__ = val;
    return val;
 
  case 'op':
    if (name.type !== 'Identifier')
      this.err('obj.prop.assig.not.id', name, context);
    if (this.ltraw !== '=')
      this.err('obj.prop.assig.not.assigop', name, context);
    if (!(context & CONTEXT_ELEM))
      this.err('obj.prop.assig.not.allowed', name, context);
    val = this.parseAssig(name);
    this.unsatisfiedAssignment = val;
    break;

  default:
    if (name.type !== 'Identifier')
      this.err('obj.prop.assig.not.id', name, context);
    this.validateID(name.name);
    val = name;
    break;
  }
  
  return {
    type: 'Property', key: name,
    start: val.start, end: val.end,
    loc: val.loc, kind: 'init',
    shorthand: true, method: false,
    value: val, computed: false/* ,y:-1*/
  };
};



},
function(){
this .memberID = function() { return this.v > 5 ? this.id() : this.validateID(null) ; };
this .memberExpr = function() {
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next() ;
  var e = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE); // TODO: should be CONTEXT_NULLABLE, or else the next line is in vain 
  if (!e && this.err('prop.dyna.no.expr',startc,startLoc) ) // 
    return this.errorHandlerOutput ;

  var n = { type: PAREN, expr: e, start: startc, end: this.c, loc: { start: startLoc, end: this.loc() } } ;
  if ( !this.expectType_soft (']') &&
        this.err('prop.dyna.is.unfinished',n) )
    return this.errorHandlerOutput ;
 
  return n;
};



},
function(){
this.parseNewHead = function () {
  var startc = this.c0, end = this.c, startLoc = this.locBegin(), li = this.li, col = this.col, raw = this.ltraw ;
  this.next () ;
  if ( this.lttype === '.' ) {
     this.next();
     return this.parseMeta(startc ,end,startLoc,{line:li,column:col},raw );
  }

  var head, elem, inner;
  switch (this  .lttype) {
    case 'Identifier':
       head = this.parseIdStatementOrId (CONTEXT_NONE);
       break;

    case '[':
       head = this. parseArrayExpression(CONTEXT_UNASSIGNABLE_CONTAINER);
       break ;

    case '(':
       head = this. parseParen() ;
       break ;

    case '{':
       head = this. parseObjectExpression(CONTEXT_UNASSIGNABLE_CONTAINER) ;
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

    default:
       head = this.err('new.head.is.not.valid',startc, startLoc);
       if ( head.type === ERR_RESUME ) {
           head = head.val ;
           break ;
       }
       return head.val;
  }


  var inner = core( head ) ;
  while ( true ) {
    switch (this. lttype) {
       case '.':
          this.next();
          if (this.lttype !== 'Identifier')
            this.err('mem.name.not.id');

          elem = this.memberID();
          head =   {  type: 'MemberExpression', property: elem, start: head.start, end: elem.end,
                      loc: { start: head.loc.start, end: elem.loc.end }, object: inner, computed: false/* ,y:-1*/ };
          inner = head;
          continue;

       case '[':
          this.next() ;
          elem = this.parseExpr(CONTEXT_NONE) ;
          head =  { type: 'MemberExpression', property: core(elem), start: head.start, end: this.c,
                    loc: { start : head.loc.start, end: this.loc() }, object: inner, computed: true/* ,y:-1*/ };
          inner = head ;
          if ( !this.expectType_soft (']') ) {
            head = this.err('mem.unfinished',startc,startLoc,head)  ;
            if (head .type === ERR_RESUME)
              head = head.val;
     
            else
              return head.val;
          }
 
          continue;

       case '(':
          elem = this. parseArgList();
          inner = { type: 'NewExpression', callee: inner, start: startc, end: this.c,
                    loc: { start: startLoc, end: this.loc() }, arguments: elem /* ,y:-1*/};
          if ( !this. expectType_soft (')') ) {
            inner = this.err('new.args.is.unfinished',startc,startLoc,inner) ;
            if ( inner.type === ERR_RESUME )
              inner = inner.val;
            else
              return inner.val;
          }

          return inner;

       case '`' :
           elem = this.parseTemplateLiteral () ;
           head = {
                type : 'TaggedTemplateExpression' ,
                quasi :elem ,
                start: head.start,
                 end: elem.end,
                loc : { start: head.loc.start, end: elem.loc.end },
                tag : inner /* ,y:-1*/
            };
            inner = head;
            continue ;

        default: return { type: 'NewExpression', callee: inner, start: startc, end: head.end,
                 loc: { start: startLoc, end: head.loc.end }, arguments : [] /* ,y:-1*/};

     }
  }
};


},
function(){
this.next = function () {
  if ( this.skipS() ) return;
  if (this.c >= this.src.length) {
      this. lttype =  'eof' ;
      this.ltraw=  '<<EOF>>';
      return ;
  }
  var c = this.c,
      l = this.src,
      e = l.length,
      r = 0,
      peek,
      start =  c;

  peek  = this.src.charCodeAt(start);
  if ( isIDHead(peek) )this.readAnIdentifierToken('');
  else if (Num(peek))this.readNumberLiteral(peek);
  else {
    switch (peek) {
      case CHAR_MIN: this.opMin(); break;
      case CHAR_ADD: this.opAdd() ; break;
      case CHAR_MULTI_QUOTE:
      case CHAR_SINGLE_QUOTE:
        return this.readStrLiteral(peek);
      case CHAR_SINGLEDOT: this.readDot () ; break ;
      case CHAR_EQUALITY_SIGN:  this.opEq () ;   break ;
      case CHAR_LESS_THAN: this.opLess() ;   break ;
      case CHAR_GREATER_THAN: this.opGrea() ;   break ;
      case CHAR_MUL:
         this.ltraw = '*';
         this.lttype = 'op';
         c++ ;
         if ( l.charCodeAt(c+1) === peek) {
           this.ltraw = '**';
           c++ ;
         }
         if (l.charCodeAt(c) === CHAR_EQUALITY_SIGN) {
           c++;
           this. prec = PREC_OP_ASSIG;
           this.ltraw += '=';
         }
         else {
           this. prec = PREC_MUL;
         }
         this.c=c;
         break ;

      case CHAR_MODULO:
         this.lttype = 'op';
         c++ ;
         if (l.charCodeAt(c) === CHAR_EQUALITY_SIGN) {
           c++;
           this. prec = PREC_OP_ASSIG;
           this.ltraw = '%=';
         }
         else {
           this. prec = PREC_MUL;
           this.ltraw = '%';
         }
         this.c=c;
         break ;

      case CHAR_EXCLAMATION:
         c++ ;
         if ( l.charCodeAt(c) === CHAR_EQUALITY_SIGN ) {
           this. lttype = 'op';
           c++;
           this.prec = PREC_EQUAL;
           if ( l.charCodeAt(c) === CHAR_EQUALITY_SIGN ) {
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

      case CHAR_COMPLEMENT:
            c++;
            this.c=c;
            this.ltraw = '~';
            this.lttype = 'u';
            break ;

      case CHAR_OR:
         c++;
         this.lttype = 'op' ;
         switch ( l.charCodeAt(c) ) {
            case CHAR_EQUALITY_SIGN:
                 c++;
                 this.prec = PREC_OP_ASSIG ;
                 this.ltraw = '|=';
                 break ;

            case CHAR_OR:
                 c++;
                 this.prec = PREC_BOOL_OR;
                 this.ltraw = '||'; break ;

            default:
                 this.prec = PREC_BIT_OR;
                 this.ltraw = '|';
                 break ;
         }
         this.c=c;
         break;

      case CHAR_AND:
          c++ ;
          this.lttype = 'op';
          switch ( l.charCodeAt(c) ) {
            case CHAR_EQUALITY_SIGN:
               c++;
               this. prec = PREC_OP_ASSIG;
               this.ltraw = '&=';
               break;

            case CHAR_AND:
               c ++;
               this.prec = PREC_BOOL_AND;
               this.ltraw = '&&';
               break ;

            default:
               this.prec = PREC_BIT_AND;
               this.ltraw = '&';
               break ;
         }
         this.c=c;
         break ;

      case CHAR_XOR:
        c++;
        this.lttype = 'op';
        if ( l.charCodeAt(c) === CHAR_EQUALITY_SIGN ) {
          c++;
          this.prec = PREC_OP_ASSIG;
          this.ltraw = '^=';
        }
        else  {
          this.  prec = PREC_XOR;
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

        if (CHAR_BACK_SLASH === peek) {
            mustBeAnID = 1;
            peek = l.charCodeAt(++ this.c);
            if (peek !== CHAR_u )
                return this.err('id.u.not.after.slash');
            
            else
               peek = this.peekUSeq();
        }
        if (peek >= 0x0D800 && peek <= 0x0DBFF ) {
            mustBeAnID = 2 ;
            this.c++;
            r = this.peekTheSecondByte();
        }
        if (mustBeAnID) {
           if (!isIDHead(mustBeAnID === 1 ? peek :
                  ((peek - 0x0D800)<<10) + (r-0x0DC00) + (0x010000) ) ) {
              if ( mustBeAnID === 1 ) return this.err('id.esc.must.be.idhead',peek);
              else return this.err('id.multi.must.be.idhead',peek,r);
            }
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

this . opEq = function()  {
    var c = this.c;
    var l = this.src;
    this.lttype = 'op';
    c++ ;

    if ( l.charCodeAt(c) === CHAR_EQUALITY_SIGN ) {
      c++;
      this.prec = PREC_EQUAL ;
      if ( l.charCodeAt(c ) === CHAR_EQUALITY_SIGN ){
        c++ ;
        this.ltraw = '===';
      }
      else this.ltraw = '==';
    }
    else {
        this.prec = PREC_SIMP_ASSIG;
        if ( l.charCodeAt(c) === CHAR_GREATER_THAN) {
          c++;
          this. ltraw = '=>';
        }
        else  this.ltraw = '=' ;
    }

    this.c=c;
};

this . opMin = function() {
   var c = this.c;
   var l = this.src;
   c++;

   switch( l.charCodeAt(c) ) {
      case  CHAR_EQUALITY_SIGN:
         c++;
         this.prec = PREC_OP_ASSIG;
         this. lttype = 'op';
         this.ltraw = '-=';
         break ;

      case  CHAR_MIN:
         c++;
         this.prec = PREC_OO;
         this. lttype = this.ltraw = '--';
         break ;

      default:
         this.ltraw = this.lttype = '-';
         break ;
   }
   this.c=c;
};

this . opLess = function () {
  var c = this.c;
  var l = this.src;
  this.lttype = 'op';
  c++ ;

  if ( l.charCodeAt(c ) === CHAR_LESS_THAN ) {
     c++;
     if ( l.charCodeAt(c) === CHAR_EQUALITY_SIGN ) {
        c++;
        this. prec = PREC_OP_ASSIG ;
        this. ltraw = '<<=' ;
     }
     else {
        this.ltraw = '<<';
        this. prec = PREC_SH ;
     }
  }
  else  {
     this. prec = PREC_COMP ;
     if ( l.charCodeAt(c) === CHAR_EQUALITY_SIGN ) {
        c++ ;
        this.ltraw = '<=';
     }
     else this.ltraw = '<';
  }

  this.c=c;
};

this . opAdd = function() {
   var c = this.c;
   var l = this.src;
   c++ ;

   switch ( l.charCodeAt(c) ) {
       case CHAR_EQUALITY_SIGN:
         c ++ ;
         this. prec = PREC_OP_ASSIG;
         this. lttype = 'op';
         this.ltraw = '+=';

         break ;

       case CHAR_ADD:
         c++ ;
         this. prec = PREC_OO;
         this. lttype = '--';
         this.ltraw = '++';
         break ;

       default: this. ltraw = '+' ; this. lttype = '-';
   }
   this.c=c;
};

this . opGrea = function()   {
  var c = this.c;
  var l = this.src;
  this.lttype = 'op';
  c++ ;

  if ( l.charCodeAt(c) === CHAR_GREATER_THAN ) {
    c++;
    if ( l.charCodeAt(c) === CHAR_GREATER_THAN ) {
       c++;
       if ( l.charCodeAt(c) === CHAR_EQUALITY_SIGN ) {
         c++ ;
         this. prec = PREC_OP_ASSIG;
         this. ltraw = '>>>=';
       }
       else {
         this. ltraw = '>>>';
         this. prec = PREC_SH;
       }
    }
    else if ( l.charCodeAt(c) === CHAR_EQUALITY_SIGN ) {
       c++ ;
       this. prec = PREC_OP_ASSIG;
       this.ltraw = '>>=';
    }
    else {
       this. prec=  PREC_SH;
       this. ltraw    = '>>';
    }
  }
  else  {
    this. prec = PREC_COMP  ;
    if ( l.charCodeAt(c) === CHAR_EQUALITY_SIGN ) {
      c++ ;
      this. ltraw = '>=';
    }
    else  this. ltraw = '>';
  }
  this.c=c;
};

this.skipS = function() {
     var noNewLine = true,
         startOffset = this.c,
         c = this.c,
         l = this.src,
         e = l.length,
         start = c;

     while ( c < e ) {
       switch ( l.charCodeAt ( c ) ) {
         case CHAR_WHITESPACE :
             while ( ++c < e &&  l.charCodeAt(c) === CHAR_WHITESPACE );
             continue ;
         case CHAR_CARRIAGE_RETURN : if ( CHAR_LINE_FEED === l.charCodeAt( c + 1 ) ) c ++;
         case CHAR_LINE_FEED :
            if ( noNewLine ) noNewLine = false ;
            start = ++ c ;
            this.li ++ ;
            this.col = ( 0)
            continue ;

         case CHAR_VTAB:
         case CHAR_TAB:
         case CHAR_FORM_FEED: c++ ; continue ;  

         case CHAR_DIV:
             switch ( l.charCodeAt ( c + ( 1) ) ) {
                 case CHAR_DIV:
                     c ++ ;
                     this.c=c;
                     this.readLineComment () ;
                     if ( noNewLine ) noNewLine = false ;
                     start = c = this.c ;
                     continue ;

                 case CHAR_MUL:
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
                     return true;
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

         case CHAR_LESS_THAN:
            if ( this.isScript &&
                 l.charCodeAt(c+1) === CHAR_EXCLAMATION &&
                 l.charCodeAt(c+2) === CHAR_MIN &&
                 l.charCodeAt(c+ 1 + 2) === CHAR_MIN ) {
               this.c = c + 4;
               this.readLineComment();
               c = this.c;
               continue;
            }
            this.col += (c-start ) ;
            this.c=c;
            this.newLineBeforeLookAhead = !noNewLine ;
            return ;
 
         case CHAR_MIN:
            if ( (!noNewLine || startOffset === 0) &&
                 this.isScript &&
                 l.charCodeAt(c+1) === CHAR_MIN && l.charCodeAt(c+2) === CHAR_GREATER_THAN ) {
               this.c = c + 1 + 2;
               this.readLineComment();
               c = this.c;
               continue;
            }
  
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

this.readDot = function() {
   ++this.c;
   if( this.src.charCodeAt(this.c)===CHAR_SINGLEDOT) {
     if (this.src.charCodeAt(++ this.c) === CHAR_SINGLEDOT) { this.lttype = '...' ;   ++this.c; return ; }
     this.err('Unexpectd ' + this.src[this.c]) ;
   }
   else if ( Num(this.src.charCodeAt(this.c))) {
       this.lttype = 'Literal' ;
       this.c0  = this.c - 1;
       this.li0 = this.li;
       this.col0= this.col ;

       this.frac( -1 ) ;
       return;
   }
   this. ltraw = this.lttype = '.' ;
};

this.readMisc = function () { this.lttype = this.  src.   charAt (   this.c ++  )    ; };

this.expectType = function (n)  {
  this.assert(this.lttype === n, 'expected ' + n + '; got ' + this.lttype  )  ;
  this.next();
};

this.expectID = function (n) {
  this.assert(this.lttype === 'Identifier' && this.ltval === n)  ;
  this.next();
};

this.expectType_soft = function (n)  {
  if (this.lttype === n ) {
      this.next();
      return true;
  }

  return false;
};

this.expectID_soft = function (n) {
  if (this.lttype === 'Identifier' && this.ltval === n) {
     this.next();
     return true;
  }

  return false;
};


},
function(){
this.parseExpr = function (context) {
  var head = this.parseNonSeqExpr(PREC_WITH_NO_OP,context );

  var lastExpr;
  if ( this.lttype === ',' ) {
    context &= CONTEXT_FOR;

    var e = [core(head)] ;
    do {
      this.next() ;
      lastExpr = this.parseNonSeqExpr(PREC_WITH_NO_OP,context);
      e.push(core(lastExpr));
    } while (this.lttype === ',' ) ;

    return  { type: 'SequenceExpression', expressions: e, start: head.start, end: lastExpr.end,
              loc: { start : head.loc.start, end : lastExpr.loc.end}/* ,y:-1*/ };
  }

  return head ;
};

this .parseCond = function(cond,context ) {
    this.next();
    var seq = this. parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE ) ;
    if ( !this.expectType_soft (':') && this.err('cond.colon',cond,context,seq) )
      return this.errorHandlerOutput;

    var alt = this. parseNonSeqExpr(PREC_WITH_NO_OP, context ) ;
    return { type: 'ConditionalExpression', test: core(cond), start: cond.start , end: alt.end ,
             loc: { start: cond.loc.start, end: alt.loc.end }, consequent: core(seq), alternate: core(alt) /* ,y:-1*/};
};

this .parseUnaryExpression = function(context ) {
  var u = null, startLoc = null, startc = 0;
  var isVDT = this.isVDT;
  if ( isVDT ) {
    this.isVDT = VDT_NONE;
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

  var arg = this. parseNonSeqExpr(PREC_U,context|CONTEXT_UNASSIGNABLE_CONTAINER );

  if (this.tight && isVDT === VDT_DELETE && core(arg).type !== 'MemberExpression')
    this.err('delete.arg.not.a.mem', startc, startLoc, arg);

  return { type: 'UnaryExpression', operator: u, start: startc, end: arg.end,
           loc: { start: startLoc, end: arg.loc.end }, prefix: true, argument: core(arg) };
};

this .parseUpdateExpression = function(arg, context) {
    var c = 0,
        loc = null,
        u = this.ltraw;

    if ( arg === null ) {
       c  = this.c-2;
       loc = this.locOn(2);
       this.next() ;
       arg = this. parseExprHead(context|CONTEXT_UNASSIGNABLE_CONTAINER );
       this.assert(arg); // TODO: this must have error handling

       if ( !this.ensureSimpAssig_soft (core(arg)) &&
            this.err('incdec.pre.not.simple.assig',c,loc,arg) )
         return this.errorHandlerOutput;

       return { type: 'UpdateExpression', argument: core(arg), start: c, operator: u,
                prefix: true, end: arg.end, loc: { start: loc, end: arg.loc.end } };
    }

    if ( !this.ensureSimpAssig_soft(core(arg)) &&
          this.err('incdec.post.not.simple.assig',arg) )
      return this.errorHandlerOutput;

    c  = this.c;
    loc = { start: arg.loc.start, end: { line: this.li, column: this.col } };
    this.next() ;
    return { type: 'UpdateExpression', argument: core(arg), start: arg.start, operator: u,
             prefix: false, end: c, loc: loc };

};

this .parseO = function(context ) {

    switch ( this. lttype ) {

      case 'op': return true;
      case '--': return true;
      case '-': this.prec = PREC_ADD_MIN; return true;
      case '/':
           if ( this.src.charCodeAt(this.c) === CHAR_EQUALITY_SIGN ) {
             this.c++ ;
             this.prec = PREC_OP_ASSIG;
             this.ltraw = '/=';
             this.col++; 
           }
           else
              this.prec = PREC_MUL ; 

           return true;

      case 'Identifier': switch ( this. ltval ) {
         case 'instanceof':
           this.prec = PREC_COMP  ;
           this.ltraw = this.ltval ;
           return true;

         case 'of':
         case 'in':
            if ( context & CONTEXT_FOR ) break ;
            this.prec = PREC_COMP ;
            this.ltraw = this.ltval;
            return true;
     }
     break;

     case '?': this .prec = PREC_COND  ; return true;
   }

   return false ;
};

this.parseNonSeqExpr = function (prec, context  ) {
    var firstUnassignable = null, firstParen = null;

    var head = this. parseExprHead(context);

    if ( head === null ) {
         switch ( this.lttype ) {
           case 'u':
           case '-':
              head = this. parseUnaryExpression(context & CONTEXT_FOR );
              break ;

           case '--':
              head = this. parseUpdateExpression(null, context&CONTEXT_FOR );
              break ;

           case 'yield':
              if (prec !== PREC_WITH_NO_OP) // make sure there is no other expression before it 
                return this.err('yield.as.an.id',context,prec) ;

              return this.parseYield(context); // everything that comes belongs to it
   
           default:
              if (!(context & CONTEXT_NULLABLE) )
                return this.err('nexpr.null.head',context,prec);
               
              return null;
         }
    }
    else if ( prec === PREC_WITH_NO_OP ) {
      firstParen = head. type === PAREN ? head.expr : this.firstParen ;      
      firstUnassignable = this.firstUnassignable;
    }   

    var op = false;
    while ( true ) {
       op = this. parseO( context );
       if ( op && isAssignment(this.prec) ) {
         this.firstUnassignable = firstUnassignable;
         if ( prec === PREC_WITH_NO_OP )
            head =  this. parseAssignment(head, context );
         
         else
            head = this.err('assig.not.first',
                 { c:context, u:firstUnassignable, h: head, paren: firstParen, prec: prec });

         break ;
       }
       else {
         if ( this.unsatisfiedArg && 
              this.err('arrow.paren.no.arrow',{c:context, u:firstUnassignable, h: head, p:firstParen, prec: prec}) )
           return this.errorHandlerOutput; 

         if ( this.firstEA )
            if( !(context & CONTEXT_ELEM_OR_PARAM) || op )
              this.err('assig.to.eval.or.arguments');

         if ( this.unsatisfiedAssignment ) {
            if ( !(prec===PREC_WITH_NO_OP && (context & CONTEXT_ELEM_OR_PARAM ) ) )
              this.err('assignable.unsatisfied');

            else break ;
         }
         if ( !op ) break;
       }

       if ( isMMorAA(this.prec) ) {
         if ( this. newLineBeforeLookAhead )
           break ;
         head = this. parseUpdateExpression(head, context & CONTEXT_FOR ) ;
         continue;
       }
       if ( isQuestion(this.prec) ) {
          if ( prec === PREC_WITH_NO_OP ) {
            head = this. parseCond(head, context&CONTEXT_FOR );
          }
          break ;
       }

       if ( this. prec < prec ) break ;
       if ( this. prec  === prec && !isRassoc(prec) ) break ;

       var o = this.ltraw;
       var currentPrec = this. prec;
       this.next();
       var right = this.parseNonSeqExpr(currentPrec, (context & CONTEXT_FOR)|CONTEXT_UNASSIGNABLE_CONTAINER );
       head = { type: !isBin(currentPrec )  ? 'LogicalExpression' :   'BinaryExpression',
                operator: o,
                start: head.start,
                end: right.end,
                loc: {
                   start: head.loc.start,
                   end: right.loc.end
                },
                left: core(head),
                right: core(right)/* ,y:-1*/
              };
    }
  
    if ( prec === PREC_WITH_NO_OP ) {
      this.firstParen = firstParen ;
      this.firstUnassignable = firstUnassignable;
    }

    return head;
};



},
function(){
this.readNumberLiteral = function (peek) {
  var c = this.c, src = this.src, len = src.length;
  var b = 10 , val = 0;
  this.lttype  = 'Literal' ;
  this.li0 = this.li ;
  this.col0 = this.col;
  this.c0 = this.c;

  if (peek === CHAR_0) { // if our num lit starts with a 0
    b = src.charCodeAt(++c);
    switch (b) { // check out what the next is
      case CHAR_X: case CHAR_x:
         c++;
         if (c >= len && this.err('num.with.no.digits','hex', c) )
           return this.errorHandlerOutput;
         b = src.charCodeAt(c);
         if ( ! isHex(b) && this.err('num.with.first.not.valid','hex', c)  )
           return this.errorHandlerOutput ;
         c++;
         while ( c < len && isHex( b = src.charCodeAt(c) ) )
             c++ ;
         this.ltval = parseInt( this.ltraw = src.slice(this.c,c) ) ;
         this.c = c;
         break;

      case CHAR_B: case CHAR_b:
        ++c;
        if (c >= len && this.err('num.with.no.digits','bin',c) )
          return this.errorHandlerOutput ;
        b = src.charCodeAt(c);
        if ( b !== CHAR_0 && b !== CHAR_1 && this.err('num.with.first.not.valid','bin',c) )
          return this.errorHandlerOutput ;
        val = b - CHAR_0; 
        ++c;
        while ( c < len &&
              ( b = src.charCodeAt(c), b === CHAR_0 || b === CHAR_1 ) ) {
           val <<= 1;
           val |= b - CHAR_0; 
           c++ ;
        }
        this.ltval = val ;
        this.ltraw = src.slice(this.c,c);
        this.c = c;
        break;

      case CHAR_O: case CHAR_o:
        ++c;
        if (c >= len && this.err('num.with.no.digits','oct',c) )
          return this.errorHandlerOutput ; 
        b = src.charCodeAt(c);
        if ( (b < CHAR_0 || b >= CHAR_8) && this.err('num.with.first.not.valid','oct',c)  )
          return this.errorHandlerOutput ;

        val = b - CHAR_0 ;
        ++c; 
        while ( c < len &&
              ( b = src.charCodeAt(c), b >= CHAR_0 && b < CHAR_8 ) ) {
           val <<= (1 + 2);
           val |= b - CHAR_0;
           c++ ;
        } 
        this.ltval = val ;
        this.ltraw = src.slice(this.c,c) ;
        this.c = c;
        break;

      default:
        if ( b >= CHAR_0 && b <= CHAR_9 ) {
          if ( this.tight ) this.err('num.legacy.oct');
          var base = 8;
          do {
            if ( b >= CHAR_8 && base === 8 ) base = 10 ;
            c ++;
          } while ( c < len &&
                  ( b = src.charCodeAt(c), b >= CHAR_0 && b <= CHAR_9) );
          
          b = this.c;
          this.c = c; 
  
          if ( !this.frac(b) )
            this.ltval = parseInt (this.ltraw = src.slice(b, c), base);
          
        }
        else {
          b = this.c ;
          this.c = c ;
          if ( !this.frac(b) ) {
             this.ltval = 0;
             this.ltraw = '0';
          }
        }
    }
  }

  else  {
    b = this.c;
    c ++ ;
    while (c < len && num(src.charCodeAt(c))) c++ ;
    this.c = c;
    if ( !this.frac(b) ) {
      this.ltval = parseInt(this.ltraw = src.slice(b, this.c)  ) ;
      this.c = c;
    }
  }
  // needless as it will be an error nevertheless, but it is still requir'd
  if ( ( this.c < len && isIDHead(src.charCodeAt(this.c))) ) this.err('num.idhead.tail') ; 
};

this . frac = function(n) {
  var c = this.c,
      l = this.src,
      e = l.length ;
  if ( n === -1 || l.charCodeAt(c)=== CHAR_SINGLEDOT )
     while( ++c < e && Num(l.charCodeAt (c)))  ;

  switch( l.charCodeAt(c) ){
      case CHAR_E:
      case CHAR_e:
        c++;
        switch(l.charCodeAt(c)){
          case CHAR_MIN:
          case CHAR_ADD:
                 c++ ;
        }
        if ( !(c < e && Num(l.charCodeAt(c))) )
          this.err('num.has.no.mantissa', c, n);

        do { c++;} while ( c < e && Num(l.charCodeAt( c) ));
  }

  if ( c === this.c ) return false  ;
  this.ltraw = l.slice (n === -1 ? this.c - 1 : n, c);
  this.ltval =  parseFloat(this.ltraw )  ;
  this.c = c ;
  return true   ;
}



},
function(){
this.parseObjectExpression = function (context) {
  var startc = this.c - 1 ,
      startLoc = this.locOn(1),
      elem = null,
      list = [];

  var firstUnassignable = null, firstParen = null, 
      unsatisfiedAssignment = this.unsatisfiedAssignment;

  var first__proto__ = null;
  var firstEA = null;

  var firstElemWithYS = null;
  var parenYS = null;

  var firstYS = this.firstYS;
  var firstNonTailRest = null;

  if ( context & CONTEXT_UNASSIGNABLE_CONTAINER ) 
    context = context & CONTEXT_PARAM;

  else
    context = context & CONTEXT_PARAM|CONTEXT_ELEM;

  do {
     this.next();
     this.unsatisfiedAssignment = null;
  
     this.first__proto__ = first__proto__;
     this.firstEA = null;
     this.firstElemWithYS = null;

     elem = this.parseMem(context, MEM_OBJ);
     if ( !first__proto__ && this.first__proto__ )
          first__proto__ =  this.first__proto__ ;

     if ( !firstEA && this.firstEA )
           firstEA =  this.firstEA ;

     if ( (context & CONTEXT_PARAM) && !firstElemWithYS && this.firstElemWithYS ) {
       parenYS = this.parenYS;
       firstElemWithYS = this.firstElemWithYS;
     }

     if ( elem ) {
       list.push(elem);
       if (!unsatisfiedAssignment && this.unsatisfiedAssignment ) {
           if (!( context & CONTEXT_ELEM)  ) this.err('assig.unsatisfied') ;
           unsatisfiedAssignment =  this.unsatisfiedAssignment ;
       }
       
       if ( !firstParen && this.firstParen )
             firstParen =  this.firstParen ;

       if ( !firstUnassignable && this.firstUnassignable )
             firstUnassignable =  this.firstUnassignable ;

       if ( !firstYS && this.firstYS )
         firstYS = this.firstYS;

       if ( !firstNonTailRest && this.firstNonTailRest )
             firstNonTailRest =  this.firstNonTailRest;
     }
     else
        break ;

  } while ( this.lttype === ',' );

  elem = { properties: list, type: 'ObjectExpression', start: startc,
     end: this.c , loc: { start: startLoc, end: this.loc() }/* ,y:-1*/};

  if ( ! this.expectType_soft ('}') && this.err('obj.unfinished',{
    obj: elem, asig: firstUnassignable, ea: firstEA,
    firstElemWithYS: firstElemWithYS, u: unsatisfiedAssignment, ys: firstYS }) )
    return this.errorHandlerOutput;

  if ( firstUnassignable ) this.firstUnassignable = firstUnassignable;
  if ( firstParen ) this.firstParen = firstParen;
  if ( firstEA ) this.firstEA = firstEA;
  if ( firstElemWithYS ) {
     this.parenYS = parenYS;
     this.firstElemWithYS = firstElemWithYS;  
  }
     
  if ( unsatisfiedAssignment )
     this.unsatisfiedAssignment = unsatisfiedAssignment ;

  this.firstYS = firstYS;
  this.firstNonTailRest = firstNonTailRest;

  return elem;
};



},
function(){

this.parsePattern = function() {
  switch ( this.lttype ) {
    case 'Identifier' :
       var id = this.validateID(null);
       this.declare(id);
       if (this.tight) this.assert(!arguments_or_eval(id.name));
       return id;

    case '[':
       return this.parseArrayPattern();
    case '{':
       return this.parseObjectPattern();

    default:
       return null;
  }
};

this. parseArrayPattern = function() {
  var startc = this.c - 1,
      startLoc = this.locOn(1),
      elem = null,
      list = [];

  this.enterComplex();

  this.next();
  while ( true ) {
      elem = this.parsePattern();
      if ( elem ) {
         if ( this.lttype === 'op' && this.ltraw === '=' ) elem = this.parseAssig(elem);
      }
      else {
         if ( this.lttype === '...' ) {
           list.push(this.parseRestElement());
           break ;
         }  
      }
    
      if ( this.lttype === ',' ) {
         list.push(elem);
         this.next();
      }       
      else  {
         if ( elem ) list.push(elem);
         break ;
      }
  } 

  elem = { type: 'ArrayPattern', loc: { start: startLoc, end: this.loc() },
           start: startc, end: this.c, elements : list/* ,y:-1*/};

  if ( !this. expectType_soft ( ']' ) &&
        this.err('pat.array.is.unfinished',elem) )
    return this.errorHandlerOutput ;

  return elem;
};

this.parseObjectPattern  = function() {

    var sh = false;
    var startc = this.c-1;
    var startLoc = this.locOn(1);
    var list = [];
    var val = null;
    var name = null;

    this.enterComplex();
    
    LOOP:
    do {
      sh = false;
      this.next ()   ;
      switch ( this.lttype ) {
         case 'Identifier':
            name = this.memberID();
            if ( this.lttype === ':' ) {
              this.next();
              val = this.parsePattern()
            }
            else {
              this.validateID(name.name);
              sh = true;
              val = name;
              this.declare(name);
            }
            break ;

         case '[':
            name = this.memberExpr();
            this.expectType(':');
            val = this.parsePattern();
            break ;

         case 'Literal':
            name = this.numstr();
            this.expectType(':');
            val = this.parsePattern();
            break ;

         default:
            break LOOP;
      }
      if ( this.lttype === 'op' && this.ltraw === '=' )
        val = this.parseAssig(val);

      list.push({ type: 'Property', start: name.start, key: core(name), end: val.end,
                  loc: { start: name.loc.start, end: val.loc.end },
                 kind: 'init', computed: name.type === PAREN, value: val,
               method: false, shorthand: sh/* ,y:-1*/ });

    } while ( this.lttype === ',' );

    var n = { type: 'ObjectPattern',
             loc: { start: startLoc, end: this.loc() },
             start: startc,
              end: this.c,
              properties: list/* ,y:-1*/ };

    if ( ! this.expectType_soft ('}') && this.err('pat.obj.is.unfinished',n) )
      return this.errorHandlerOutput ;

    return n;
};

this .parseAssig = function (head) {
    this.next() ;
    var e = this.parseNonSeqExpr( PREC_WITH_NO_OP, CONTEXT_NONE );
    return { type: 'AssignmentPattern', start: head.start, left: head, end: e.end,
           right: core(e), loc: { start: head.loc.start, end: e.loc.end } /* ,y:-1*/};
};


this.parseRestElement = function() {
   var startc = this.c-1-2,
       startLoc = this.locOn(1+2);

   this.next ();
   var e = this.parsePattern();

   if (!e) {
      if (this.err('rest.has.no.arg',starc, startLoc))
       return this.errorHandlerOutput ;
   }
   else if ( e.type !== 'Identifier' ) {
      if (this.err('rest.arg.not.id', startc, startLoc, e) )
        return this.errorHandlerOutput;
   }

   return { type: 'RestElement', loc: { start: startLoc, end: e.loc.end }, start: startc, end: e.end,argument: e };
};



},
function(){
this.parseExprHead = function (context) {
  var firstUnassignable = null;
  var firstParen = null;

  var head = null;
  var inner = null;
  var elem = null;

  if ( this. pendingExprHead ) {
      head = this. pendingExprHead;
      this. pendingExprHead  =  null;
  }
  else switch (this.lttype)  {
        case 'Identifier':
            if ( head = this. parseIdStatementOrId(context) )
               break ;

             return null;

        case '[' :
            this.firstUnassignable = this.firstParen = null;

            head = this. parseArrayExpression(
              context & (CONTEXT_UNASSIGNABLE_CONTAINER|CONTEXT_PARAM) );
            if ( this. unsatisfiedAssignment )
               return head ;

            firstUnassignable = this.firstUnassignable;
            firstParen = this.firstParen;

            break ;

        case '(' :
            this.arrowParen = true;
            head = this. parseParen() ;
            if ( this.unsatisfiedArg )
               return head ;

            break ;

        case '{' :
            this.firstUnassignable = this.firstParen = null;

            head = this. parseObjectExpression(
              context & (CONTEXT_UNASSIGNABLE_CONTAINER|CONTEXT_PARAM) ) ;
            if ( this.unsatisfiedAssignment )
              return head;

            firstUnassignable = this.firstUnassignable;
            firstParen = this.firstParen;

            break ;

        case '/' :
            head = this. parseRegExpLiteral () ;
            break ;

        case '`' :
            head = this. parseTemplateLiteral () ;
            break ;

        case 'Literal':
            head = this.numstr ();
            break ;

        case '-':
           this. prec = PREC_U;
           return null ;

        default: return null;

  }

  if ( this.firstEA )  switch ( this.lttype )   {
    case '.': case '(': case '[': case '`':
      if ( this.err('contains.assigned.eval.or.arguments',
           head,context,firstUnassignable,firstParen) )
        return this.errorHandlerOutput ;
  }
     

  inner = core( head ) ;

  LOOP:
  while ( true ) {
     switch (this.lttype ) {
         case '.':
            this.next();
            if (this.lttype !== 'Identifier')
              this.err('mem.name.not.id');

            elem  = this.memberID();
            this.assert(elem);
            head = {  type: 'MemberExpression', property: elem, start: head.start, end: elem.end,
                      loc: { start: head.loc.start, end: elem.loc.end }, object: inner, computed: false /* ,y:-1*/};
            inner =  head ;
            continue;

         case '[':
            this.next() ;
            elem   = this. parseExpr(PREC_WITH_NO_OP,CONTEXT_NONE ) ;
            head =  { type: 'MemberExpression', property: core(elem), start: head.start, end: this.c,
                      loc : { start: head.loc.start, end: this.loc()  }, object: inner, computed: true /* ,y:-1*/};
            inner  = head ;
            if ( !this.expectType_soft (']') &&
                  this.err('mem.unfinished',head,firstParen,firstUnassignable) )
              return this.errorHandlerOutput ;

            continue;

         case '(':
            elem  = this. parseArgList() ;
            head =  { type: 'CallExpression', callee: inner , start: head.start, end: this.c,
                      arguments: elem, loc: { start: head.loc.start, end: this.loc() } /* ,y:-1*/};
            if ( !this.expectType_soft (')'   ) &&
                  this.err('call.args.is.unfinished',head,firstParen,firstUnassignable) )
              return this.errorHandlerOutput  ;

            inner = head  ;
            continue;

          case '`' :
            elem = this. parseTemplateLiteral();
            head = {
                  type : 'TaggedTemplateExpression',
                  quasi : elem,
                  start: head.start,
                   end: elem.end,
                  loc : { start: head.loc.start, end: elem.loc.end },
                  tag : inner/* ,y:-1*/
             };
 
             inner = head;
             continue ;

          default: break LOOP;
     }

  }

  if ( head.type !== PAREN ) { 
     this.firstUnassignable = firstUnassignable;
     this.firstParen = firstParen;
  }

  return head ;
} ;

this .parseMeta = function(startc,end,startLoc,endLoc,new_raw ) {
    if ( this.ltval !== 'target' &&  
         this.err('meta.new.has.unknown.prop',startc,end,startLoc,endLoc,new_raw) )
       return this.errorHandlerOutput ;
    
    if ( !(this.scopeFlags & SCOPE_FLAG_FN) )
      this.err('meta.new.not.in.function',startc,end,startLoc,endLoc,new_raw);

    var prop = this.id();
    return { type: 'MetaProperty',
             meta: { type: 'Identifier', name : 'new', start: startc, end: end, loc: { start : startLoc, end: endLoc }, raw: new_raw  },
             start : startc,
             property: prop, end: prop.end,
             loc : { start: startLoc, end: prop.loc.end } };

};

this.numstr = function () {
  var n = { type: 'Literal', value: this.ltval, start: this.c0, end: this.c,
           loc: { start: this.locBegin(), end: this.loc() }, raw: this.ltraw };
  this.next();
  return n;
};

this.parseTrue = function() {
  var n = { type: 'Literal', value: true, start: this.c0, end: this.c,
           loc: { start: this.locBegin(), end: this.loc() }, raw: this.ltraw };
  this.next();
  return n;
};

this.parseNull = function() {
  var n = { type: 'Literal', value: null, start: this.c0, end: this.c,
           loc: { start: this.locBegin(), end: this.loc() }, raw: this.ltraw };
  this.next();
  return n;
};

this.parseFalse = function() {
  var n = { type: 'Literal', value: false, start: this.c0, end: this.c,
           loc: { start: this.locBegin(), end: this.loc() }, raw: this.ltraw };
  this.next();
  return n;
};

this.id = function() {
   var id = { type: 'Identifier', name: this.ltval, start: this.c0, end: this.c,
              loc: { start: this.locBegin(), end: this.loc() }, raw: this.ltraw };
   this.next() ;
   return id;
};

this.parseParen = function () {
  var firstParen = null;
  var unsatisfiedAssignment = this.unsatisfiedAssignment,
      startc = this.c - 1 ,
      startLoc = this.locOn   (  1 )  ;

  var unsatisfiedArg = null;
  var list = null, elem = null;

  var firstElem = null;
  var firstYS = this.firstYS;

  var firstElemWithYS = null, parenYS = null;  

  var context = CONTEXT_NULLABLE;
  if ( this.arrowParen ) {
       this.arrowParen = false; 
       context |= CONTEXT_PARAM;
  }
       
  var firstEA = null;
  var firstNonTailRest = null;

  while ( true ) {
     this.firstParen = null;
     this.next() ;
     this.unsatisfiedAssignment = null;
     this.firstEA = null;
     this.firstElemWithYS = null;
     elem =   // unsatisfiedArg ? this.parsePattern() :
            this.parseNonSeqExpr(PREC_WITH_NO_OP, context ) ;

     if ( !elem ) {
        if ( this.lttype === '...' ) {
           if ( ! ( context & CONTEXT_PARAM ) &&
                 this.err('paren.has.an.spread.elem')
               ) 
              return this.errorHandlerOutput  ;
 
           elem = this.parseSpreadElement();
           if ( !firstParen && this.firstParen ) firstParen = this.firstParen;
           if ( !firstEA && this.firstEA ) firstEA = this.firstEA;
           if ( !firstElemWithYS && this.firstYS ) {
                 firstElemWithYS = elem;
                 parenYS = this.firstYS;
           }
           if ( !unsatisfiedArg ) unsatisfiedArg = elem;
           if ( !firstNonTailRest && this.firstNonTailRest ) firstNonTailRest = this.firstNonTailRest;
        }
        break;
     }

     if ( !firstParen && this.firstParen )
           firstParen =  this.firstParen ;

     if ( !firstEA && this.firstEA )
           firstEA =  this.firstEA ;

     if ( !firstElemWithYS && this.firstElemWithYS ) {
           parenYS = this.parenYS;
           firstElemWithYS = this.firstElemWithYS ;
     } 

     if ( !firstYS && this.firstYS ) 
       firstYS = this.firstYS;

     if ( !unsatisfiedArg && this.unsatisfiedAssignment) {
           if ( ! context & CONTEXT_PARAM &&
                this.err('paren.with.an.unsatisfied.assig',
                 { s:startc, l: startLoc, c: context, p: firstPAren, a: unsatisfiedArg,
                   list: list, ea: firstEA, firstElemWithYS: firstElemWithYS, parenYS: parenYS, ys: firstYS })
              )
             return this.errorHandlerOutput ;

           unsatisfiedArg =  this.unsatisfiedAssignment;
     }

     if ( !firstNonTailRest && this.firstNonTailRest )
       firstNonTailRest = this.firstNonTailRest;

     if ( this.lttype !== ',' ) break ;

     if ( list ) list.push(core(elem));
     else {
       firstElem = elem;
       list = [ core(elem) ] ;
     }

  }

  // if elem is a SpreadElement, and we have a list
  if ( elem && list ) list.push(elem);

  // if we have a list, the expression in parens is a seq
  if ( list )
       elem = { type: 'SequenceExpression', expressions: list, start: firstElem .start , end: elem.end,
               loc: { start:  firstElem .loc.start , end: elem.loc.end } /* ,y:-1*/};
  // otherwise update the expression's paren depth if it's needed
  if ( elem ) {
    elem = core(elem); 
    switch (  elem.type ) {
       case 'Identifier': case 'MemberExpression':
          this.firstUnassignable = null;
          break ;

       default:
          this.firstUnassignable = elem; 
    }
  }

  var n = { type: PAREN, expr: elem, start: startc, end: this.c,
           loc: { start: startLoc, end: this.loc() } };

  if ( firstParen )
    this.firstParen = firstParen;

  if ( unsatisfiedArg )
     this.unsatisfiedArg = unsatisfiedArg;

  else if ( !elem ) // we got an empty paren (), which certainly is an arg list
     this.unsatisfiedArg = n;

  this.firstEA = firstEA ;
  this.unsatisfiedAssignment = unsatisfiedAssignment ;

  this.firstElemWithYS = firstElemWithYS;
  this.parenYS = parenYS;
  this.firstYS = firstYS;

  this.firstNonTailRest = firstNonTailRest;

  if ( ! this.expectType_soft (')') && this.err('paren.unfinished',n) )
    return this.errorHandlerOutput ;


  return n;
};


this .parseThis = function() {
    var n = { type : 'ThisExpression',
              loc: { start: this.locBegin(), end: this.loc() },
              start: this.c0,
              end : this.c };
    this.next() ;

    return n;
};


this.parseArgList = function () {
    var elem = null;
    var list = [];

    do { 
       this.next();
       elem = this.parseNonSeqExpr(PREC_WITH_NO_OP,CONTEXT_NULLABLE ); 
       if ( elem )
         list.push (core(elem));
       else if ( this.lttype === '...' )
         list.push(this.parseSpreadElement());
       else
         break ;
    } while ( this.lttype === ',' );

    return list ;
};



},
function(){
this.parseProgram = function () {
  var startc = this.c, li = this.li, col = this.col;
  var endI = this.c , startLoc = null;
  var globalScope = null;

 
  this.scope = new Scope(globalScope, SCOPE_TYPE_SCRIPT);
  this.next();
  this.scopeFlags = SCOPE_FLAG_IN_BLOCK;

  this.directive = DIRECTIVE_FUNC; 
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
        
  alwaysResolveInTheParentScope(this.scope);
  var n = { type: 'Program', body: list, start: startc, end: endI, sourceType: !this.isScript ? "module" : "script" ,
           loc: { start: startLoc, end: endLoc } };

  if ( !this.expectType_soft ('eof') &&
        this.err('program.unfinished',n) )
    return this.errorHandlerOutput ;

  return n;
};

function alwaysResolveInTheParentScope(scope) {
}


},
function(){

var gRegexFlag =               1 ,
    uRegexFlag = gRegexFlag << 1 ,
    yRegexFlag = uRegexFlag << 1 ,
    mRegexFlag = yRegexFlag << 1 ,
    iRegexFlag = mRegexFlag << 1 ;

var regexFlagsSupported = 0;

try {
   new RegExp ( "lube", "g" ) ; regexFlagsSupported |= gRegexFlag ;
   new RegExp ( "lube", "u" ) ; regexFlagsSupported |= uRegexFlag ;
   new RegExp ( "lube", "y" ) ; regexFlagsSupported |= yRegexFlag ;
   new RegExp ( "lube", "m" ) ; regexFlagsSupported |= mRegexFlag ;
   new RegExp ( "lube", "i" ) ; regexFlagsSupported |= iRegexFlag ;
}
catch(r) {
}

function curlyReplace(matchedString, b, matchIndex, wholeString ) {
  var c = parseInt( '0x' + b );
  if ( c <= 0xFFFF ) return '\\u' + hex(c);
  return '\\uFFFF';
}

function regexReplace(matchedString, b, noB, matchIndex, wholeString) {
  var c = parseInt('0x' + ( b || noB ) ) ;
  this.assert(c <= 0x010FFFF );
  
  if ( c <= 0xFFFF ) return String.fromCharCode(c) ;

  c -= 0x010000;
  return '\uFFFF';
} 

function verifyRegex(regex, flags) {
  var regexVal = null;

  try {
    return new RegExp(regex, flags);
  } catch ( e ) { throw e; }

}

function verifyRegex_soft (regex, flags) {
  var regexVal = null;

  try {
    return new RegExp(regex, flags);
  } catch ( e ) { return null; }

}

this.parseRegExpLiteral = function() {
     var startc = this.c - 1, startLoc = this.locOn(1),
         c = this.c, src = this.src, len = src.length;

     var inSquareBrackets = false ;
     WHILE:
     while ( c < len ) {
       switch ( src.charCodeAt(c) ) {
         case CHAR_LSQBRACKET:
            if ( !inSquareBrackets )
               inSquareBrackets = true;

            break;

         case CHAR_BACK_SLASH:
            ++c;
            if (c < len) switch(src.charCodeAt(c)) {
               case CHAR_CARRIAGE_RETURN: 
                  if ( l.charCodeAt(c + 1) === CHAR_LINE_FEED ) c++;
               case CHAR_LINE_FEED :
               case 0x2028 :
               case 0x2029 :
                  if ( this.err('regex.newline.esc',c,startLoc) )
                    return this.errorHandlerOutput ;
            }

            break;

         case CHAR_RSQBRACKET:
            if ( inSquareBrackets )
               inSquareBrackets = false;

            break;

         case CHAR_DIV :
            if ( inSquareBrackets )
               break;

            break WHILE;

         case CHAR_CARRIAGE_RETURN: if ( l.charCodeAt(c + 1 ) === CHAR_LINE_FEED ) c++ ;
         case CHAR_LINE_FEED :
         case 0x2028 :
         case 0x2029 :
           if ( this.err('regex.newline',c,startLoc) )
             return this.errorHandlerOutput ;

//       default:if ( o >= 0x0D800 && o <= 0x0DBFF ) { this.col-- ; }
       }

       c++ ;
     }

     if ( src.charCodeAt(c) !== CHAR_DIV && 
          this.err('regex.unfinished',startc,startLoc,c) )
       return this.errorHandlerOutput ;

     var flags = 0;
     var flagCount = 0;
     WHILE:
     while ( flagCount <= 5 ) {
        switch ( src.charCodeAt ( ++c ) ) {
            case CHAR_g:
                if (flags & gRegexFlag)
                  this.err('regex.flag.is.dup',startc,startLoc,c);
                flags |= gRegexFlag; break;
            case CHAR_u:
                if (flags & uRegexFlag)
                  this.err('regex.flag.is.dup',startc,startLoc,c);
                flags |= uRegexFlag; break;
            case CHAR_y:
                if (flags & yRegexFlag)
                  this.err('regex.flag.is.dup',startc,startLoc,c);
                flags |= yRegexFlag; break;
            case CHAR_m:
                if (flags & mRegexFlag)
                  this.err('regex.flag.is.dup',startc,startLoc,c);
                flags |= mRegexFlag; break;
            case CHAR_i:
                if (flags & iRegexFlag)
                  this.err('regex.flag.is.dup',startc,startLoc,c);
                flags |= iRegexFlag; break;

            default : break WHILE;
        }

        flagCount++ ;
     }
     var patternString = src.slice(this.c, c-flagCount-1 ), flagsString = src .slice(c-flagCount,c);
     var val = null;

     var normalizedRegex = patternString;

     // those that contain a 'u' flag need special treatment when RegExp constructor they get sent to
     // doesn't support the 'u' flag: since they can have surrogate pair sequences (which are not allowed without the 'u' flag),
     // they must be checked for having such surrogate pairs, and should replace them with a character that is valid even
     // without being in the context of a 'u' 
     if ( (flags & uRegexFlag) && !(regexFlagsSupported & uRegexFlag) )
          normalizedRegex = normalizedRegex.replace( /\\u\{([A-F0-9a-f]+)\}/g, curlyReplace) // normalize curlies
             .replace( /\\u([A-F0-9a-f][A-F0-9a-f][A-F0-9a-f][A-F0-9a-f])/g, regexReplace ) // convert u
             .replace( /[\ud800-\udbff][\udc00-\udfff]/g, '\uFFFF' );
       

     // all of the 1 bits in flags must also be 1 in the same bit index in regexsupportedFlags;
     // flags ^ rsf returns a bit set in which the 1 bits mean "this flag is either not used in flags, or yt is not supported";
     // for knowing whether the 1 bit has also been 1 in flags, we '&' the above bit set with flags; the 1 bits in the
     // given bit set must both be 1 in flags and in flags ^ rsf; that is, they are both "used" and "unsupoorted or unused",
     // which would be equal to this: [used && (unsupported || !used)] === unsopprted
     if (flags & (regexFlagsSupported^flags) )
       val  = verifyRegex_soft (normalizedRegex, "");
     else
        val = verifyRegex( patternString, flagsString ) ;

     if ( !val &&
        this.err('regex.not.valid',startc,startLoc,flagsString,patternString) )
       return this.errorHandlerOutput;

     this.col += (c-this.c);
     var regex = { type: 'Literal', regex: { pattern: patternString, flags: flagsString },
                   start: startc, end: c,
                   value: val, loc: { start: startLoc, end: this.loc() } };
     this.c = c;
     this.next () ;

     return regex ;
};



},
function(){
this.enterFuncScope = function(decl) { this.scope = this.scope.spawnFunc(decl); };

// TODO: it is no longer needed
this.enterComplex = function() {
   if (this.declMode === DECL_MODE_FUNCTION_PARAMS ||
       this.declMode & DECL_MODE_CATCH_PARAMS)
     this.makeComplex();
};

this.enterLexicalScope = function(loop) { this.scope = this.scope.spawnLexical(loop); };

this.setDeclModeByName = function(modeName) {
  this.declMode = modeName === 'var' ? DECL_MODE_VAR : DECL_MODE_LET;
};

this.exitScope = function() {
  var scope = this.scope;
  this.scope.finish();
  this.scope = this.scope.parent;
  if (this.scope.synth)
    this.scope = this.scope.parent;
  return scope;
};

this.declare = function(id) {
   ASSERT.call(this, this.declMode !== DECL_MODE_NONE, 'Unknown declMode');
   if (this.declMode === DECL_MODE_FUNCTION_PARAMS) {
     if (!this.addParam(id)) // if it was not added, i.e., it is a duplicate
       return;
   }
   else if (this.declMode === DECL_MODE_LET) {
     // TODO: eliminate it because it must've been verified in somewhere else,
     // most probably in parseVariableDeclaration
     if ( !(this.scopeFlags & SCOPE_FLAG_IN_BLOCK) )
       this.err('let.decl.not.in.block', id );

     if ( id.name === 'let' )
       this.err('lexical.name.is.let');
   }

   this.scope.declare(id, this.declMode);
};

this.makeComplex = function() {
  // complex params are treated as let by the emitter
  if (this.declMode & DECL_MODE_CATCH_PARAMS) {
    this.declMode |= DECL_MODE_LET; 
    return;
  }

  ASSERT.call(this, this.declMode === DECL_MODE_FUNCTION_PARAMS);
  var scope = this.scope;
  if (scope.mustNotHaveAnyDupeParams()) return;
  for (var a in scope.definedNames) {
     if (!HAS.call(scope.definedNames, a)) continue;
     if (scope.definedNames[a] & DECL_DUPE)
       this.err('func.args.has.dup', a);
  }
  scope.isInComplexArgs = true;
};

this.addParam = function(id) {
  ASSERT.call(this, this.declMode === DECL_MODE_FUNCTION_PARAMS);
  var name = id.name + '%';
  var scope = this.scope;
  if ( HAS.call(scope.definedNames, name) ) {
    if (scope.mustNotHaveAnyDupeParams())
      this.err('func.args.has.dup', id);

    // TODO: this can be avoided with a dedicated 'dupes' dictionary,
    // but then again, that might be too much.
    if (!(scope.definedNames[name] & DECL_DUPE)) {
      scope.insertID(id);
      scope.definedNames[name] |= DECL_DUPE ;
    }

    return false;
  }

  return true;
};

this.ensureParamIsNotDupe = function(id) {
   var name = id.name + '%';
   var scope = this.scope;
   if (HAS.call(scope.idNames, name) && scope.idNames[name])
     this.err('func.args.has.dup', id );
};

// TODO: must check whether we are parsing with v > 5, whether we are in an if, etc.
this.canDeclareFunctionsInScope = function() {
  if (this.scope.isConcrete())
    return true;
  if (this.scopeFlags & SCOPE_FLAG_IN_BLOCK)
    return this.v > 5;
  if (this.tight)
    return false;
  if (this.scopeFlags & SCOPE_FLAG_IN_IF)
    return true;
  
  return false;
};

this.canDeclareClassInScope = function() {
  return this.scopeFlag & SCOPE_FLAG_IN_BLOCK ||
    this.scope.isConcrete();
};

this.canLabelFunctionsInScope = function() { 
  // TODO: add something like a 'compat' option so as to actually allow it for v <= 5;
  // this is what happens in reality: versions prior to ES2015 don't officially allow it, but it
  // is supported in most browsers.
  if (this.v <= 5)
    return false;
  if (this.tight)
    return false;
  return (this.scopeFlag & SCOPE_FLAG_IN_BLOCK) ||
          this.scope.isConcrete(); 
};


},
function(){
this.semiLoc = function () {
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

  this.err('EOS expected; found ' + this.ltraw ) ;
};

this.semiLoc_soft = function () {
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
  
  return null;
};

this.semiI = function() {
   return this.lttype === ';' ? this.c : this.newLineBeforeLookAhead ? 0 : this.lttype === '}' ? this.c - 1 : this.lttype === 'eof' ? this.c : 0; };



},
function(){
this.parseStatement = function ( allowNull ) {
  var head = null, l, e , directive = this.directive ;
  this.directive = DIRECTIVE_NONE;

  switch (this.lttype) {
    case '{': return this.parseBlckStatement();
    case ';': return this.parseEmptyStatement() ;
    case 'Identifier':
       this.canBeStatement = true;
       head = this.parseIdStatementOrId(CONTEXT_NONE);
       if ( this.foundStatement ) {
          this.foundStatement = false ;
          return head;
       }

       break ;

    case 'eof':
      if (!allowNull && this.err('stmt.null') )
        return this.errorHandlerOutput ;

      return null;
  }

  this.assert(head === null) ;
  head = this.parseExpr(CONTEXT_NULLABLE) ;
  if ( !head ) {
    if ( !allowNull && this.err('stmt.null') )
      this.errorHandlerOutput;

    return null;
  }

  if ( head.type === 'Identifier' && this.lttype === ':')
    return this.parseLabeledStatement(head, allowNull);

  this.fixupLabels(false) ;
  if ( directive &&
       head.type === 'Literal' &&
       typeof head.value === STRING_TYPE )
     switch ( this.src.substring(head.start, head.end ) ) {
       case "'use strict'":
       case '"use strict"':
          if (directive & DIRECTIVE_FUNC) this.makeStrict();
          else this.tight = true;
     }
 
  e  = this.semiI() || head.end;
  l = this.semiLoc_soft ();
  if ( !l && !this.newLineBeforeLookAhead &&
       this.err('no.semi','expr',{head:head,e:e}) )
    return this.errorHandlerOutput;
 
  return {
    type : 'ExpressionStatement',
    expression : core(head),
    start : head.start,
    end : e,
    loc : { start : head.loc.start, end : l || head.loc.end }
  };
};

this . findLabel = function(name) {
    return has.call(this.labels, name) ?this.labels[name]:null;

};

this .parseLabeledStatement = function(label, allowNull) {
   this.next();
   var l = label.name;
   l += '%';
   if ( this.findLabel(l) && this.err('label.is.a.dup',label,allowNull) )
     return this.errorHandlerOutput ;

   this.labels[l] =
        this.unsatisfiedLabel ?
        this.unsatisfiedLabel :
        this.unsatisfiedLabel = { loop: false };

   var stmt  = this.parseStatement(allowNull);
   this.labels[l] = null;

   return { type: 'LabeledStatement', label: label, start: label.start, end: stmt.end,
            loc: { start: label.loc.start, end: stmt.loc.end }, body: stmt };
};

this .ensureStmt = function() {
   if ( this.canBeStatement ) this.canBeStatement = false;
   else this.assert(false);
};

this .ensureStmt_soft = function() {
   if ( this.canBeStatement ) {
     this.canBeStatement = false;
     return true;
   }
   return false;
};

this . fixupLabels = function(loop) {
    if ( this.unsatisfiedLabel ) {
         this.unsatisfiedLabel.loop = loop;
         this.unsatisfiedLabel = null;
    }
};

this .parseEmptyStatement = function() {
  var n = { type: 'EmptyStatement',
           start: this.c - 1,
           loc: { start: this.locOn(1), end: this.loc() },
            end: this.c };
  this.next();
  return n;
};

this.parseIfStatement = function () {
  if ( !this.ensureStmt_soft () && this.err('not.stmt','if') )
    return this.errorHandlerOutput;

  this.fixupLabels(false);
  this.enterLexicalScope(false); 

  var startc = this.c0,
      startLoc  = this.locBegin();
  this.next () ;
  if ( !this.expectType_soft('(') &&
        this.err('if.has.no.opening.paren',startc,startLoc) )
    return this.errorHanlerOutput;

  var cond = core( this.parseExpr(CONTEXT_NONE) );
  if ( !this.expectType_soft (')' ) &&
        this.err('if.has.no.closing.paren',startc,startLoc) )
    return this.errorHandlerOutput ;

  var scopeFlags = this.scopeFlags ;
  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= SCOPE_FLAG_IN_IF;
  var nbody = this. parseStatement (false);
  var alt = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'else') {
     this.next() ;
     alt = this.parseStatement(false);
  }
  this.scopeFlags = scopeFlags ;

  var scope = this.exitScope(); 

  this.foundStatement = true;
  return { type: 'IfStatement', test: cond, start: startc, end: (alt||nbody).end,
     loc: { start: startLoc, end: (alt||nbody).loc.end }, consequent: nbody, alternate: alt/*,scope:  scope  ,y:-1*/};
};

this.parseWhileStatement = function () {
   this.enterLexicalScope(true);
   if ( ! this.ensureStmt_soft () &&
          this.err('not.stmt','while') )
     return this.errorHandlerOutput;

   this.fixupLabels(true);

   var startc = this.c0,
       startLoc = this.locBegin();
   this.next();
   if ( !this.expectType_soft ('(') &&
         this.err('while.has.no.opening.paren',startc,startLoc) )
     return this.errorHandlerOutput;
 
   var cond = core( this.parseExpr(CONTEXT_NONE) );
   if ( !this.expectType_soft (')') &&
         this.err('while.has.no.closing.paren' ,startc,startLoc) )
     return this.errorHandlerOutput;

   var scopeFlags = this.scopeFlags;
   this.scopeFlags &= CLEAR_IB;
   this.scopeFlags |= (SCOPE_FLAG_CONTINUE|SCOPE_FLAG_BREAK );
   var nbody = this.parseStatement(false);
   this.scopeFlags = scopeFlags ;
   this.foundStatement = true;

   var scope = this.exitScope();
   return { type: 'WhileStatement', test: cond, start: startc, end: nbody.end,
       loc: { start: startLoc, end: nbody.loc.end }, body:nbody/*,scope:  scope ,y:-1*/ };
};

this.parseBlckStatement = function () {
  this.fixupLabels(false);

  this.enterLexicalScope(false); 
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next();
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= SCOPE_FLAG_IN_BLOCK;

  var n = { type: 'BlockStatement', body: this.blck(), start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() }/*,scope:  this.scope  ,y:-1*/};

  if ( !this.expectType_soft ('}' ) &&
        this.err('block.unfinished',n) )
    return this.errorHandlerOutput ;

  this.exitScope(); 
  this.scopeFlags = scopeFlags;
  return n;
};

this.parseDoWhileStatement = function () {
  if ( !this.ensureStmt_soft () &&
        this.err('not.stmt','do-while') )
    return this.errorHandlerOutput ;

  this.enterLexicalScope(true); 
  this.fixupLabels(true);

  var startc = this.c0,
      startLoc = this.locBegin() ;
  this.next() ;
  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= (SCOPE_FLAG_BREAK| SCOPE_FLAG_CONTINUE);
  var nbody = this.parseStatement (true) ;
  this.scopeFlags = scopeFlags;
  if ( !this.expectID_soft('while') &&
        this.err('do.has.no.while',startc,startLoc,scopeFlags,nbody) )
    return this.errorHandlerOutput;

  if ( !this.expectType_soft('(') &&
        this.err('do.has.no.opening.paren',startc,startLoc,scopeFlags,nbody) )
    return this.errorHandlerOutput;

  var cond = core(this.parseExpr(CONTEXT_NONE));
  var c = this.c, li = this.li, col = this.col;
  if ( !this.expectType_soft (')') &&
        this.err('do.has.no.closing.paren',startc,startLoc,scopeFlags,nbody,c,li,col,cond) )
    return this.errorHandlerOutput;

  if (this.lttype === ';' ) {
     c = this.c;
     li = this.li ;
     col = this.col;
     this.next();
  }

 this.foundStatement = true;

 this.exitScope(); 
 return { type: 'DoWhileStatement', test: cond, start: startc, end: c,
          body: nbody, loc: { start: startLoc, end: { line: li, column: col } } /* ,y:-1*/} ;
};

this.parseContinueStatement = function () {
   if ( ! this.ensureStmt_soft   () &&
          this.err('not.stmt','continue') )
     return this.errorHandlerOutput ;

   this.fixupLabels(false);
   if (!(this.scopeFlags & SCOPE_FLAG_CONTINUE) &&
         this.err('continue.not.in.loop') )
     return this.errorHandlerOutput  ;

   var startc = this.c0, startLoc = this.locBegin();
   var c = this.c, li = this.li, col = this.col;

   this.next() ;

   var name = null, label = null, semi = 0;

   var semiLoc = null;

   if ( !this.newLineBeforeLookAhead && this.lttype === 'Identifier' ) {
       label = this.validateID(null);
       name = this.findLabel(label.name + '%');
       if (!name) this.err('continue.no.such.label',label) ;
       if (!name.loop) this.err('continue.not.a.loop.label',label);

       semi = this.semiI();
       semiLoc = this.semiLoc_soft();
       if ( !semiLoc && !this.newLineBeforeLookAhead &&
             this.err('no.semi','continue',startc,startLoc,c,li,col,semi,label) )
         return this.errorHandlerOutput;

       this.foundStatement = true;
       return { type: 'ContinueStatement', label: label, start: startc, end: semi || label.end,
           loc: { start: startLoc, end: semiLoc || label.loc.end } };
   }
   semi = this.semiI();
   semiLoc = this.semiLoc_soft();
   if ( !semiLoc && !this.newLineBeforeLookAhead &&
         this.err('no.semi','continue',startc,startLoc,c,li,col,semi,label) )
     return this.errorHandlerOutput;

   this.foundStatement = true;
   return { type: 'ContinueStatement', label: null, start: startc, end: semi || c,
           loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseBreakStatement = function () {
   if (! this.ensureStmt_soft   () &&
         this.err('not.stmt','break') )
     return this.errorHandlerOutput ;

   this.fixupLabels(false);
   var startc = this.c0, startLoc = this.locBegin();
   var c = this.c, li = this.li, col = this.col;

   this.next() ;

   var name = null, label = null, semi = 0;

   var semiLoc = null;

   if ( !this.newLineBeforeLookAhead && this.lttype === 'Identifier' ) {
       label = this.validateID(null);
       name = this.findLabel(label.name + '%');
       if (!name) this.err('break.no.such.label',label);
       semi = this.semiI();
       semiLoc = this.semiLoc_soft();
       if ( !semiLoc && !this.newLineBeforeLookAhead &&
            this.err('no.semi',startc,startLoc,c,li,col,semi,label) )
         return this.errorHandlerOutput;

       this.foundStatement = true;
       return { type: 'BreakStatement', label: label, start: startc, end: semi || label.end,
           loc: { start: startLoc, end: semiLoc || label.loc.end } };
   }
   else if (!(this.scopeFlags & SCOPE_FLAG_BREAK) &&
         this.err('break.not.in.breakable') )
     return this.errorHandlerOutput ;

   semi = this.semiI();
   semiLoc = this.semiLoc_soft();
   if ( !semiLoc && !this.newLineBeforeLookAhead &&
        this.err('no.semi',startc,startLoc,c,li,col,semi,label) )
     return this.errorHandlerOutput;

   this.foundStatement = true;
   return { type: 'BreakStatement', label: null, start: startc, end: semi || c,
           loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseSwitchStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt','switch') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false) ;

  var startc = this.c0,
      startLoc = this.locBegin(),
      cases = [],
      hasDefault = false ,
      scopeFlags = this.scopeFlags,
      elem = null;

  this.next() ;
  if ( !this.expectType_soft ('(') &&
       this.err('switch.has.no.opening.paren',startc,startLoc) )
    return this.errorHandlerOutput;

  var switchExpr = core(this.parseExpr(CONTEXT_NONE));
  if ( !this.expectType_soft (')') &&
        this.err('switch.has.no.closing.paren',startc,startLoc) )
    return this.errorHandlerOutput ;

  if ( !this.expectType_soft ('{') &&
        this.err('switch.has.no.opening.curly',startc,stratLoc) )
    return this.errorHandlerOutput ;

  this.enterLexicalScope(false); 
  this.scopeFlags |=  (SCOPE_FLAG_BREAK|SCOPE_FLAG_IN_BLOCK);
  while ( elem = this.parseSwitchCase()) {
    if (elem.test === null) {
       if (hasDefault ) this.err('switch.has.a.dup.default',elem );
       hasDefault = true ;
    }
    cases.push(elem);
  }

  this.scopeFlags = scopeFlags ;
  this.foundStatement = true;

  var scope = this.exitScope(); 
  var n = { type: 'SwitchStatement', cases: cases, start: startc, discriminant: switchExpr,
            end: this.c, loc: { start: startLoc, end: this.loc() }/*,scope:  scope  ,y:-1*/};
  if ( !this.expectType_soft ('}' ) &&
        this.err('switch.unfinished',n) )
    return this.errorHandlerOutput ;

  return n;
};

this.parseSwitchCase = function () {
  var startc,
      startLoc;

  var nbody = null,
      cond  = null;

  if ( this.lttype === 'Identifier' ) switch ( this.ltval ) {
     case 'case':
       startc = this.c0;
       startLoc = this.locBegin();
       this.next();
       cond = core(this.parseExpr(CONTEXT_NONE)) ;
       break;

     case 'default':
       startc = this.c0;
       startLoc = this.locBegin();
       this.next();
       break ;

     default: return null;
  }
  else
     return null;

  var c = this.c, li = this.li, col = this.col;
  if ( ! this.expectType_soft (':') &&
       this.err('switch.case.has.no.colon',startc,startLoc,c,li,cond,col) )
    return this.errorHandlerOutput;

  nbody = this.blck();
  var last = nbody.length ? nbody[nbody.length-1] : null;
  return { type: 'SwitchCase', test: cond, start: startc, end: last ? last.end : c,
     loc: { start: startLoc, end: last ? last.loc.end : { line: li, column: col } }, consequent: nbody/* ,y:-1*/ };
};

this.parseReturnStatement = function () {
  if (! this.ensureStmt_soft () &&
       this.err('not.stmt','return') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false ) ;

  if ( !( this.scopeFlags & SCOPE_FLAG_FN ) &&
          this.err('return.not.in.a.function') )
    return this.errorHandlerOutput ;

  var startc = this.c0,
      startLoc = this.locBegin(),
      retVal = null,
      li = this.li,
      c = this.c,
      col = this.col;

  this.next();

  var semi = 0, semiLoc = null;

  if ( !this.newLineBeforeLookAhead )
     retVal = this.parseExpr(CONTEXT_NULLABLE);

  semi = this.semiI();
  semiLoc = this.semiLoc();
  if ( !semiLoc && !this.newLineBeforeLookAhead &&
       this.err('no.semi','return', [startc,startLoc,c,li,col,semi,retVal] ) )
    return this.errorHandlerOutput;

  if ( retVal ) {
     this.foundStatement = true;
     return { type: 'ReturnStatement', argument: core(retVal), start: startc, end: semi || retVal.end,
        loc: { start: startLoc, end: semiLoc || retVal.loc.end } }
  }

  this.foundStatement = true;
  return {  type: 'ReturnStatement', argument: retVal, start: startc, end: semi || c,
     loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseThrowStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt','throw') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false ) ;

  var startc = this.c0,
      startLoc = this.locBegin(),
      retVal = null,
      li = this.li,
      c = this.c,
      col = this.col;

  this.next();

  var semi = 0 , semiLoc = null ;
  if ( this.newLineBeforeLookAhead &&
       this.err('throw.has.newline',startc,startLoc,c,li,col) )
    return this.errorHandlerOutput;

  retVal = this.parseExpr(CONTEXT_NULLABLE );
  if ( retVal === null &&
       this.err('throw.has.no.argument',[startc,startLoc,c,li,col,semi,retVal]) )
     return this.errorHandlerOutput;

  semi = this.semiI();
  semiLoc = this.semiLoc();
  if ( !semiLoc && !this.newLineBeforeLookAhead &&
        this.err('no.semi','throw',[startc,startLoc,c,li,col,semi,retVal] ) )
    return this.errorHandlerOutput;

  this.foundStatement = true;
  return { type: 'ThrowStatement', argument: core(retVal), start: startc, end: semi || retVal.end,
     loc: { start: startLoc, end: semiLoc || retVal.loc.end } }

};

this. parseBlockStatement_dependent = function() {
    var startc = this.c - 1,
        startLoc = this.locOn(1);
    if ( !this.expectType_soft ('{') &&
         this.err('block.dependent.no.opening.curly') )
      return this.errorHandlerOutput;

    var scopeFlags = this.scopeFlags;
    this.scopeFlags |= SCOPE_FLAG_IN_BLOCK;

    var n = { type: 'BlockStatement', body: this.blck(), start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() }/*,scope:  this.scope  ,y:-1*/ };
    if ( ! this.expectType_soft ('}') &&
         this.err('block.dependent.is.unfinished' , n)  )
      return this.errorHandlerOutput;

    this.scopeFlags = scopeFlags;
    return n;
};

this.parseTryStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt' ,'try' ) )
    return this.errorHandlerOutput ;

  this.fixupLabels(false);
  var startc = this.c0,
      startLoc = this.locBegin();

  this.next() ;

  this.enterLexicalScope(false); 
  var tryBlock = this.parseBlockStatement_dependent();
  this.exitScope(); 
  var finBlock = null, catBlock  = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'catch')
    catBlock = this.parseCatchClause();

  if ( this.lttype === 'Identifier' && this.ltval === 'finally') {
     this.next();
     this.enterLexicalScope(false); 
     finBlock = this.parseBlockStatement_dependent();
     this.exitScope(); 
  }

  var finOrCat = finBlock || catBlock;
  if ( ! finOrCat &&
       this.err('try.has.no.tail',startc,startLoc,tryBlock)  )
    return this.errorHandlerOutput ;

  this.foundStatement = true;
  return  { type: 'TryStatement', block: tryBlock, start: startc, end: finOrCat.end,
            handler: catBlock, finalizer: finBlock, loc: { start: startLoc, end: finOrCat.loc.end } /* ,y:-1*/};
};

this.enterCatchScope = function() {
  this.scope = this.scope.spawnCatch();
};

this. parseCatchClause = function () {
   var startc = this.c0,
       startLoc = this.locBegin();

   this.next();

   this.enterCatchScope();
   if ( !this.expectType_soft ('(') &&
        this.err('catch.has.no.opening.paren',startc,startLoc) )
     return this.errorHandlerOutput ;

   this.declMode = DECL_MODE_CATCH_PARAMS;
   var catParam = this.parsePattern();
   if (this.lttype === 'op' && this.ltraw === '=')
     this.err('catch.param.has.default.val');

   this.declMode = DECL_MODE_NONE;
   if (catParam === null)
     this.err('catch.has.no.param');

   if ( !this.expectType_soft (')') &&
         this.err('catch.has.no.end.paren' , startc,startLoc,catParam)  )
     return this.errorHandlerOutput    ;

   var catBlock = this.parseBlockStatement_dependent();

   this.exitScope();
   return {
       type: 'CatchClause',
        loc: { start: startLoc, end: catBlock.loc.end },
       start: startc,
       end: catBlock.end,
       param: catParam ,
       body: catBlock/* ,y:-1*/
   };
};

this . parseWithStatement = function() {
   if ( !this.ensureStmt_soft () &&
         this.err('not.stmt','with' ) )
     return this.errorHandlerOutput ;

   if ( this.tight) this.err('with.strict')  ;

   this.enterLexicalScope(false);
   this.fixupLabels(false);

   var startc = this.c0,
       startLoc = this.locBegin();

   this.next();
   if (! this.expectType_soft ('(') &&
         this.err('with.has.no.opening.paren', startc, startLoc) )
     return this.errorHandlerOutput ;

   var obj = this.parseExpr(CONTEXT_NONE);
   if (! this.expectType_soft (')' ) &&
         this.err('with.has.no.end.paren',startc,startLoc,obj ) )
     return this.errorHandlerOutput ;

   var scopeFlags = this.scopeFlags;

   this.scopeFlags &= CLEAR_IB;
   var nbody = this.parseStatement(true);
   this.scopeFlags = scopeFlags;
   
   this.foundStatement = true;

   var scope = this.exitScope();
   return  {
       type: 'WithStatement',
       loc: { start: startLoc, end: nbody.loc.end },
       start: startc,
       end: nbody.end,
       object: obj, body: nbody/*,scope:  scope ,y:-1*/
   };
};

this . prseDbg = function () {
  if (! this.ensureStmt_soft () &&
        this.err('not.stmt','debugger') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false);

  var startc = this.c0,
      startLoc = this.locBegin();
  var c = this.c, li = this.li, col = this.col;

  this.next() ;
  if ( this. lttype ===  ';' ) {
    c = this.c;
    li = this.li;
    col = this.col;
    this.next();
  } 
  else if ( !this.newLineBeforeLookAhead &&
     this.err('no.semi','debugger', [startc,startLoc,c,li,col] ) )
     return this.errorHandlerOutput;

  this.foundStatement = true;
  return {
     type: 'DebuggerStatement',
      loc: { start: startLoc, end: { line: li, column: col } } ,
     start: startc,
     end: c
   };
};

this.blck = function () { // blck ([]stmt)
  var stmts = [], stmt;
  while (stmt = this.parseStatement(true)) stmts.push(stmt);
  return (stmts);
};



},
function(){
this.readStrLiteral = function (start) {
  this.li0 = this.li;
  this.col0 = this.col;
  this.c0 = this.c ;
  var c = this.c += 1,
      l = this.src,
      e = l.length,
      i = 0,
      v = "",
      v_start = c,
      startC =  c-1;

  while (c < e && (i = l.charCodeAt(c)) !== start) {
    switch ( i ) {
     case CHAR_BACK_SLASH :
        v  += l.slice(v_start,c );
        this.col += ( c - startC ) ;
        startC =  this.c = c;
        v  += this.readEsc()  ;
        c  = this.c;
        if ( this.col === 0 ) startC = c   +  1   ;
        else  { this.col += ( c - startC  )  ; startC = c ;   }
        v_start = ++c ;
        continue ;

     case CHAR_CARRIAGE_RETURN: if ( l.charCodeAt(c + 1 ) === CHAR_LINE_FEED ) c++ ;
     case CHAR_LINE_FEED :
     case 0x2028 :
     case 0x2029 :
           if ( this.err('str.newline',c,startC,v,v_start) )
             return this.errorHandlerOutput ;
    }
    c++;
  }

  if ( v_start !== c ) { v += l.slice(v_start,c ) ; }
  if (!(c < e && (l.charCodeAt(c)) === start) &&
       this.err('str.unfinished',c,v) ) return this.errorHandlerOutput;

  this.c = c + 1 ;
  this.col += (this. c - startC   )  ;
  this.lttype = 'Literal'  ;
  this.ltraw =  l.slice (this.c0, this.c);
  this.ltval = v ;
};



},
function(){
this . parseTemplateLiteral = function() {
  var li = this.li, col = this.col;
  var startc = this.c - 1, startLoc = this.locOn(1);
  var c = this.c, src = this.src, len = src.length;
  var templStr = [], templExpressions = [];
  var startElemFragment = c, // an element's content might get fragmented by an esc appearing in it, e.g., 'eeeee\nee' has two fragments, 'eeeee' and 'ee'
      startElem = c,
      currentElemContents = "",
      startColIndex = c ,
      ch = 0;
 
  while ( c < len ) {
    ch = src.charCodeAt(c);
    if ( ch === CHAR_BACKTICK ) break; 
    switch ( ch ) {
       case CHAR_$ :
          if ( src.charCodeAt(c+1) === CHAR_LCURLY ) {
              currentElemContents += src.slice(startElemFragment, c) ;
              this.col += ( c - startColIndex );
              templStr.push(
                { type: 'TemplateElement', 
                 start: startElem, end: c, tail: false,
                 loc: { start: { line: li, column: col }, end: { line: this.li, column: this.col } },        
                 value: { raw : src.slice(startElem, c ).replace(/\r\n|\r/g,'\n'), 
                        cooked: currentElemContents   } } );

              this.c = c + 2; // ${
              this.col += 2; // ${

              // this must be done manually because we must have                       
              // a lookahead before starting to parse an actual expression
              this.next(); 
                           
              templExpressions.push( core(this.parseExpr(CONTEXT_NONE)) );
              if ( this. lttype !== '}')
                this.err('templ.expr.is.unfinished') ;

              currentElemContents = "";
              startElemFragment = startElem = c = this.c; // right after the '}'
              startColIndex = c;
              li = this.li;
              col = this.col;
          }

          else
             c++ ;

          continue;

       case CHAR_CARRIAGE_RETURN: 
           currentElemContents += src.slice(startElemFragment,c) + '\n' ;
           c++;
           if ( src.charCodeAt(c) === CHAR_LINE_FEED ) c++;
           startElemFragment = startColIndex = c;
           this.li++;
           this.col = 0;
           continue ;
 
       case CHAR_LINE_FEED:
           currentElemContents += src.slice(startElemFragment,c) + '\n';
           c++;
           startElemFragment = startColIndex = c;
           this.li++;
           this.col = 0;
           continue; 
 
       case 0x2028: case 0x2029:
           currentElemContents += src.slice(startElemFragment,c) + src.charAt(c);
           startColIndex = c;
           c++; 
           startElemFragment = c;
           this.li++;
           this.col = 0;           
           continue ;
 
       case CHAR_BACK_SLASH :
           this.c = c; 
           currentElemContents += src.slice( startElemFragment, c ) + this.readStrictEsc();
           c  = this.c;
           c++;
           if ( this.col === 0 ) // if we had an escaped newline 
             startColIndex = c;
           
           startElemFragment = c ;
           continue ;
    }

    c++ ;
  }

  if ( ch !== CHAR_BACKTICK ) this.err('templ.lit.is.unfinished') ;
  
  if ( startElem < c ) {
     this.col += ( c - startColIndex );
     if ( startElemFragment < c )
       currentElemContents += src.slice( startElemFragment, c );
  }
  else currentElemContents = "";

  templStr.push({
     type: 'TemplateElement',
     start: startElem,
     loc: { start : { line: li, column: col }, end: { line: this.li, column: this.col } },
     end: startElem < c ? c : startElem ,
     tail: true,
     value: { raw: src.slice(startElem,c).replace(/\r\n|\r/g,'\n'), 
              cooked: currentElemContents }
  }); 

  c++; // backtick  
  this.col ++ ;

  var n = { type: 'TemplateLiteral', start: startc, quasis: templStr, end: c,
       expressions: templExpressions , loc: { start: startLoc, end : this.loc() } /* ,y:-1*/};

  this.c = c;
  this.next(); // prepare the next token  

  return n
};


},
function(){
this .validateID  = function (e) {
  var n = e || this.ltval;

  SWITCH:
  switch (n.length) {
     case  1:
         break SWITCH;
     case  2: switch (n) {
         case 'do':
         case 'if':
         case 'in':
            
            return this.errorReservedID(e);
         default: break SWITCH;
     }
     case 3: switch (n) {
         case 'int' :
            if ( this.v > 5 )
                break SWITCH;
          return  this. errorReservedID(e);

         case 'let' :
            if ( this.v <= 5 || !this.tight )
              break SWITCH;
         case 'for' : case 'try' : case 'var' : case 'new' :
             return this.errorReservedID(e);

         default: break SWITCH;
     }
     case 4: switch (n) {
         case 'byte': case 'char': case 'goto': case 'long':
            if ( this. v > 5 ) break SWITCH;
         case 'case': case 'else': case 'this': case 'void': case 'true':
         case 'with': case 'enum':
         case 'null':
            return this.errorReservedID(e);

//       case 'eval':
//          if (this.tight) return this.err('eval.arguments.in.strict', n);

         default:
            break SWITCH;
     }
     case 5: switch (n) {
         case 'await':
            if ( this. isScript ) break SWITCH;
         case 'final':
         case 'float':
         case 'short':
            if ( this. v > 5 ) break SWITCH;
            return this.errorReservedID(e);
    
         case 'yield': 
            if (!this.tight && !(this.scopeFlags & SCOPE_FLAG_GEN)) {
              break SWITCH;
            }

         case 'break': case 'catch': case 'class': case 'const': case 'false':
         case 'super': case 'throw': case 'while': 
            return this.errorReservedID(e);

         default: break SWITCH;
     }
     case 6: switch (n) {
         case 'double': case 'native': case 'throws':
             if ( this. v > 5 )
                break SWITCH;
             return this.errorReservedID(e); 
         case 'public':
         case 'static':
             if ( this.v > 5 && !this.tight )
               break SWITCH;
         case 'delete': case 'export': case 'import': case 'return':
         case 'switch': case 'typeof':
            return this.errorReservedID(e) ;

         default: break SWITCH;
     }
     case 7:  switch (n) {
         case 'package':
         case 'private':
            if ( this.tight ) return this.errorReservedID(e);
         case 'boolean':
            if ( this.v > 5 ) break;
         case 'default': case 'extends': case 'finally':
             return this.errorReservedID(e);

         default: break SWITCH;
     }
     case 8: switch (n) {
         case 'abstract': case 'volatile':
            if ( this.v > 5 ) break;
         case 'continue': case 'debugger': case 'function':
            return this.errorReservedID (e) ;

         default: break SWITCH;
     }
     case 9: switch (n) {
         case 'protected':
         case 'interface':
            if ( this.tight )
              return this.errorReservedID (e);
         case 'transient':
            if ( this.v <= 5 )
              return this.errorReservedID(e) ;
//       case 'arguments':
//          if (this.tight) return this.err('eval.arguments.in.strict', n);

         default: break SWITCH;
     }
     case 10: switch (n) {
         case 'implements':
            if ( this.v > 5 && !this.tight ) break ;
         case 'instanceof':
            return this.errorReservedID(e) ;

         default: break SWITCH;
    }
    case 12: switch (n) {
      case 'synchronized':
         if ( this. v <= 5 )
           return this.errorReservedID(e) ;

      default: break SWITCH;
    }
  }

  return e ? null : this.id();
};

this.errorReservedID = function(id) {
    if ( !this.throwReserved ) {
       this.throwReserved = true;
       return null;
    }
    if ( this.err('reserved.id',id) ) return this.errorHandlerOutput;
}



},
function(){
this . parseVariableDeclaration = function(context) {
     if ( ! this.canBeStatement &&
            this.err('not.stmt','var',context) )
       return this.errorHandlerOutput;

     this.canBeStatement = false;

     var startc = this.c0, startLoc = this.locBegin(), kind = this.ltval;
     var elem = null;

     this.next () ;

     this.setDeclModeByName(kind);
     
     elem = this.parseVariableDeclarator(context);
     if ( elem === null ) {
       if (kind !== 'let' && 
           this.err('var.has.no.declarators',startc,startLoc,kind,elem,context,isInArgsList,inComplexArgs,argNames  ) )
         return this.errorHandlerOutput;

       return null; 
     }

     var list = [elem];
     
     var isConst = kind === 'const';
     if ( isConst  && elem.init === null ) {
       this.assert(context & CONTEXT_FOR);
       this.unsatisfiedAssignment = elem;
     }

     if (!this.unsatisfiedAssignment) // parseVariableDeclarator sets it when it finds an uninitialized BindingPattern
          while ( this.lttype === ',' ) {
            this.next();     
            elem = this.parseVariableDeclarator(context);
            if (!elem &&
                 this.err('var.has.an.empty.declarator',startc,startLoc,kind,list,context,isInArgList,inComplexArgs,argNames ) )
              return this.erroHandlerOutput ;

            if (isConst) this.assert(elem.init !== null);
            list.push(elem);
          }

     var lastItem = list[list.length-1];
     var endI = 0, endLoc = null;

     if ( !(context & CONTEXT_FOR) ) {
       endI = this.semiI() || lastItem.end;
       endLoc = this.semiLoc();
       if (  !endLoc ) {
          if ( this.newLineBeforeLookAhead ) endLoc =  lastItem.loc.end; 
          else if ( this.err('no.semi','var', [startc,startLoc,kind,list,endI] ) )
             return this.errorHandlerOutput;
       }
     }
     else {
       endI = lastItem.end;
       endLoc = lastItem.loc.end;
     }

     this.foundStatement  = true ;

     return { declarations: list, type: 'VariableDeclaration', start: startc, end: endI,
              loc: { start: startLoc, end: endLoc }, kind: kind /* ,y:-1*/};
};

this . parseVariableDeclarator = function(context) {
  if ( (context & CONTEXT_FOR) &&
       this.lttype === 'Identifier' &&
       this.ltval === 'in' )
      return null;

  var head = this.parsePattern(), init = null;
  if ( !head ) return null;

  if ( this.lttype === 'op' && this.ltraw === '=' )  {
       this.next();
       init = this.parseNonSeqExpr(PREC_WITH_NO_OP,context);
  }
  else if ( head.type !== 'Identifier' ) { // our pattern is an arr or an obj?
       if (!( context & CONTEXT_FOR) )  // bail out in case it is not a 'for' loop's init
         this.err('var.decl.neither.of.in',head,init,context) ;

       if( !this.unsatisfiedAssignment )
         this.unsatisfiedAssignment  =  head;     // an 'in' or 'of' will satisfy it
  }

  var initOrHead = init || head;
  return { type: 'VariableDeclarator', id: head, start: head.start, end: initOrHead.end,
           loc: { start: head.loc.start, end: initOrHead.loc.end }, init: init && core(init)/* ,y:-1*/ };
};


},
function(){

this.parseYield = function(context) {
  var arg = null,
      deleg = false;

  var c = this.c, li = this.li, col = this.col;
  var startc = this.c0, startLoc = this.locBegin();

  this.next();
  if (  !this.newLineBeforeLookAhead  ) {
     if ( this.lttype === 'op' && this.ltraw === '*' ) {
            deleg = true;
            this.next();
            arg = this.parseNonSeqExpr ( PREC_WITH_NO_OP, context & CONTEXT_FOR );
            if (!arg &&
                 this.err('yield.has.no.expr.deleg',startc,startLoc,c,li,col,context) )
              return this.errorHandlerOutput ;
     }
     else
        arg = this. parseNonSeqExpr ( PREC_WITH_NO_OP, (context & CONTEXT_FOR)|CONTEXT_NULLABLE );
  }

  var endI, endLoc;

  if ( arg ) { endI = arg.end; endLoc = arg.loc.end; }
  else { endI = c; endLoc = { line: li, column: col }; }  

  var n = { type: 'YieldExpression', argument: arg && core(arg), start: startc, delegate: deleg,
           end: endI, loc: { start : startLoc, end: endLoc }/* ,y:-1*/ }

  if ( !this.firstYS )
        this.firstYS = n;
 
  return n;
};



}]  ],
[Scope.prototype, [function(){


this.declare = function(name, declType) {
  return declare[declType].call(this, name, declType);
};


this.hoistIdToScope = function(id, targetScope, decl) { 
   var scope = this;
   
   while (true) {
     ASSERT.call(this, scope !== null, 'reached the head of scope chain while hoisting name "'+id+'"'); 
     if ( !scope.insertDecl(id, decl) ) {
       this.insertDecl0(id, DECL_MODE_CATCH_PARAMS);
       break;
     }

     if (scope === targetScope)
       break;

     scope = scope.parent;
   }
};
   
var declare = {};

declare[DECL_MODE_FUNCTION_PARAMS] =
declare[DECL_MODE_FUNCTION_DECL] =
declare[DECL_MODE_CLASS_DECL] =
declare[DECL_MODE_VAR] = function(id, declType) {
   var func = this.funcScope;

   this.hoistIdToScope(id, func, declType );
};

declare[DECL_MODE_CATCH_PARAMS|DECL_MODE_LET] =
declare[DECL_MODE_FUNCTION_EXPR] =
declare[DECL_MODE_CLASS_EXPR] =
declare[DECL_MODE_LET] = function(id, declType) {
   this.insertDecl(id, declType);
};

declare[DECL_MODE_CATCH_PARAMS] = function(id, declType) {
  var name = id.name + '%';
  this.insertDecl(id, declType);
};
 
// returns false if the variable was not inserted
// in the current scope because of having
// the same name as a catch var in the scope
// (this implies the scope must be a catch scope for this to happen)
this.insertDecl = function(id, decl) {

  var declType = decl;
  var existingDecl = this.findDeclInScope(id.name);
  var func = this.funcScope;

  if (existingDecl !== DECL_NOT_FOUND) {
    var existingType = existingDecl;

    // if a var name in a catch scope has the same name as a catch var,
    // it will not get hoisted any further
    if ((declType & DECL_MODE_VAR) && (existingType & DECL_MODE_CATCH_PARAMS))
       return false;

    // if a var decl is overriding a var decl of the same name, no matter what scope we are in,
    // it's not a problem.
    if ((declType & DECL_MODE_VAR) && (existingType & DECL_MODE_VAR))
      return true; 
     
    this.err('exists.in.current', { id: id });
  }

  this.insertDecl0(id, decl);
  this.insertID(id);

  return true;
};

this.insertDecl0 = function(id, declType) {
  var name = id.name + '%';
  this.definedNames[name] = declType;
};

this.findDeclInScope = function(name) {
  name += '%';
  return HAS.call(this.definedNames, name) ? 
     this.definedNames[name] : DECL_NOT_FOUND;
};

this.finish = function() {
};
    

this.isLoop = function() { return this.type & SCOPE_TYPE_LEXICAL_LOOP; };
this.isLexical = function() { return this.type & SCOPE_TYPE_LEXICAL_SIMPLE; };
this.isFunc = function() { return this.type & SCOPE_TYPE_FUNCTION_EXPRESSION; };
this.isDeclaration = function() { return this.type === SCOPE_TYPE_FUNCTION_DECLARATION; };
this.isCatch = function() { return (this.type & SCOPE_TYPE_CATCH) === SCOPE_TYPE_CATCH; };
this.isGlobal = function() { return this.type === SCOPE_TYPE_GLOBAL; };

// a scope is concrete if a 'var'-declaration gets hoisted to it
this.isConcrete = function() {
  return this.type === SCOPE_TYPE_SCRIPT ||
         this.type === SCOPE_TYPE_GLOBAL ||
         this.isFunc();
};



},
function(){

this.spawnFunc = function(fundecl) {
  return new Scope(
    this,
    fundecl ?
      SCOPE_TYPE_FUNCTION_DECLARATION :
      SCOPE_TYPE_FUNCTION_EXPRESSION
  );
};

this.spawnLexical = function(loop) {
  return new Scope(
    this,
    !loop ?
     SCOPE_TYPE_LEXICAL_SIMPLE :
     SCOPE_TYPE_LEXICAL_LOOP );
};

this.spawnCatch = function() {
  return new Scope(
    this,
    SCOPE_TYPE_CATCH );
};

this.mustNotHaveAnyDupeParams = function() {
  return this.strict || this.isInComplexArgs;
};

this.hasParam = function(name) {
  return HAS.call(this.idNames, name+'%');
};

this.insertID = function(id) {
  this.idNames[id.name+'%'] = id;
};


}]  ],
[Template.prototype, [function(){
// TODO: add a mechanism to react to cases where latestVal does not have a property (own or inherited)
// whose name has the same value as idx

this.applyTo = function(obj, noErrIfUndefNull) {
  var latestVal = obj, latestIdx = "", list = this.idxList, e = 0;
  while (e < list.length) {
    var idx = list[e];
    if (latestVal === null || latestVal === void 0) {
      if (noErrIfUndefNull)
        return latestVal;
      ASSERT.call(this, false,
        (e === 0 ?
          'the value to apply the template to' :
          'the value for index ' + latestIdx + '(name="'+list[latestIdx]+'")') +
        'is ' + (latestVal !== null ? 'undefined' : 'null')
      );
    }
    
    latestVal = latestVal[idx];
    latestIdx = e;

    e++;
  }

  return latestVal;
};

}]  ],
null,
null,
null,
null,
null,
null]);
this.parse = function(src, isModule ) {
  var newp = new Parser(src, isModule);
  return newp.parseProgram();
};

this.Parser = Parser;  
this.ErrorString = ErrorString; this.Template = Template;
;}).call (this)