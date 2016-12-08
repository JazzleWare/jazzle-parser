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


var ANY_ARG_LEN = -1;

var WHOLE_FUNCTION = 8;
var ARGLIST_AND_BODY_GEN = 1 ;
var ARGLIST_AND_BODY = 2;
var METH_FUNCTION = 4;
var CONSTRUCTOR_FUNCTION = 128;

var OBJ_MEM = 0;
var CLASS_MEM = 1;
var STATIC_MEM =  5;

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

// TODO: even though they will fit in an int, it would be probably
// better to keep them separated -- they take some 20 bits right now 
var CONTEXT_NONE = 0,
    CONTEXT_ELEM = 1,
    CONTEXT_FOR = CONTEXT_ELEM << 1,
    CONTEXT_PARAM = CONTEXT_FOR << 1,
    CONTEXT_ELEM_OR_PARAM = CONTEXT_ELEM|CONTEXT_PARAM,
    CONTEXT_UNASSIGNABLE_CONTAINER = CONTEXT_PARAM << 1,
    CONTEXT_NULLABLE = CONTEXT_UNASSIGNABLE_CONTAINER << 1,
    CONTEXT_DEFAULT = CONTEXT_NULLABLE << 1,

    MEM_CLASS = CONTEXT_DEFAULT << 1, 

    MEM_GEN = MEM_CLASS << 1,
    SCOPE_FLAG_GEN = MEM_GEN,
    SCOPE_FLAG_ALLOW_YIELD_EXPR = SCOPE_FLAG_GEN,

    MEM_OBJ = MEM_GEN << 1,

    MEM_SET = MEM_OBJ << 1,
    MEM_GET = MEM_SET << 1,
    MEM_STATIC = MEM_GET << 1,
    MEM_CONSTRUCTOR = MEM_STATIC << 1,
    MEM_PROTOTYPE = MEM_CONSTRUCTOR << 1,
    MEM_OBJ_METH = MEM_PROTOTYPE << 1,
    MEM_PROTO = MEM_OBJ_METH << 1,
    CONTEXT_PROTO = MEM_PROTO,
    MEM_SUPER = MEM_PROTO << 1,
    SCOPE_FLAG_ALLOW_SUPER = MEM_SUPER,    
     
    MEM_HAS_CONSTRUCTOR = MEM_SUPER << 1,
    SCOPE_FLAG_BREAK = MEM_HAS_CONSTRUCTOR << 1,
    SCOPE_FLAG_CONTINUE = SCOPE_FLAG_BREAK << 1,

    // TODO: SCOPE_FLAG_FN serves the same purpose as MEM_OBJ_METH;
    // either makes the other one unnecessary; but in the meantime ...
    SCOPE_FLAG_FN = SCOPE_FLAG_CONTINUE << 1,

    SCOPE_FLAG_ARG_LIST = SCOPE_FLAG_FN << 1,
    SCOPE_BLOCK = SCOPE_FLAG_ARG_LIST << 1,
    SCOPE_IF = SCOPE_BLOCK << 1,

    SCOPE_WITH_FUNC_DECL = SCOPE_BLOCK,
    CLEAR_IB = ~SCOPE_WITH_FUNC_DECL,

    SCOPE_FLAG_ALLOW_RETURN_STMT = SCOPE_FLAG_FN,

    MEM_ACCESSOR = MEM_GET|MEM_SET,
    MEM_SPECIAL = MEM_ACCESSOR|MEM_GEN,
    MEM_FLAGS = MEM_CLASS|MEM_SPECIAL|MEM_CONSTRUCTOR|
                MEM_PROTO|MEM_SUPER|MEM_OBJ_METH|MEM_PROTOTYPE,
    MEM_ANY = MEM_CLASS|MEM_OBJ_METH|MEM_SPECIAL|MEM_ACCESSOR|MEM_GEN,
    MEM_CLASS_OR_OBJ = MEM_CLASS|MEM_OBJ,
    SCOPE_FLAG_NONE = 0,
    
    INHERITED_SCOPE_FLAGS = SCOPE_FLAG_ALLOW_SUPER|MEM_CONSTRUCTOR;

var ARGLEN_GET = 0,
    ARGLEN_SET = 1,
    ARGLEN_ANY = -1;

var DECL_MODE_VAR = 1,
    DECL_MODE_LET = 2,
    DECL_MODE_NONE = 0,
    DECL_MODE_FUNCTION_PARAMS = 4|DECL_MODE_VAR,
    DECL_MODE_CATCH_PARAMS = 8,
    DECL_MODE_FUNCTION_DECL = 32|DECL_MODE_VAR,
    DECL_MODE_FUNCTION_EXPR = 128|DECL_MODE_LET;

var DECL_NOT_FOUND = 
  // #if V
  null;
  // #else
  DECL_MODE_NONE;
  // #end

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
