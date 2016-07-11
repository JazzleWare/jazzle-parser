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
    return prec === this.PREC_U;
  };

  PREC. isBin = function(prec) {
    return prec !== this.BOOL_OR && prec !== this.PREC_BOOL_AND;
  };

  PREC. isMMorAA = function(prec) {
    return prec < 0;
  };

  PREC. isQuestion= function(prec) {
    return prec === this.COND;
  }

