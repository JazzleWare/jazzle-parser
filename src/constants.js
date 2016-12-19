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
var PAREN_NODE = PAREN;

var STRING_TYPE = typeof "string";
var NUMBER_TYPE = typeof 0;
var HAS = {}.hasOwnProperty;

function ASSERT(cond, message) { if (!cond) throw new Error(message); }

// TODO: ST_STRICT and ST_ALLOW_FUNC_DECL
var ST_FN_EXPR = 1,
    ST_FN_STMT = ST_FN_EXPR << 1,
    ST_LEXICAL = ST_FN_STMT << 1,
    ST_LOOP = ST_LEXICAL << 1,
    ST_MODULE = ST_LOOP << 1,
    ST_SCRIPT = ST_MODULE << 1,
    ST_GLOBAL = ST_SCRIPT << 1,
    
    // TODO: only used to determine whether a scope can have a catch var
    ST_CATCH = ST_GLOBAL << 1,

    ST_CLASS_EXPR = ST_CATCH << 1,
    ST_CLASS_STMT = ST_CLASS_EXPR << 1,

    ST_FN = ST_FN_EXPR|ST_FN_STMT,
    ST_TOP = ST_SCRIPT|ST_MODULE,
    ST_CONCRETE = ST_TOP|ST_FN,
    ST_HOISTED = ST_FN_STMT|ST_CLASS_STMT;

var CTX_NONE = 0,
    CTX_PARAM = 1,
    CTX_FOR = CTX_PARAM << 1,
    CTX_PAT = CTX_FOR << 1,
    CTX_NULLABLE = CTX_PAT << 1,
    CTX_DEFAULT = CTX_NULLABLE << 1,
    CTX_HASPROTO = CTX_DEFAULT << 1,
    CTX_HAS_A_PARAM_ERR = CTX_HASPROTO << 1,
    CTX_HAS_AN_ASSIG_ERR = CTX_HAS_A_PARAM_ERR << 1,
    CTX_HAS_A_SIMPLE_ERR = CTX_HAS_AN_ASSIG_ERR << 1,
    CTX_NO_SIMPLE_ERR = CTX_HAS_A_SIMPLE_ERR << 1,
    CTX_PARPAT = CTX_PARAM|CTX_PAT,
    CTX_PARPAT_ERR = CTX_HAS_A_PARAM_ERR|CTX_HAS_AN_ASSIG_ERR|CTX_HAS_A_SIMPLE_ERR;

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
    DECL_MODE_LET = DECL_MODE_VAR << 1,
    DECL_MODE_FUNC_STMT = DECL_MODE_LET << 1,
    DECL_DUPE = DECL_MODE_FUNC_STMT << 1,
    DECL_MODE_FUNC_PARAMS = DECL_DUPE << 1,
    DECL_MODE_FUNC_EXPR = DECL_MODE_FUNC_PARAMS << 1,
    DECL_MODE_CATCH_PARAMS = DECL_MODE_FUNC_EXPR << 1,
    DECL_MODE_CLASS_STMT = DECL_MODE_CATCH_PARAMS << 1,
    DECL_MODE_CLASS_EXPR = DECL_MODE_FUNC_EXPR,
    DECL_MODE_VAR_LIKE = DECL_MODE_VAR|DECL_MODE_FUNC_PARAMS,
    DECL_MODE_LET_LIKE = DECL_MODE_LET|DECL_MODE_CATCH_PARAMS,
    DECL_MODE_EITHER = DECL_MODE_CLASS_STMT|DECL_MODE_FUNC_STMT,
    DECL_MODE_FCE = DECL_MODE_FUNC_EXPR|DECL_MODE_CLASS_EXPR;

var DECL_NONE = 0;
var DECL_NOT_FOUND = 
  // #if V
  null;
  // #else
  DECL_NONE;
  // #end


var VDT_VOID = 1;
var VDT_TYPEOF = 2;
var VDT_NONE = 0;
var VDT_DELETE = 4;

var DIRECTIVE_TOP = 1,
    DIRECTIVE_FUNC = 2,
    DIRECTIVE_NONE = 0,
    DIRECTIVE_MODULE = DIRECTIVE_TOP,
    DIRECTIVE_SCRIPT = DIRECTIVE_MODULE;
