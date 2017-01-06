var CH_1 = char2int('1'),
    CH_2 = char2int('2'),
    CH_3 = char2int('3'),
    CH_4 = char2int('4'),
    CH_5 = char2int('5'),
    CH_6 = char2int('6'),
    CH_7 = char2int('7'),
    CH_8 = char2int('8'),
    CH_9 = char2int('9'),
    CH_0 = char2int('0'),

    CH_a = char2int('a'), CH_A = char2int('A'),
    CH_b = char2int('b'), CH_B = char2int('B'),
    CH_e = char2int('e'), CH_E = char2int('E'),
    CH_g = char2int('g'),
    CH_f = char2int('f'), CH_F = char2int('F'),
    CH_i = char2int('i'),
    CH_m = char2int('m'),
    CH_n = char2int('n'),
    CH_o = char2int('o'), CH_O = char2int('O'),
    CH_r = char2int('r'),
    CH_t = char2int('t'),
    CH_u = char2int('u'), CH_U = char2int('U'),
    CH_v = char2int('v'), CH_X = char2int('X'),
    CH_x = char2int('x'),
    CH_y = char2int('y'),
    CH_z = char2int('z'), CH_Z = char2int('Z'),

    CH_UNDERLINE = char2int('_'),
    CH_$ = char2int('$'),

    CH_TAB = char2int('\t'),
    CH_CARRIAGE_RETURN = char2int('\r'),
    CH_LINE_FEED = char2int('\n'),
    CH_VTAB = char2int('\v'),
    CH_FORM_FEED   = char2int( '\f') ,

    CH_WHITESPACE = char2int(' '),

    CH_BACKTICK = char2int('`'),
    CH_SINGLE_QUOTE = char2int('\''),
    CH_MULTI_QUOTE = char2int('"'),
    CH_BACK_SLASH = char2int(('\\')),

    CH_DIV = char2int('/'),
    CH_MUL = char2int('*'),
    CH_MIN = char2int('-'),
    CH_ADD = char2int('+'),
    CH_AND = char2int('&'),
    CH_XOR = char2int('^'),
    CH_MODULO = char2int('%'),
    CH_OR = char2int('|'),
    CH_EQUALITY_SIGN = char2int('='),

    CH_SEMI = char2int(';'),
    CH_COMMA = char2int(','),
    CH_SINGLEDOT = char2int('.'),
    CH_COLON = char2int((':')),
    CH_QUESTION = char2int('?'),

    CH_EXCLAMATION = char2int('!'),
    CH_COMPLEMENT = char2int('~'),

    CH_ATSIGN = char2int('@'),

    CH_LPAREN = char2int('('),
    CH_RPAREN = char2int(')'),
    CH_LSQBRACKET = char2int('['),
    CH_RSQBRACKET = char2int(']'),
    CH_LCURLY = char2int('{'),
    CH_RCURLY = char2int('}'),
    CH_LESS_THAN = char2int('<'),
    CH_GREATER_THAN = char2int('>')
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

var INTERMEDIATE_ASYNC = 'intermediate-async';

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
    CTX_ASYNC_NO_NEWLINE_FN = CTX_NO_SIMPLE_ERR << 1,
    CTX_PARPAT = CTX_PARAM|CTX_PAT,
    CTX_PARPAT_ERR = CTX_HAS_A_PARAM_ERR|CTX_HAS_AN_ASSIG_ERR|CTX_HAS_A_SIMPLE_ERR,
    CTX_TOP = CTX_PAT|CTX_NO_SIMPLE_ERR;

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

    MEM_ASYNC = MEM_CONSTRUCTOR << 1,
    SCOPE_FLAG_ALLOW_AWAIT_EXPR = MEM_ASYNC,

    SCOPE_FLAG_BREAK = SCOPE_FLAG_ALLOW_AWAIT_EXPR << 1,
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

    MEM_OBJ = MEM_ASYNC << 1,
    MEM_SET = MEM_OBJ << 1,
    MEM_GET = MEM_SET << 1,
    MEM_STATIC = MEM_GET << 1,
    MEM_PROTOTYPE = MEM_STATIC << 1,
    MEM_OBJ_METH = MEM_PROTOTYPE << 1,
    MEM_PROTO = MEM_OBJ_METH << 1,
    MEM_HAS_CONSTRUCTOR = MEM_PROTO << 1,
    MEM_ACCESSOR = MEM_GET|MEM_SET,
    MEM_SPECIAL = MEM_ACCESSOR|MEM_GEN|MEM_ASYNC,
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
var VDT_AWAIT = 8;

var DIR_MODULE = 1,
    DIR_SCRIPT = DIR_MODULE << 1,
    DIR_NONE = 0,
    DIR_TOP = DIR_MODULE|DIR_SCRIPT,
    DIR_FUNC = DIR_SCRIPT << 2,
    DIR_LAST = DIR_FUNC << 1,
    DIR_MAYBE = DIR_LAST << 1,
    DIR_HANDLED_BY_NEWLINE = DIR_MAYBE << 1,
    DIR_HAS_OCTAL_ERROR = DIR_HANDLED_BY_NEWLINE << 1;
