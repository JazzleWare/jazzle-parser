// ! ~ - + typeof void delete    % ** * /    - +    << >>
// > <= < >= in instanceof   == !=    &    ^   |   ?:    =       ...

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


