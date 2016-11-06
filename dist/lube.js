(function(){
"use strict";
;
function Decl(type, name, scope, synthName) {
  this.type = type;
  this.name = name;
  this.scope = scope;
  this.synthName = synthName;
  this.ref = null;
}

;
function Emitter(indenter) {
   this.code = "";
   this.currentIndentLevel = 0;
   this.currentIndentStr = "";
   this.indenter = indenter || "   ";
   this.synthStack = [];
   this.synth = false;
   this.indentStrCache = [""];
   this.currentLineLengthIncludingIndentation = 0;
   this.maxLineLength = 0;
   this.emitContext = EMIT_CONTEXT_NONE;
   this.prec = PREC_WITH_NO_OP;
   this.isLeft = false;
   this.codeStack = [];
   this.wrap = !false;
   this.scope = new Scope(null, SCOPE_FUNC);
   this.labelNames = {};
   this.unresolvedLabel = null;
   this.currentContainer = null;
   this.block_stack = [];
}

Emitter.prototype.emitters = {};

;
function LabelRef(baseName) {
   this.synthName = "";
   this.baseName = baseName;
}

LabelRef.real = function() {
   return new LabelRef("");
};

LabelRef.synth = function(baseName) {
   return new LabelRef(baseName);
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
  this.tight = !!isModule ;

  this.parenYS = null;
  this.firstNonSimpArg = null;

  this.isScript = !isModule;
  this.v = 12 ;

  this.firstParen = null;
  this.firstUnassignable = null;

  this.firstElemWithYS = null;
  this.firstYS = null;
  
  this.throwReserved = !false;
 
  this.errorHandlers = {};
  this.errorHandlerOutput = null;

  this.arrowParen = false;
  this.firstEA = null;
  this.firstEAContainer = null;
  this.defaultEA = null;

  this.first__proto__ = false;
  this.y = 0;

  this.scope = null;
};

;
function ParserScope(ownerParser, parent, type) {
   Scope.call(
     this, parent, type
   );

   this.paramNames = null;
   this.declMode = DECL_MODE_NONE;
   this.isInComplexArgs = false;
   this.parser = ownerParser;
   this.strict = this.parser.tight;

   if (this.isFunc())
     this.paramNames = {};

   this.synth = false;
}

;
function Partitioner(owner, details) {

   this.owner = owner;
   this.label = null;

   this.labelNames = null;

   this.act = null;
   this.ect = null;
   this.abt = null;
   this.ebt = null;

   this.mainContainer = null;
   this.hasFinally = false;

   if (this.owner === null) {
     this.emitter = details;
     this.details = null;
     this.idx = -1;
   }
   else {
     this.emitter = this.owner.emitter;
     this.details = details;
     this.idx = this.owner.partitions.length;
   }
     
   if (owner !== null && details === null) {
     this.type = 'SimpleContainer';
     this.statements = this.partitions = [];

     this.ect = this.owner.ect;
     this.act = this.owner.act;
     this.abt = this.owner.abt;
     this.ebt = this.owner.ebt;
   }
   else if (owner === null) {
     this.partitions = [];
     this.statements = null;
     this.type = 'MainContainer';
     this.labelNames = {}
   }
   else switch (details.type) {
     case 'WhileStatement':
     case 'SwitchStatement':
     case 'DoWhileStatement':
     case 'ForOfStatement':
     case 'BlockStatement':
     case 'ForInStatement':
     case 'TryStatement':
     case 'ForStatement':
     case 'IfStatement':
     case 'CatchClause':
     case 'ElseClause':
     case 'CaseClause':
     case 'LabeledStatement':
     case 'CustomContainer':
        this.partitions = [];
        this.statements = null;
        this.type = details.type.replace(/(?:Clause|Statement)$/, "Container");
        this.labelNames = this.owner.labelNames;

        this.act = this.owner.act;
        this.ect = this.owner.ect;
        this.abt = this.owner.abt;
        this.ebt = this.owner.ebt;

        break;

     default:
        ASSERT.call(this, false, "not a container partition: " + details.type);
   }

   this.currentPartition = null;

   this.min = this.owner ? this.owner.max : 0;
   this.max = this.min;

   this.synthLabel = null;

   switch (this.type) {
     case 'ForOfContainer':
     case 'ForContainer':
     case 'ForInContainer':
     case 'DoWhileContainer':
     case 'WhileContainer':
       this.act = this.ect = this.abt = this.ebt = this;
       break;

     case 'SwitchContainer':
       this.ebt = this;
     case 'TryContainer':
       this.abt = this.act = this;
       break;
   }      

   if (this.owner === null) // main container
     this.mainContainer = this;

   else
     this.mainContainer = this.owner.mainContainer;
}

;
function RefMode() {
   this.direct = 0;
   this.indirect = 0;
}

;
var Scope = function(parent, type) {
  this.type = type;

  if (!parent) 
    ASSERT.call(this.isFunc(), 'sub-scopes must have a parent');

  this.parent = parent;
  this.funcScope = 
     this.isFunc() ? this : this.parent.funcScope;

  this.definedNames = {};
  this.unresolvedNames = {};

  this.wrappedDeclList = null;
  this.wrappedDeclNames = null;
  this.scopeObjVar = null;

  this.tempStack = this.isFunc() ? [] : null;

  if (this.isLexical() && !this.isLoop() && this.parent.isLoop())
    this.type = SCOPE_TYPE_LEXICAL_LOOP;    

  this.catchVar = ""; // TODO: find another way maybe?
}

Scope.createFunc = function(parent, decl, funcParams) {
  var scope = new Scope(parent, decl ?
       SCOPE_TYPE_FUNCTION_DECLARATION :
       SCOPE_TYPE_FUNCTION_EXPRESSION );
  if (funcParams) 
    for (var name in funcParams) {
      if (!HAS.call(funcParams, name)) continue; 
      scope.define(funcParams[name].name, VAR);
    }
  return scope;
};

Scope.createLexical = function(parent, loop) {
   return new Scope(parent, !loop ?
        SCOPE_TYPE_LEXICAL_SIMPLE :
        SCOPE_TYPE_LEXICAL_LOOP);
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

var SCOPE_BREAK       = 1;
var SCOPE_CONTINUE    = SCOPE_BREAK << 1;
var SCOPE_FUNCTION    = SCOPE_CONTINUE << 1;
var SCOPE_METH        = SCOPE_FUNCTION << 1;
var SCOPE_YIELD       = SCOPE_METH << 1;
var SCOPE_CONSTRUCTOR = SCOPE_YIELD << 1 ;

var CONTEXT_FOR = 1,
    CONTEXT_ELEM = CONTEXT_FOR << 1 ,
    CONTEXT_NONE = 0,
    CONTEXT_PARAM = CONTEXT_ELEM << 1,
    CONTEXT_ELEM_OR_PARAM = CONTEXT_ELEM|CONTEXT_PARAM,
    CONTEXT_UNASSIGNABLE_CONTAINER = CONTEXT_PARAM << 1,
    CONTEXT_NULLABLE = CONTEXT_UNASSIGNABLE_CONTAINER << 1, 
    CONTEXT_DEFAULT = CONTEXT_NULLABLE << 1;

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

var EMIT_CONTEXT_NEW = 1,
    EMIT_CONTEXT_STATEMENT = 2,
    EMIT_CONTEXT_NONE = 0;

var IS_REF = 1,
    IS_VAL = 2,
    NOT_VAL = 0;

var NOEXPRESSION = { type: 'NoExpression' };

var START_BLOCK = { type: 'StartBlock' }, FINISH_BLOCK = { type: 'FinishBlock' };

function ASSERT(cond, message) { if (!cond) throw new Error(message); }

var SIMPLE_PARTITION = 0;
var CONTAINER_PARTITION = 1;

function y(n) {
  switch (n.type) {
    case 'ThisExpression':
    case 'Literal':
    case 'FunctionExpression':
    case 'Identifier':
    case 'SynthesizedExpr':
       return 0;

    default:
       return n.y;
  }  
}

var HAS = {}.hasOwnProperty;

var EMIT_LEFT = 1,
    EMIT_STMT_HEAD = 2,
    EMIT_NEW_HEAD = 8,
    EMIT_VAL = 16;

var ACCESS_FORWARD = 1, ACCESS_EXISTING = 2;

var VAR = 'var', LET = 'let';

var SCOPE_TYPE_FUNCTION_EXPRESSION = 1,
    SCOPE_TYPE_FUNCTION_DECLARATION = 2|SCOPE_TYPE_FUNCTION_EXPRESSION;
var SCOPE_TYPE_LEXICAL_SIMPLE = 8,
    SCOPE_TYPE_LEXICAL_LOOP = 16|SCOPE_TYPE_LEXICAL_SIMPLE;
var SCOPE_TYPE_MAIN = SCOPE_TYPE_FUNCTION_EXPRESSION;

var DECL_MODE_VAR = 1,
    DECL_MODE_LET = 2,
    DECL_MODE_NONE = 0,
    DECL_MODE_FUNCTION_PARAMS = 4;

var IF_BLOCK = 1,
    WHILE_BLOCK = 2,
    SIMPLE_BLOCK = 0,
    DO_BLOCK = 4;

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
var Errors = {};

Errors['u.token'] = "Unexpected token {0}";
Errors['u.invalid.token'] = "Unexpected {0}";
Errors['u.newline']= "Unexpected line terminator";
Errors['u.eos']= "Unexpected end of input";
Errors['u.num']= "Unexpected #{toktype(arg.tok)}";
Errors['u.newline']= "Unexpected line terminator";
Errors['u.comma.after.rest'] = "Unexpected comma after rest";
Errors['err.throw.newline'] = "Illegal newline after throw";
Errors['err.regex.incompl'] = "Invalid regular expression= missing /";
Errors['err.regex.flags'] = "Invalid regular expression flags";
Errors['err.assig.not'] = "Invalid left-hand side in assignment";
Errors['err.bind.not']= "Invalid left-hand side in binding";
Errors['err.assig.for-in']= "Invalid left-hand side in for-in";
Errors['err.assig.for-of']= "Invalid left-hand side in for-of";
Errors['err.assig.simple.not']= "Increment/decrement target must be an identifier or member expression";
Errors['err.switch.multi']= "More than one default clause in switch statement";
Errors['err.try.tail.no']= "Missing catch or finally after try";
Errors['err.ret.not.allowed'] = "Illegal return statement";
Errors['err.arrow.arg']= "Illegal arrow function parameter list";
Errors['err.for.init.decl'] = "Invalid variable declaration in for-in statement";
Errors['err.prop.init'] = "Illegal property initializer";

;
// ! ~ - + typeof void delete    % ** * /    - +    << >>
// > <= < >= in instanceof   === !==    &    ^   |   ?:    =       ...

var binPrec = {}; 

var PREC_WITH_NO_OP = 0;
var PREC_SIMP_ASSIG = PREC_WITH_NO_OP + 1  ;
var PREC_OP_ASSIG = PREC_SIMP_ASSIG + 40 ;
var PREC_COND = PREC_OP_ASSIG + 1;
var PREC_OO = -12 ;

var PREC_BOOL_OR = binPrec['||'] = PREC_COND + 2;
var PREC_BOOL_AND  = binPrec['&&'] = PREC_BOOL_OR + 2 ;
var PREC_BIT_OR = binPrec['|'] = PREC_BOOL_AND + 2 ;
var PREC_XOR = binPrec['^'] =  PREC_BIT_OR + 2;
var PREC_BIT_AND = binPrec['&'] = PREC_XOR + 2;
var PREC_EQUAL = binPrec['==='] =
                 binPrec['!=='] =
                 binPrec['=='] =
                 binPrec['!='] = PREC_BIT_AND + 2;
var PREC_COMP = binPrec['>'] = 
                binPrec['<='] =
                binPrec['<'] =
                binPrec['>='] =
                binPrec['instanceof'] =
                binPrec['in'] = PREC_EQUAL + 2;
var PREC_SH = binPrec['>>'] =
              binPrec['<<'] = PREC_COMP + 2;
var PREC_ADD_MIN = binPrec['+'] =
                   binPrec['-'] = PREC_SH + 2;
var PREC_MUL = binPrec['%'] =
               binPrec['**'] =
               binPrec['*'] =
               binPrec['/'] = PREC_ADD_MIN + 2;
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

function synth_id_node(name) {
   return { type: 'Identifier', synth: !false, name: name };
}

function synth_expr_node(str) {
   return { type: 'SynthesizedExpr', contents: str, y: 0 };
}

function synth_expr_set_node(arr, isStatement ) {
   if (isStatement)
     return { type: 'SynthesizedExprSet', expressions: arr, y: 0 };

   return { type: 'SequenceExpression', expressions: arr, y: 0 };
}

function assig_node(left, right) {
   if (left.type === 'Identifier' && right.type === 'Identifier')
     if (left.synth && left.name === right.name )
       return left;
  
   return { type: 'AssignmentExpression',  operator: '=', right: right, left: left, y: 0 };
}

function cond_node(e, c, a) {
   return { type: 'ConditionalExpression', 
            test: e,
            consequent: c,
            alternate: a,
            y: 0 };
}

function id_is_synth(n) {
   this.assert(id.type === 'Identifier');
   return n.name.charCodeAt() === CHAR_MODULO;
}

function synth_not_node(n) {
  return { type: 'UnaryExpression', operator: '!', argument: n, y: 0 };

}

function synth_seq_or_block(b, yc, totalY) {
   return { type: 'BlockStatement', body: b, y: yc};
}

var VOID0 = synth_expr_node('(void 0)');
function synth_if_node(cond, body, alternate, yBody, yElse) {
  yBody = yBody || 0;
  yElse = yElse || 0;

  var yc = yBody + yElse;
  if (body.length > 1 || body[0].type === 'IfStatement' )
    body = synth_seq_or_block(body, yBody, yc);
  else
    body = body[0];

  if(alternate)
    alternate = alternate.length > 1 ? synth_seq_or_block(body, yElse, yc) : alternate[0];
  else
    alternate = null;

  return { type: 'IfStatement',
           alternate: alternate ,
           consequent: body, 
           test: cond, y: yBody + yElse };
}

function append_assig(b, left, right) {
  var assig = null;
  if ( right.type !== 'Identifier' || left !== right.name)
    assig = assig_node(synth_id_node(left), right);

  if ( assig ) b.push(assig);
}
   
function append_non_synth(b, nexpr) {
  if (nexpr.type !== 'Identifier' || !nexpr.synth )
    b. push(nexpr);

}

function synth_mem_node(obj, prop, c) {
  return { type: 'MemberExpression',
           computed: c,
           object: obj,
           property: (prop),  
           y: 0 };

}

function synth_call_node(callee, argList) {
   return { type: 'CallExpression', arguments: argList, callee: callee, synth: !false, y: 0 };

}

var FUNC_PROTO_CALL = synth_id_node('call');

function call_call(thisObj, callee, argList) {
   return synth_call_node(
      synth_mem_node(synth_id_node(callee), FUNC_PROTO_CALL, false),
      [synth_id_node(thisObj)].concat(argList)
   );
}
 
function synth_literal_node(value) {
   return { type: 'Literal', value: value };
}

function synth_binexpr(left, o, right, yc) {
   var t = "";
   if ( o === '||' || o === '&&' ) t = 'LogicalExpression'; 
   else if ( o.charAt(o.length-1) === '=' ) switch (o) {
      case '==':
      case '>=': 
      case '<=':
      case '!=':
      case '!==':
      case '===':
         t = 'BinaryExpression';
         break;

      default:
        t = 'AssignmentExpression';
        break;
   }
   else t = 'BinaryExpression';  
    
   return {
     type: t,
     left: left,
     y: yc, 
     right: right,
     operator: o
   };
}


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
       return !false;
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

function toBody(b) {
  if (b.length > 1)
    return { type: 'BlockStatement', body: b };

  if (b.length === 1)
    return b[0];

  return { type: 'EmptyStatement' };
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
[Decl.prototype, [function(){
this.funcDecl = function() { return this.scope === this.scope.funcScope; };

this.needsScopeVar = function() {
   return this.type === LET &&
          this.scope.isLoop() &&
          this.refMode.indirect; 
};

this.rename = function() {
   var synthName = this.scope.newSynthName(this.name);
   var funcScope = this.scope.funcScope;
   funcScope.insertDecl0(false, this.synthName, null);
   
   this.synthName = synthName;
   funcScope.insertDecl0(false, this.synthName, this);
};

this.isScopeObj = function() { 
   return this === this.scope.scopeObjVar;
};


}]  ],
[Emitter.prototype, [function(){
this.if_state_geq = function(v) { return this.if_state('>=', v); };
this.if_state_lt  = function(v) { return this.if_state('<', v); };
this.if_state_leq = function(v) { return this.if_state('<=', v); };
this.if_state_gt  = function(v) { return this.if_state('>', v); };
this.if_state_eq  = function(v) { return this.if_state('===', v); };

this.if_state = function(o, state) {
  this.block_stack.push(IF_BLOCK);
  this.write('if (state '+o+' '+state+') {');
  this.indent(); 
};

this.do_while_nocond = function(n) {
  this.block_stack.push(DO_BLOCK);
  this.write('do {');
  this.indent();
};

this.while_nocond = function(n) {
   this.block_stack.push(WHILE_BLOCK);
   this.write('while (true) {');
   this.indent();
};

this.set_state = function(v) { 
  this.write('state');
  this.write('=');
  this.write(''+v);
  this.write(';');
};

this.withErrorGuard = function(b, n) {
  var next = n.next();
  if (next)
    this.set_state(-next.min);
};

this.end_block = function() {
  ASSERT.call(this, this.block_stack.length>0);
  this.unindent();
  this.newlineIndent(); 
  this.write('}');
  if (this.block_stack.pop()===DO_BLOCK)
    this.write(' while (true);');
};

},
function(){
this.write = this.w = function(lexeme) {
   if ( this.wrap ) {
       var lineLengthIncludingIndentation = 
          this.currentLineLengthIncludingIndentation +
          lexeme.length;
       
       if ( this.maxLineLength &&
            lineLengthIncludingIndentation > this.maxLineLength )
         this.indentForWrap();

       this.currentLineLengthIncludingIndentation += lexeme.length; 
   } 
   else this.wrap = true;

   this.code += lexeme;
   return this;
};

this.space = this.s = function() { this.code += ' '; return this; };

this.enterSynth = function() {
   this.synthStack.push(this.synth);
   this.synth = !false;
};

this.exitSynth = function() {
   ASSERT.call(this, this.synthStack.length>=1);
   this.synth = this.pop(); 
};

this.indent = function() {
   this.currentIndentLevel++;
   if ( this.currentIndentLevel >= this.indentStrCache.length )
     this.indentStrCache.push(this.currentIndentStr + this.indenter);

   this.currentIndentStr = this.indentStrCache[this.currentIndentLevel];
   this.currentLineLengthIncludingIndentation = this.currentIndentStr.length;
};

this.unindent = function() {
   ASSERT.call(this, this.currentIndentLevel > 0);
   this.currentIndentStr = this.indentStrCache[--this.currentIndentLevel];
   this.currentLineLengthIncludingIndentation = this.currentIndentStr.length;
};

this.newlineNoIndent = function() {
  this.code += '\n';
  this.currentLineLengthIcludingIndentation = 0;
};

this.newlineIndent = function() {
  this.code += '\n' + this.currentIndentStr;

  this.currentLineLengthIncludingIndentation = this.currentIndentStr.length;
};

this.indentForWrap = function() {
   if ( this.currentLineLengthIncludingIndentation === 
        this.currentIndentStr.length )
     return;

   var wrapIndenter = this.currentIndentStr + " ";
   this.currentLineLengthIncludingIndentation = wrapIndenter.length ;
   this.code += '\n' + wrapIndenter ;

};

function isLoop(n) {
   var t = n.type;

   switch (t) {
      case 'ForOfStatement':
      case 'ForInStatement':
      case 'ForStatement':
      case 'DoWhileStatement':
      case 'WhileStatement':
         return true;

      default:
         return false;
   }
}
     
this.emit = function(n, prec, flags) {
  if ( !n )
    return;

  var abt = null, act = null, loop = isLoop(n);
  if (this.currentContainer) {
    if (loop) {
      abt = this.currentContainer.abt;
      this.currentContainer.abt = this.currentContainer.ebt;
      act = this.currentContainer.act;
      this.currentContainer.act = this.currentContainer.ect;
    }
    else if (n.type === 'SwitchStatement') {
      abt = this.currentContainer.abt;
      this.currentContainer.abt = this.currentContainer.ebt;
    }
  }
  if (arguments.length < 2) prec = PREC_WITH_NO_OP;
  if (arguments.length < 3) flags = 0;

  ASSERT.call(this, HAS.call(this.emitters, n.type),
      'No emitter for ' + n.type );
  var emitter = this.emitters[n.type];
  var r = emitter.call(this, n, prec, flags);
  
  if (this.currentContainer) {
    if (loop) {
      this.currentContainer.abt = abt;
      this.currentContainer.act = act;
    }
    else if (n.type === 'SwitchStatement')
      this.currentContainer.abt = abt;
  }
};

this.startCode = function() {
  this.codeStack.push(this.code);
  this.code = "";
};

this.endCode = function() {
  var c = this.code;
  this.code = this.codeStack.pop();
  return c;
};


},
function(){
this._emitBlock = function(list) {
   var e = 0 ;
   while ( e < list.length ) {
      this.newlineIndent();
      this.emit(list[e]);
      e++;
   }
};
 
this._emitElse = function(blockOrExpr) {
  if ( blockOrExpr.type === 'ExpressionStatement' ) {
    this.indent();
    this.newlineIndent();
    this.emit(blockOrExpr);
    this.unindent();
  }
  else
    this.emit(blockOrExpr);
};
 
this._emitBody = function(blockOrExpr) {
  if ( blockOrExpr.type !== 'BlockStatement' ) {
    this.indent();
    this.newlineIndent();
    this.emit(blockOrExpr);
    this.unindent();
  }
  else {
    this.space();
    this.emit(blockOrExpr);
  }
};

this._paren = function(n) {
  this.write('(');
  this.emit(n, PREC_WITH_NO_OP, EMIT_VAL);
  this.write(')');
};

this._emitCallArgs = function(list) {
  var e = 0;
  while ( e < list.length ) {
     if ( e ) this.write(', ');
     this._emitNonSeqExpr(list[e], PREC_WITH_NO_OP );
     e++; 
  }
};

function isImplicitSeq(n) {
   if ( n.type === 'AssignmentExpression' ) {
     n = n.left;
     switch (n.type) {
        case 'ArrayPattern':
           return n.elements.length !== 0;
  
        case 'ObjectPattern':
           return n. properties.length !== 0;
     }
   }

   return false;
}

this._emitNonSeqExpr = function(n, prec, flags) {
  if ( n.type === 'SequenceExpression' || isImplicitSeq(n) )
    this._paren(n);
  else
    this.emit(n, prec, flags);
};

this.emitters['ArrayExpression'] = function(n) {
   ASSERT.call(this, false, n.type);
};
    
this.emitters['BlockStatement'] = function(n) {
   this.write('{');
   this.indent();
   this._emitBlock(n.body);
   this.unindent();
   this.newlineIndent();
   this.write('}');
};

this.emitters['ForStatement'] = function(n) {
   this.write('for (');
   if ( n.init ) this.emit(n.init);
   this.write(';');
   if ( n.test ) this.emit(n.test);
   this.write(';');
   if ( n.update ) this.emit(n.update);
   this.write(')');
   this._emitBody(n.body);
};

function isSimpleCh(ch) {
   return (ch >= CHAR_A && ch <= CHAR_Z) ||
          (ch >= CHAR_a && ch <= CHAR_z) ||
          (ch === CHAR_UNDERLINE)        ||
          (ch <= CHAR_9 && ch >= CHAR_0) ||
          (ch === CHAR_$);
}
   
this.emitters['IfStatement'] = function(n) {
   this.write('if (');
   this.emit(n.test);
   this.write(')');
   this._emitBody(n.consequent);

   if (n.alternate) {   
     this.newlineIndent();    
     this.write('else ');
     this._emitElse (n.alternate);
   }
};
   
function isComplexExpr(n) {

  switch ( n.type ) {

    case 'UnaryExpression':
    case 'AssignmentExpression':
    case 'SequenceExpression': 
    case 'UpdateExpression':
    case 'ConditionalExpression':
    case 'BinaryExpression':
    case 'LogicalExpression':    
       return !false;

    default:
       return false;
  }
}

this._emitNonComplexExpr = function(n, prec, flags) {
    if ( isComplexExpr(n) )
      return this._paren(n);

    this.emit(n, prec, flags);
};

this.emitters['MemberExpression'] = function(n) {
  this._emitNonComplexExpr (n.object);

  if ( n.computed ) {
    this.write('[');
    this.emit(n.property, PREC_WITH_NO_OP, EMIT_VAL);
    this.write(']');
  }

  else {
    this.write('.');
    this.emit(n.property);

  }
};

this.emitters['NewExpression'] = function(n) {
   this.write('new ');
   this._emitNonComplexExpr (n.callee, PREC_WITH_NO_OP, EMIT_NEW_HEAD);
   this.write('(');
   this._emitCallArgs(n.arguments);
   this.write(')');
};

this.emitters['Identifier'] = function(n) {
   var name = n.name;
   var e = 0;
   if ( name.length && name.charCodeAt(0) === CHAR_MODULO )
     e++ ;
     
   var nameString = "";
   var simplePortionStart = e;
   while ( e < name.length ) {
      var ch = name.charCodeAt(e);
      if ( isSimpleCh(ch) ) e++; 
      else {
         nameString += name.substring(simplePortionStart,e);
         e++;
         nameString += '\\u' + hex(ch);
         simplePortionStart = e;
      }
   }
   if ( e > simplePortionStart )
     nameString += name.substring(simplePortionStart,e);

   this.write(nameString);
};
 
this.emitters['WhileStatement'] = function(n) {
  this.write('while (');
  this.emit(n.test);
  this.write(')');
  this._emitBody(n.body);

};      

this.emitters['Literal'] = function(n) {
  this.emitContext = EMIT_CONTEXT_NONE;
  switch( n.value ) {
    case true: return this.write('true');
    case null: return this.write('null');
    case false: return this.write('false');
    default: 
       if ( typeof n.value === typeof 0 )
         return this.write(n.value + "");

       return this._emitString(n.value);
  }
};

this._emitString = function(str) {
   var ch = 0, emittedStr = "", e = 0, simpleStart = 0;
   var quote = CHAR_SINGLE_QUOTE, quoteStr = '\'';
   this.write(quoteStr);
   while ( e < str.length ) {    
      ch = str.charCodeAt(e);
      if ( ch <= CHAR_EXCLAMATION || ch >= CHAR_COMPLEMENT ) {
        var esc = "";
        switch (ch) {
          case CHAR_TAB: esc = 't'; break;
          case CHAR_CARRIAGE_RETURN: esc = 'r'; break;
          case CHAR_LINE_FEED: esc = 'n'; break;
          case CHAR_VTAB: esc = 'v'; break;
          case quote: esc = quoteStr; break
          case CHAR_FORM_FEED: esc = 'f'; break;
          case CHAR_BACK_SLASH: esc = '\\'; break;
          default:
             esc = ch <= 0xff ? 'x'+hex2(ch) : 'u'+hex(ch) ;
        }
        emittedStr += str.substring(simpleStart,e) + '\\' + esc;
        simpleStart = e + 1 ;
     }
     
     e++;
  }
  this.write(emittedStr);
  if ( simpleStart < e )
    this.write(str.substring(simpleStart,e));
  this.write(quoteStr);
};
             
this.emitters['ExpressionStatement'] = function(n) {
   if (n.expression.type === 'AssignmentExpression' )
     this.emit(
        this._transformAssignment(n.expression, NOT_VAL), PREC_WITH_NO_OP, EMIT_STMT_HEAD
     );
   else {
     this.emit(n.expression, PREC_WITH_NO_OP, EMIT_STMT_HEAD);
     this.write(';');
   }
};
     
this.emitters['DoWhileStatement'] = function(n) {
   this.write( 'do ' );
   this._emitBody(n.body);
   if ( n.body.type !== 'BlockStatement' ) {
     this.newlineIndent();
     this.write('while ('); 
   }
   else
     this.write(' while (');

   this.emit(n.test);
   this.write(');');
};
      
this.emitters['LabeledStatement'] = function(n) {
   this.emit(n.label);
   this.code += ':';
   this.newlineIndent();
   this.emit(n.body);

};

this.emitters['BreakStatement'] = function(n) {
   this.write('break');
   if ( n.label !== null ) {
     this.wrap = false;
     this.space();
     this.emit(n.label);
   }
   else if (!this.inActualBreakTarget()) {
     this.write(' ['+this.currentContainer.ebt.synthLabel.synthName+']');
   }
   this.write(';');
};

this.emitters['ContinueStatement'] = function(n) {
   this.write('continue');
   if ( n.label !== null ) {
     this.wrap = false;
     this.space();
     this.emit(n.label);
   }
   else if (!this.inActualContinueTarget()) {
     this.write(' ['+this.currentContainer.ect.synthLabel.synthName+']');
   }
   this.write(';');
};  

this.emitters['EmptyStatement'] = function(n) {
   this.write(';');

};

this.emitters['LogicalExpression'] = 
this.emitters['BinaryExpression'] = function(n, prec, flags) {
   var currentPrec = binPrec[n.operator], hasParen = false;
   
   hasParen = prec > currentPrec ||
               (prec === currentPrec && 
                !(flags & EMIT_LEFT)  && !isRassoc(currentPrec));
       
   if ( hasParen ) {
      this.write('(');
   }

   this._emitNonSeqExpr(n.left, currentPrec, flags|EMIT_LEFT|EMIT_VAL);
   this.write(' ' + n.operator + ' ');
   this._emitNonSeqExpr(n.right, currentPrec, EMIT_VAL);

   if ( hasParen ) this.write(')');

};

this._transformAssignment = function(assig, vMode) {
   var b = [];
   assig = this.transformYield(assig, b, vMode);
   if (vMode || assig.type === 'AssignmentExpression') b. push(assig);

   if (vMode && b.length === 1)
     return b[0];

   return { type: vMode ? 'SequenceExpression' : 'SequenceStatement', expressions: b }
};
   
this.emitters['SequenceStatement'] = function(n) {
  var list = n.expressions, e = 0;
  while (e < list.length) {
     if (e > 0) this.newlineIndent();
     this.emit(list[e++], PREC_WITH_NO_OP, EMIT_VAL);
     this.write(';');
  }
};

this.emitters['AssignmentExpression'] = function(n, prec, flags) {
   var hasParen = prec !== PREC_WITH_NO_OP;
   if (hasParen) this.write('(');
   switch (n.left.type) {
      case 'Identifier': 
      case 'MemberExpression':
      case 'SynthesizedExpr':
         if (y(n) === 0) {
           this.emit(n.left);
           this.write(' ' + n.operator + ' ');
           this._emitNonSeqExpr(n.right, PREC_WITH_NO_OP, flags & EMIT_VAL);
           break ;
         }
      default:
         this.emit( this._transformAssignment(n, flags & EMIT_VAL), PREC_WITH_NO_OP, flags & EMIT_VAL);
   }
   if (hasParen) this.write(')');
};

this.emitters['Program'] = function(n) {
   this._emitBlock(n.body);

};

this.emitters['CallExpression'] = function(n, prec, flags) {
   var hasParen = flags & EMIT_NEW_HEAD;
   if (hasParen) this.write('(');
   this._emitNonComplexExpr (n.callee, PREC_WITH_NO_OP, 0);
   this.write('('); 
   this._emitCallArgs(n.arguments);
   this.write(')');
   if (hasParen) this.write(')');
};
   
this.emitters['SwitchStatement'] = function(n) {
   this.write( 'switch (');
   this.emit(n.discriminant);
   this.write(') {');
   var list = n.cases, e = 0;
   while ( e < list.length ) {
     var elem = list[e];
     this.newlineIndent();
     if ( elem.test ) {
       this.write('case ');
       this.emit(elem.test);
       this.write(':');
     }
     else
       this.write('default:');

     this.indent();
     this._emitBlock(elem.consequent); 
     this.unindent();
     e++ ;

   }

   this.newlineIndent();
   this.write('}');
};

this.emitters['ThrowStatement'] = function(n) {

   this.write('throw ');
   this.disallowWrap();
   this.emit(n.argument);
   this.restoreWrap();
   this.code += ';';

};

this.emitters['ReturnStatement'] = function(n) {
   this.write('return');

   if ( this.argument !== null ) {
      this.disallowWrap();
      this.write(' ');
      this.emit(n.argument);
      this.restoreWrap();
   }

   this.code += ';';
};

this.emitters['SequenceExpression'] = function(n, prec, flags) {
  var hasParen = false, list = n.expressions, e = 0;

  if (hasParen) this.write('(');

  while ( e < list.length ) {
     if (e) this.write(', ');
     this._emitNonSeqExpr(list[e], PREC_WITH_NO_OP, e ? 0 : flags);
     e++ ;
  }

  if (hasParen) this.write(')');
};
       
this.emitters['UpdateExpression'] = function(n) {
    if ( n.prefix ) { 
      if ( this.code.charAt(this.code.length-1) === 
           n.operator.charAt(0) )
        this.space();

      this.write(n.operator);
    }

    this._emitNonComplexExpr(n.argument);

    if (!n.prefix) {
      this.wrap = false;
      this.write(n.operator);
    }
};

this.emitters['UnaryExpression'] = function(n, prec, flags) {
    var hasParen = prec > PREC_U;
    if (hasParen) this.write('(');
    if ( this.code.charAt(this.code.length-1) === n.operator)
      this.space();

    this.write(n.operator);
    this.emit(n.argument, PREC_U, EMIT_VAL);
    if (hasParen) this.write(')');
};
 
this.emitters['WithStatement'] = function(n) {
  this.write('with (');
  this.emit(n.object, PREC_WITH_NO_OP, 0);
  this.write(') ');
  this._emitBody(n.body);

};

this.emitters['ConditionalExpression'] = function(n, prec, flags) {
   var hasParen = (prec !== PREC_WITH_NO_OP);
   if (hasParen) this.write('(');
   this._emitNonSeqExpr(n.test);
   this.write('?');
   this._emitNonSeqExpr(n.consequent, PREC_WITH_NO_OP);
   this.write(':');
   this._emitNonSeqExpr(n.alternate, PREC_WITH_NO_OP);

   if (hasParen) this.write(')');
};
  
this.emitters['ThisExpression'] = function(n) {
    if ( this.scopeFlags & EMITTER_SCOPE_FLAG_ARROW )
      return this._emitArrowSpecial('this');

    this.write('this');
};

this._emitAssignment = function(assig, isStatement) {
    ASSERT.call(this, false, "_emitAssignment"); 
};

this.emitters['YieldExpression'] = function(n) {
  this.write('yield');
  if (n.argument !== null) {
    this.wrap = false;
    this.space();
    this.emit(n.argument);
  }
}; 
      
this.emitters['NoExpression'] = function(n) { return; };

this.emitters['SynthesizedExpr'] = function(n) {
  this.write(n.contents);
};

this._emitGenerator = function(n) {
  var labels = this.labels;
  this.labels = {};
  this.write('function*');
  if (n.id !== null) this.write(' ' + n.id.name);
  this.write('(<args>) {');
  this.indent();
  this.newlineIndent();
  this.emit( new Partitioner(null, this).push(n.body) );
  this.unindent();
  this.newlineIndent();
  this.write('}');
  this.labels = labels;
};

this.addLabel = function(name) {
   this.labelNames[name+'%'] = this.unresolvedLabel ||
       ( this.unresolvedLabel = { target:null } );
};

this.removeLabel = function(name) {
   this.labelNames[name+'%'] = null;
};

this.emitters['FunctionDeclaration'] = function(n) {
  if (n.generator)
    return this._emitGenerator(n);
  
  else 
     ASSERT.call(this, false);
};

this.emitBreak = function(n) {
  this.write('break');
  if (n.label !== null)
    this.write(' '+n.label.name);
  else if (!this.inActualBreakTarget())
    this.write(' ['+this.currentContainer.ebt.synthLabel.synthName+']');
  this.write(';');
};

this.emitReturn = function(n) {
  this.write('return');
  if (n.argument) {
    this.write(' ');
    this.emit(n.argument);
  }
  this.write(';');
};

this.emitContinue = function(n) {
  this.write('continue');
  if (n.label !== null)
    this.write(' '+n.label.name);
  else if (!this.inActualContinueTarget())
    this.write(' ['+this.currentContainer.ect.synthLabel.synthName+']');
  this.write(';');
};

this.emitYield = function(n) {
   this.write('yield');
   if (n.argument) {
     this.write(' ');
     this.emit(n.argument);
   }
   this.write(';');
};

this.inActualBreakTarget = function() {
   return this.currentContainer === null ||
          this.currentContainer.abt === this.currentContainer.ebt;
};

this.inActualContinueTarget = function() {
   return this.currentContainer === null ||
          this.currentContainer.act === this.currentContainer.ect;
};

this.fixupContainerLabels = function(target) {
  if (this.unresolvedLabel) {
    this.unresolvedLabel.target = target;
    this.unresolvedLabel = null
  }
};

this.emitContainerStatement = function(n) {

  switch (n.type) {
     case 'ReturnStatement': return this.emitReturn(n);
     case 'YieldExpression': return this.emitYield(n);
     default: return this.emit(n);
  }
};

this.writeLabels = function(n) {
  var label = n.label;
  if (label === null)
    return false;
  
  label = label.head;

  while (label !== null) {
    this.write(label.name+': ');
    label = label.next;
  }

  return true;
};

function describeContainer(container) {
   var next = container.next();
   var str = "";
   if (container.isSimple()) {
     str = 'seg';
     if (container === container.owner.test)
       str += ':test';

     ASSERT.call(this, container.min === container.max);
     str += ' ['+container.min+']'+' next='+(next?next.min:'[none]');
     return str;
   }
   return 'container:' + container.type +
          ' [' + container.min + ' to ' + (container.max-1) + ']' +
          ' label=' + ( container.synthLabel ? container.synthLabel.synthName : '[none]' )+
          ' next='+(next?next.min:'[none]');
}

function listLabels(container) {
  var str = "";
  var label = container.label;
  while (label) {
    if (str.length !== 0 ) str += ',';
    str += label.name;
    label = label.next;
  }
  return "<labels>"+str+"</labels>";
}

this.emitters['MainContainer'] = function(n) {
  var cc = this.currentContainer;
  this.currentContainer = n;
  var containerStr = describeContainer(n);
  if (n.hasFinally) containerStr += ' hasFinally';
  this.write( '<'+containerStr+'>' );
  this.indent();
  var list = n.partitions, e = 0;
  while (e < list.length) {
    this.newlineIndent();
    this.emit(list[e]);
    e++ ;
  }
  this.unindent();
  this.newlineIndent(); 
  this.write('</'+containerStr+'>');
  this.currentContainer = cc;
};
 
this.emitters['IfContainer'] = function(n) {
  this.fixupContainerLabels(n);
  var cc = this.currentContainer;
  this.currentContainer = n;

  if (this.writeLabels(n))
    this.newlineIndent();

  this.if_state_leq(n.max-1);
  this.write(' // main if');
  var list = n.partitions, e = 0;
  while (true) {
    var current = list[e++];
    if (current === n.test) 
      break;
    this.newlineIndent();
    this.emit(current);
  }
  this.newlineIndent();
  this.if_state_eq(n.test.min);
    this.newlineIndent();
    this.write('if (');
    this.emit(n.test.partitions[0]);
    this.write(') /* test */');
    var next = n.consequent;
    this.set_state(next.min);
    this.newlineIndent();
    this.write('else ');
    next = n.alternate || n.next(); 
    this.set_state(next?next.min:-12);
  this.end_block();
    
  this.newlineIndent();
  if (n.consequent.hasMany()) this.if_state_leq(n.consequent.max-1);
     this.write(' // consequent');
     this.newlineIndent();
     this.emit(n.consequent);
  if (n.consequent.hasMany()) this.end_block();
  
  if ( n.alternate ) {
    this.newlineIndent();
    this.write('else ');
    if (n.alternate.hasMany()) {
      this.write('{');
      this.indent();
      this.newlineIndent();
    }
    this.emit(n.alternate);
    if (n.alternate.hasMany()) {
      this.unindent(); 
      this.newlineIndent();
      this.write('}');
    }
  }
  this.end_block();
};

this.emitters['WhileContainer'] = function(n) {
  this.fixupContainerLabels(n);
  var cc = this.currentContainer;
  this.currentContainer = n;

  this.if_state_leq(n.max-1); this.newlineIndent();
  this.while_nocond();

  var current = null;
  var list = n.partitions, e = 0;
  while (e < list.length) {
    current = list[e++];
    if (current === n.test)
       break;
    this.newlineIndent();
    this.emit(current);
  }
  this.newlineIndent();
  this.if_state_eq(n.test.min);
    this.newlineIndent();
    this.write('if');
    this.write('(');
    this.emit(n.test.partitions[0]);
    this.write(')'); this.space();
    this.set_state(n.test.next().min);
    this.newlineIndent();
    this.w('else').s().w('{').s();
      var next = n.next();
      this.set_state(next?next.min:-12);
      this.space();
      this.write('break;');
      this.space();
    this.write('}');
  this.end_block();

  while (e < list.length-1) {
    this.newlineIndent();
    this.emit(list[e++]);
  }

  this.newlineIndent();
  this.if_state_eq(list[e].min);
  this.newlineIndent();
  this.set_state(n.min);
  this.end_block();

  this.end_block(); this.end_block(); this.currentContainer = cc;
};

// TODO: pack non-test, non-synth SimpleContainers together in a switch (if fit)
this.emitters['SimpleContainer'] = function(n) {
  // TODO: won't work exactly, even though it works correctly, with things like
  // `a: (yield) * (yield)` ; it has no side-effects, but should be nevertheless corrected 
  this.fixupContainerLabels(n);  
  
  this.if_state_eq(n.min);
  this.newlineIndent();
  var next = n.next();
  this.set_state(next?-next.min:-12);
  this._emitBlock(n.partitions); 
  this.end_block();
}; 
 
this.emitters['LabeledContainer'] = function(n) {
  var name = n.label.name;
  this.addLabel(name);
//this.write(n.label.name + ':');
//this.write('// head=' + n.label.head.name);
//this.newlineIndent();
  var statement = n.partitions[0];

  if (statement.type === 'LabeledContainer') {
    statement.label.head = n.label.head;
    n.label.next = statement.label;
  }
  else
    statement.label = n.label.head;

  this.emit(statement);
  this.removeLabel(name);
};

this.emitters['BlockContainer'] = function(n) {
  this.fixupContainerLabels(n);
  var list = n.partitions, e = 0;
  this.write('{ // start');
  this.indent();
  this.newlineIndent();
  this.write(listLabels(n));
  while (e < list.length) {
     this.newlineIndent();
     this.emit(list[e++]);
  }
  this.unindent();
  this.newlineIndent();
  this.write('} // finish');
};

this.emitters['TryContainer'] = function(n) {
  this.fixupContainerLabels(n);
  var cc = this.currentContainer;
  this.currentContainer = n;

  this.if_state_leq(n.max-1); this.newlineIndent();
  this.while_nocond(); this.newlineIndent();
  this.w('try').s().w('{');
  this.indent(); this.newlineIndent(); 
     this.if_state_leq(n.block.max-1); this.newlineIndent();
        this.emit(n.block);
     this.end_block();
     if (n.handler) {
       this.newlineIndent();
       this.w('else').s();
       this.if_state_leq(n.handler.max-1); this.newlineIndent();
         this.emit(n.handler);
       this.end_block();
     }
  this.unindent(); this.newlineIndent();
  this.write('}');

  this.newlineIndent();

  var c = n.handler;
  var catchVar = 'err';
  this.w('catch').s().w('(').w(catchVar).w(')').s().w('{');
  this.indent(); this.newlineIndent();
  if (c) {
    this.if_state_leq(n.block.max-1); this.newlineIndent();
    this.w(c.catchVar).s().w('=').s().w(catchVar).w(';');
    this.newlineIndent();
    this.set_state(c.min); this.newlineIndent();
    this.w('continue').w(';');
    this.end_block();
  }
  this.unindent(); this.newlineIndent();
  this.w('}');

     if (n.finalizer) {
       this.newlineIndent();
       this.write('finally {');
       this.indent();
          this.emit(n.finalizer);
       this.unindent(); this.newlineIndent();
       this.write('}');
     }
  this.end_block();
  this.end_block();
};
  
this.emitters['SwitchContainer'] = function(n) {
  this.fixupContainerLabels(n);
  var containerStr = describeContainer(n);
  this.write('<'+containerStr+'>');
  var cc = this.currentContainer;
  this.currentContainer = n;
  this.indent();
  this.newlineIndent();
  this.write(listLabels(n));
  var list = n.partitions, e = 0;
  while (e < list.length) {
    this.newlineIndent(); 
    this.emit(list[e++]);
  }
  this.unindent();
  this.currentContainer = cc;
  this.newlineIndent();
  this.write('</'+containerStr+'>');
};

this.emitters['CustomContainer'] = function(n) {
  var list = n.partitions, e = 0;
  while (e < list.length) {
    if (e>0) this.newlineIndent();
    this.emit(list[e++]);
  }
};


},
function(){
var has = {}.hasOwnProperty;
var transformerList = {};

function isComplexAssignment(n) { 
   if (n.type === 'ExpressionStatement')
     n = n.expression;

   if ( n.type === 'AssignmentExpression' ) {
     if ( n.left.type === 'Identifier') return false;
     return n.left.type !== 'MemberExpression' ?
               !false : y(n.left) !== 0;
   }

   return false;
}

this.transformYield = function(n, b, isVal) {
  var yc = y(n);
  if ( (yc || isComplexAssignment(n)) && has.call(transformerList, n.type) ) {
    var transformedNode = transformerList[n.type].call(this, n, b, isVal);
    if ( transformedNode === n && yc )
      n.y = 0;
    return transformedNode;
  }
  
  return n;
};

transformerList['BinaryExpression'] = function(n, b, vMode) {
   var leftTemp = "";

   n.left = this.transformYield(n.left, b, !false);

   if ( y(n.right) ) {
     leftTemp = this.scope.allocateTemp();

     var id = synth_id_node(leftTemp);
     var assig = assig_node( id, n.left);
     if (assig.type !== 'Identifier' || !assig.synth)
        b.push( assig );
     n.left = id;
   }

   n.right = this.transformYield(n.right, b, !false );

   if ( leftTemp !== "" )
     this.scope.releaseTemp(leftTemp);

   return n;
};
 
transformerList['LogicalExpression'] = function(n, b, vMode) {
   var temp = "";
   n.left = this.transformYield (n.left, b, !false);
   
   var id = null;

   if (y(n.right)) {
     if (vMode) {
       temp = this.scope.allocateTemp();
       if ( n.left.type !== 'Identifier' || n.left.name !== temp)
         n.left = assig_node(synth_id_node(temp), n.left);

       this.scope.releaseTemp(temp);
     }

     if (n.operator === '||')
       n.left = synth_not_node(n.left);

     var ifBody = [], yBody = y(n.right);
     n.right = this.transformYield (n.right, ifBody, vMode);
     if (vMode) {
       temp = this.scope.allocateTemp();
       if ( n.right.type !== 'Identifier' || n.right.name !== temp )
         ifBody.push( assig_node(synth_id_node(temp), n.right));

       this.scope.releaseTemp(temp);
     }
     else if (n.right.type !== 'Identifier' || !n.right.synth )
       ifBody.push(n.right);

     b. push( synth_if_node(n.left, ifBody, null, yBody ) );       
     return vMode ? synth_id_node(temp) : NOEXPRESSION ;
   }

   n.right = this.transformYield (n.right, b, vMode);
   return n;
};          
     
transformerList['YieldExpression'] = function(n, b, vMode) {
   if (n.argument)
     n.argument = this.transformYield(n.argument,b, IS_VAL);

   b. push(n);
   return synth_id_node('sent');
};
          
transformerList['UpdateExpression'] = function(n, b, vMode) {        
   n.argument = this.transformYield(n.argument, b, IS_REF);
   return n;
};

transformerList['MemberExpression'] = function(n, b, vMode) {
   n.object = this.transformYield(n.object, b, IS_VAL);
   var objTemp = "";
   if (y(n.property)) {
     objTemp = this.scope.allocateTemp();
     append_assig(b, objTemp, n.object);
     n.object = synth_id_node(objTemp);
   }
   if (n.computed)
     n. property = this.transformYield(n.property, b, vMode);

   if (objTemp !== "") 
     this.scope.releaseTemp(objTemp);

   return n;
} 

this.transformCallArgs = function(args, b, yc) {
  var tempList = [], e = 0;
  while (e < args.length) {
     yc -= y(args[e]);
     args[e] = this.transformYield(args[e], b, IS_VAL);
     if (yc > 0) {
       var temp = this.scope.allocateTemp();
       append_assig(b, temp, args[e]);
       args[e] = synth_id_node(temp);
       tempList.push(temp);
     }
     else
       break;

     e++ ;
  }

  e = 0;
  while (e < tempList.length)
    this.scope.releaseTemp(tempList[e++]);

};      
  
transformerList['CallExpression'] = function(n, b, vMode) {
   vMode = IS_VAL;
   var yCall = y(n);
   var yArgs = yCall - y(n.callee) ;

   if (!yCall) return n;

   var callee = n.callee;
   if (callee.type !== 'MemberExpression') {
     if (y(callee)) 
       n.callee = this.transformYield(n.callee, b, IS_VAL);

     if (yArgs) {
       var temp = this.scope.allocateTemp();
       append_assig(b, temp, n.callee);
       n.callee = synth_id_node(temp);
       this.transformCallArgs(n.arguments, b, yArgs);
       this.scope.releaseTemp(temp);
     }
     return n;
   }

   var yObj = y(callee.object);
   if (yObj)
     callee.object = this.transformYield(callee.object, b, IS_VAL);
   
   var yProp = y(callee.property);
   var objTemp = "";

   if (yProp || yArgs) {
     objTemp = this.scope.allocateTemp();
     append_assig(b, objTemp, callee.object);
     callee.object = synth_id_node(objTemp);
   }

   callee.property = this.transformYield(callee.property, b, vMode);

   var calleeTemp = "";
   if (yArgs) {
     calleeTemp = this.scope.allocateTemp();
     append_assig(b, calleeTemp, callee);
     this.transformCallArgs(n.arguments, b, yArgs);
     this.scope.releaseTemp(objTemp);
     this.scope.releaseTemp(calleeTemp);

     return call_call(objTemp, calleeTemp, n.arguments);
   }

   return n;
};           

var transformAssig = null;
transformAssig = {};

this.transformAssignment = transformerList['AssignmentExpression'] = function(n, b, vMode) {
   var lefttype = n.left.type;
   var temp = this.scope.allocateTemp();
   this.evaluateAssignee(n.left, b, y(n));
   this.scope.releaseTemp(temp);

   n.right = this.transformYield(n.right, b, IS_VAL);
   var assigValue = transformAssig[lefttype].call(this, n, b);

   // in case the original assignment's left hand side is of the following types,
   // the transformed assignment will still be an assignment (rather than a synthetisized expression)
   switch (lefttype) { 
     case 'Identifier': 
     case 'MemberExpression':
        assigValue.y = 0; 
        return assigValue;

     default:
        return vMode ? assigValue : NOEXPRESSION;
   }
};

this.evaluateAssignee = function( assignee, b, yc ) {
    if (assignee.type === 'Property' || assignee.type === 'AssignmentProperty' ) {
      if (assignee.computed ) {
        assignee.key = this.transformYield(assignee.key, b, IS_VAL);
        var t = this.scope.allocateTemp();
        append_assig(b, t, assignee.key);
        assignee.key = synth_id_node(t);
      }

      assignee = assignee.value;
    }
            
    if (assignee.type === 'AssignmentPattern' )
      assignee = assignee.left;

    var e = 0;

    switch (assignee.type) {
       case 'Identifier':
          break;

       case 'ArrayPattern':
          while (e < assignee.elements.length) {
             yc = this.evaluateAssignee(assignee.elements[e], b, yc);
             e++ ;
          }
          break;

       case 'ObjectPattern':
          while (e < assignee.properties.length) {
             yc = this.evaluateAssignee(assignee.properties[e], b, yc);
             e++ ;
          }
          break ;

       case 'MemberExpression':
          var objTemp = "";
          var propTemp = "";

          assignee.object = this.transformYield(assignee.object, b, IS_VAL);
          objTemp = this.scope.allocateTemp();

          append_assig( b, objTemp, assignee.object);
          assignee.object = synth_id_node(objTemp);
          if (assignee.computed) {
            assignee.property = this.transformYield(assignee.property, b, IS_VAL);
            propTemp = this.scope.allocateTemp();

            append_assig(b, propTemp, assignee.property );
            assignee.property = synth_id_node(propTemp);
          }
 
          break ;
    }

    return yc ;
}

var GET = synth_id_node('get');

var UNORNULL = synth_id_node('unORnull');

this.is_sent_var = function(id) { return id.name === 'sent'; };

this.release_if_synth = function(nexpr) {
  if ( nexpr.type === 'Identifier' && !this.is_sent_var(nexpr) && nexpr.synth )
    this.scope.releaseTemp(nexpr.name);
};

this.assigElement = function(left, right, b) {  
   return transformAssig[left.type].call(this, assig_node(left, right), b); // TODO: eliminate need for assig_node
};

transformAssig['Identifier'] = function(n, b) {
  return n;
};

var VAL = synth_id_node('val');
var ARR_ITER = synth_id_node('arrIter');
transformAssig['ArrayPattern'] = function(n, b) {

  var right = n.right,
      e = 0,
      list = n.left.elements,
      temp = this.scope.allocateTemp();

  right = synth_call_node(ARR_ITER, [n.right]);
  append_assig(b, temp, right);
  var next = synth_call_node(
              synth_mem_node(synth_id_node(temp),
              GET), [] );
  while (e < list.length) {
     var assig = this.assigElement(list[e], next, b);
     if (assig.type === 'AssignmentExpression') b. push(assig);
     e++ ;
  }

  this.scope.releaseTemp(temp);

  return synth_mem_node( synth_id_node(temp), VAL );
};

var OBJ_ITER = synth_id_node('objIter');
transformAssig['ObjectPattern'] = function(n, b) {
   var temp = this.scope.allocateTemp(), e = 0, list = n.left.properties; 

   var right = synth_call_node(OBJ_ITER, [n.right]);
   append_assig(b, temp, right);
   
   while (e < list.length) {
      var prop = list[e];
      var k = prop.key;
      if (k.type === 'Identifier') {
         if (prop.computed) {
           if (k.synth && !this.is_sent_var(k)) this.scope.releaseTemp( k.name );
         }
         else
           k = synth_literal_node(k.name);
      }
      var next = synth_call_node(
                   synth_mem_node(synth_id_node(temp), GET),
                   [k]
                 );
      var assig = this.assigElement(list[e].value, next, b);

      if (assig.type === 'AssignmentExpression') b. push(assig);
      e++ ;
   } 

   this.scope.releaseTemp(temp);
   
   return synth_mem_node( synth_id_node(temp), VAL ) ;
};
 
transformAssig['MemberExpression'] = function(n, b) {
   var left = n.left;
   this.release_if_synth(left.object);
   this.release_if_synth(left.property);
   return n;
};

transformAssig['AssignmentPattern'] = function(n, b) {
   var left = n.left.left, defaultVal = n.left.right;
   var cond = null, temp = this.scope.allocateTemp();
   cond = assig_node(synth_id_node(temp), n.right);
   cond = synth_call_node(UNORNULL, [cond]);
   this.scope.releaseTemp(temp);
   var ifBody = [], yc = y(defaultVal);
   defaultVal = this.transformYield(defaultVal, ifBody, IS_VAL);
   temp = this.scope.allocateTemp(); // lolhehe v2
   append_assig(ifBody, temp, defaultVal);
   n.right = synth_id_node(temp);
   this.scope.releaseTemp(temp);
   b. push(synth_if_node(cond, ifBody, null, yc));
   n.left = left;
   return transformAssig[left.type].call(this, n, b);
};

transformerList['ConditionalExpression'] = function( n, b, vMode ) {
  var yAll = y(n), yTest = y(n.test) ;
  n.test = this.transformYield(n.test, b, IS_VAL);
  yAll -= yTest;
  if (!yAll)
    return n;
  
  var ifB = [], yBody = y(n.consequent) ;

  n.consequent = this.transformYield(n.consequent, ifB, vMode);
  var temp = "";
  if (vMode) {
    temp = this.scope.allocateTemp();
    append_assig(ifB, temp, n.consequent);
    this.scope.releaseTemp(temp);
  }
  else
    append_non_synth(ifB, n.consequent);

  var elseB = [], yElse = y(n.alternate) ;

  n.alternate = this.transformYield(n.alternate, elseB, vMode);
  if (vMode) {
    temp = this.scope.allocateTemp();
    append_assig(elseB, temp, n.alternate);
    this.scope.releaseTemp(temp);
  }
  else
    append_non_synth(elseB, n.alternate);

  b. push(synth_if_node(n.test, ifB, elseB, yBody, yElse ));
  return vMode ? synth_id_node(temp) : NOEXPRESSION;
};
  
transformerList['ArrayExpression'] = function(n, b, vMode) {
   var list = n.elements, e = 0, yc = y(n), elem = null;

   var temp = this.scope.allocateTemp();
   append_assig(b, temp, synth_expr_node('[]'));

   var arrayID = synth_id_node(temp);
   while (e < list.length) {
      elem = this.transformYield(list[e], b, IS_VAL);
      b. push( assig_node( synth_expr_node(temp+'['+e+']'), elem) );
      e++ ;
   }

   this.scope.releaseTemp(temp);
   return vMode ? arrayID : NOEXPRESSION; 
};

transformerList['ObjectExpression'] = function(n, b, vMode) {
   var e = 0,
       list = n.properties,
       yc = y(n),
       temp = this.scope.allocateTemp(),
       currentY = 0;

   var nameTemp = "", valTemp = "";

   var objID = synth_id_node(temp);

   while (e < list.length) {
      var elem = list[e], val = elem.value, name = elem.key;
      name = this.transformYield(name, b, IS_VAL);
      if (y(val)) {
          nameTemp = this.scope.allocateTemp();
          append_assig(b, nameTemp, name);
          name = synth_id_node(nameTemp);
      }     
      val = this.transformYield(val, b, IS_VAL);
      b. push(
         assig_node(
           synth_mem_node(objID, name, !false),
           val 
         ) 
      );

      if (valTemp !== "" ) this.scope.releaseTemp(valTemp);
      if (nameTemp !== "") this.scope.releaseTemp(nameTemp);

      e++ ;
   }
 
   this.scope.releaseTemp(temp);

   return vMode ? objID : NOEXPRESSION;
};

transformerList['SequenceExpression'] = function(n, b, vMode) {
  var list = n.expressions, e = 0, yc = y(n);
  while (yc > 0 && e < list.length - 1 ) {
    var elem = list[e], currentY = y(elem);
    elem = this.transformYield(elem, b, NOT_VAL);
    if (elem !== 'NoExpression' && (elem.type !== 'Identifier' || !elem.synth) )
      b. push(elem);

    yc -= currentY; 
    e++;
  }
  if (e === list.length-1)
    return this.transformYield(list[e], b, vMode);

  n.expressions = [];
  while (e < list.length) n.expressions.push(list[e++]);

  return n;
};

transformerList['UpdateExpression'] = function(n, b, vMode) {
   var a = n.argument;
   if ( a.type === 'Identifier')
     return n;

   a.object = this.transformYield(a.object, b, IS_VAL);
   if ( a.computed && y(a.property) ) {
     var temp = this.scope.allocateTemp();
     append_assig(b, temp, a.object);
     a.object = synth_id_node(temp);
     a.property = this.transformYield(a.property, b, IS_VAL);
     this.scope.releaseTemp(temp);
   }

   return n;
};

transformerList['UnaryExpression'] = function(n, b, vMode) {
  n.argument = this.transformYield(n.argument, b, IS_VAL);
  return n;
};

function do_while_wrapper( body, yBody) {
   if (body.length > 1)
     body = { type: 'BlockStatement', body: body, y: yBody };

   return { type: 'DoWhileStatement', body: body, test: {type: 'Literal', value: false}, y: yBody };
}

this.transformSwitch = function(n) {
   var v = synth_id_node(this.scope.allocateTemp());
   var m = synth_id_node(this.scope.allocateTemp());
   var yc = y(n);
   var doBody = []; 
   this.scope.releaseTemp(v.name);
   n. discriminant = this.transformYield(n. discriminant, doBody, IS_VAL);
   this.scope.allocateTemp(v.name);
   append_assig(doBody, v.name, n. discriminant);
   append_assig(doBody, m.name, { type:'Literal', value: 0 });

   var list = n.cases, e = 0;
   while (e < list.length) {
     var c = list[e];
     var yTest = y(c.test);
     var cond = synth_not_node(m);
     var ifBody = [];
     var ex = this.transformYield(
        synth_binexpr(
           m, 
          '=',
          synth_binexpr(
             c.test,
             '==',
             v, yTest
          ), yTest
        ), ifBody, IS_VAL
     );
     if (ex !== NOEXPRESSION) ifBody.push(ex);

     doBody.push(synth_if_node(cond,ifBody, null, yTest));
     doBody.push(synth_if_node(m, c.consequent, null, y(c)));
     e++ ;
  }
  return doBody;
};

this.transformGenerator = function(n, vMode) {
  var partitioner = new Partitioner(null, this);
  return partitioner.push(n.body);
};



}]  ],
[LabelRef.prototype, [function(){
this.isSynth = function() { return this.baseName !== ""; };

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
      firstYS = this.firstYS;

  var hasSpread = false;
  var y = 0;
  do {
     this.firstUnassignable =
     this.firstParen = 
     this.unsatisfiedAssignment = 
     this.firstEA = 
     this.firstElemWithYS = null;
     elem = this.parseNonSeqExpr (PREC_WITH_NO_OP, context );
     if ( !elem && this.lttype === '...' ) {
         elem = this.parseSpreadElement();
         hasSpread = !false;
     }
     y += this.y;
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
        list.push(elem) ;
        this.next();
     }
     else  {
        if ( elem ) list.push(elem);
        break ;
     }
 
  } while ( !false );

  if ( firstParen ) this.firstParen = firstParen ;
  if ( firstUnassignable ) this.firstUnassignable = firstUnassignable;
  if ( firstEA ) this.firstEA = firstEA;
  if ( unsatisfiedAssignment ) this.unsatisfiedAssignment = unsatisfiedAssignment;
  if ( firstElemWithYS ) {
     this.firstElemWithYS = firstElemWithYS;
     this.parenYS = parenYS;
  } 
  this.firstYS = firstYS;

  elem = { type: 'ArrayExpression', loc: { start: startLoc, end: this.loc() },
           start: startc, end: this.c, elements : list, spread: hasSpread, y: y  };
  this.y = y;
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

this. asArrowFuncArg = function(arg  ) {
    var i = 0, list = null;

    switch  ( arg.type ) {
        case 'Identifier':
           if ( arg === this.firstParen && this.parenParamError() )
              return this.errorHandlerOutput ;

           return this.scope.parserDeclare(arg);

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
            this.asArrowFuncArg(arg.argument);
            arg.type = 'RestElement';
            return;

        case 'RestElement':
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
  this.scope.setDeclMode(DECL_MODE_FUNCTION_PARAMS);
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

  this.next();

  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= ( SCOPE_FUNCTION|SCOPE_METH|SCOPE_CONSTRUCTOR) ;

  var isExpr = !false, nbody = null;

  if ( this.lttype === '{' ) {
       var prevLabels = this.labels, prevYS = this.firstYS;
       this.firstYS = null;
       this.labels = {};
       isExpr = false;
       nbody = this.parseFuncBody(CONTEXT_NONE);
       this.labels = prevLabels;
       this.firstYS = prevYS;
  }
  else
    nbody = this. parseNonSeqExpr(PREC_WITH_NO_OP, context) ;

  var params = core(arg);
  this.tight = tight;

  this.exitScope();

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
         this['assig.to.eval.or.arguments'](head);

    case 'MemberExpression':
       return;

    default:
       return this['assig.not.simple'](head);
  }
};

this .ensureSimpAssig_soft = function(head) {
  switch(head.type) {
    case 'Identifier':
       if ( this.tight && arguments_or_eval(head.name) )
         this['assig.to.eval.or.arguments'](head);

    case 'MemberExpression':
       return ! false ;

    default:
       return false ;
  }
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
       this.toAssig(head.argument);
       head.type = 'RestElement';
       return;
   
     case 'AssignmentPattern': // this would be the case in the event of converting an obj prop in the form of "name = val" rather than "name: val"
       return;

     default:
        if ( this.notAssignableError(head) )
          return this.errorHandlerOutput;
  }
};

this .parseAssignment = function(head, context ) {
    var o = this.ltraw;
    var firstEA = null ;

    var y = this.y;
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
    y += this.y;

    this.firstEA = firstEA;
    var n = { type: 'AssignmentExpression', operator: o, start: head.start, end: right.end,
             left: core(head), right: core(right), loc: { start: head.loc.start, end: right.loc.end }, y: y };
    this.y = y;

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
this.noNameError = function() { 
    return this.err('u.token', this.locAndType() );
};

this.ctorMultiError = function() {
  return this.err( 'class.ctor.multi' );
};

this. parseClass = function(context) {
  var startc = this.c0,
      startLoc = this.locBegin();

  var canBeStatement = this.canBeStatement, name = null;
  this.next () ;

  if ( canBeStatement && context !== CONTEXT_DEFAULT  ) {
     if ( this.lttype !== 'Identifier' ) {
       if ( this.noNameError() ) return this.errorHandlerOutput;
     }
     else
       name = this. validateID(null);

     this.canBeStatement = false;
  }
  else if ( this.lttype === 'Identifier' && this.ltval !== 'extends' )
     name = this.validateID(null); 

  var y = 0;

  var classExtends = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'extends' ) {
     this.next();
     classExtends = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE);
     y = this.y;
  }

  var list = [];
  var nbodyStartc = this.c - 1, nbodyStartLoc = this.locOn(1);

  this.expectType ( '{' ) ;
  var elem = null, foundConstructor = false;

  var startcStatic, liStatic, colStatic, rawStatic, cStatic, startLocStatic;
  var isStatic = false;

  WHILE:
  while ( !false ) {
      if ( this.lttype === 'Identifier' && this.ltval === 'static' ) {
        startcStatic = this.c0;
        rawStatic = this.ltraw;
        colStatic = this.col;
        liStatic = this.li;
        cStatic = this.c;
        startLocStatic = this.locBegin();

        this.next();
        
        if ( this.lttype === '(' ) {
          elem = this.parseMeth( { type: 'Identifier', name: 'static', start: startcStatic, end: cStatic, raw: rawStatic,
                                  loc: { start: startLocStatic, end: { line: liStatic, column: colStatic } }}   , CLASS_MEM);
          list.push(elem);
          continue;
        }
        isStatic = !false;
      }
      SWITCH:
      switch ( this.lttype ) {
          case 'Identifier': switch ( this.ltval ) {
             case 'get': case 'set': 
               elem = this.parseSetGet(CLASS_MEM);
               break SWITCH;

             case 'constructor':
                 if ( foundConstructor && this.ctorMultiError() )
                   return this.errorHandlerOutput ;
                 
                 if ( !isStatic ) foundConstructor = !false;
                
             default:
               elem = this.parseMeth(this.id(), CLASS_MEM);
               break SWITCH;
          }
          case '[':
              elem = this.memberExpr();
              y += this.y;
              elem = this.parseMeth(elem, CLASS_MEM);
              break;
          case 'Literal': elem = this.parseMeth(this.numstr(), CLASS_MEM); break ;

          case ';': this.next(); continue;
          case 'op': 
            if ( this.ltraw === '*' ) {
              elem = this.parseGen(CLASS_MEM);
              break ;
            }

          default: break WHILE;
      } 
      if ( isStatic ) {
        if ( elem.kind === 'constructor' ) 
          elem.kind   =  "method"; 

        elem.start = startcStatic;
        elem.loc.start = startLocStatic;

        elem['static'] = !false;
        isStatic = false;
      }
      list.push(elem);         
  }
  var endLoc = this.loc();
  var n = { type: canBeStatement ? 'ClassDeclaration' : 'ClassExpression',
            id: name,
           start: startc,
            end: this.c,
           superClass: classExtends,
           loc: { start: startLoc, end: endLoc },
            body: { type: 'ClassBody',
                   loc: { start: nbodyStartLoc, end: endLoc },
                   start: nbodyStartc,
                    end: this.c,
                    body: list }, y: y };

  this.expectType('}');
  if ( canBeStatement ) { this.foundStatement = !false; }
  
  this.y = y;
  return n;
};

this.parseSuper  = function   () {
   var n = { type: 'Super', loc: { start: this.locBegin(), end: this.loc() }, start: this.c0 , end: this.c };
   this.next() ;
   switch ( this.lttype ) {
        case '(':
          if ( !( this.scopeFlags & SCOPE_CONSTRUCTOR ) &&
                  this['class.super.call']() ) return this.errorHandlerOutput;
          break ;
        case '.':
        case '[':
           if ( !(this.scopeFlags & SCOPE_METH) &&
                  this['class.super.mem']() ) return this.errorHandlerOutput ;
           break ;
        
       default:
          if ( this['class.super.lone']() )
            return this.errorHandlerOutput ; 
   }

   if ( !this.firstYS )
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
       n = !false ;

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

   this[ 'comment.multi.unfinished' ]();
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
   if (!this.canBeStatement)
     this['not.stmt']('export');

   this.canBeStatement = false;

   var startc = this.c0, startLoc = this.locBegin();
   this.next();

   var list = [], local = null, src = null ;
   var endI = 0;
   var ex = null;

   var semiLoc = null;
   switch ( this.lttype ) {
      case 'op':
         if (this.ltraw !== '*')
           this['export.all.not.*'](startc,startLoc);
 
         this.next();
         if (!this.expectID_soft('from'))
            this['export.all.no.from'](startc, startLoc);

         if (!(this.lttype === 'Literal' &&
              typeof this.ltval === STRING_TYPE )) 
              this['export.all.source.not.str'](startc,startLoc);

         src = this.numstr();
         
         endI = this.semiI();
         semiLoc = this.semiLoc_soft();
         if ( !semiLoc && !this.hasNewlineBeforeLookAhead)
           this['no.semi']( 'export.all',
              { s:startc, l:startLoc, src: src, endI: endI } );

         this.foundStatement = !false;
         
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
                this.throwReserved = !false;
            }
            ex = local;
            if ( this.lttype === 'Identifier' ) {
              if ( this.ltval !== 'as') 
                this['export.specifier.not.as'](
                     { s: startc, l: startLoc, list: list, local, ex: ex });

              this.next();
              if ( this.lttype !== 'Identifier' ) { 
                 this['export.specifier.after.as.id'](
                       { s:startc, l:startLoc, list:list, ex:ex });
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
   
         if ( !this.expectType_soft('}') )
            this['export.named.list.not.finished'](
                  {s: startc,l: loc, list:list});

         if ( this.lttype === 'Identifier' ) {
           if ( this.ltval !== 'from' )
             this['export.named.not.id.from'](startc,startLoc);

           else this.next();
           if ( !( this.lttype === 'Literal' &&
                  typeof this.ltval ===  STRING_TYPE) )
             this['export.named.source.not.str'](
                   { s:startc,l:startLoc,list:list,end:[endI,li,col] });

           else {
              src = this.numstr();
              endI = src.end;
           }
         }
         else
            if (firstReserved)
              this['export.named.has.reserved'](startc,startLoc,resv);

         endI = this.semiI() || endI;
         semiLoc = this.semiLoc_soft();
         if ( !semiLoc && !this.newLineBeforeLookAhead )
           this['no.semi']('export.named', startc, startLoc); 

         this.foundStatement = !false;
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
             if (context === CONTEXT_DEFAULT ) 
              this['export.default.const.let'](startc,startLoc);
                 
             this.canBeStatement = !false;
             ex = this.parseVariableDeclaration(CONTEXT_NONE);
             break;
               
          case 'class':
             this.canBeStatement = !false;
             ex = this.parseClass(context);
             break;
  
          case 'var':
             this.canBeStatement = !false;
             ex = this.parseVariableDeclaration(CONTEXT_NONE ) ;
             break ;

          case 'function':
             this.canBeStatement = !false;
             ex = this.parseFunc( context, WHOLE_FUNCTION, ANY_ARG_LEN );
             break ;
        }
   }

   if ( context !== CONTEXT_DEFAULT ) {

     if (!ex) this['export.named.no.exports'](startc, startLoc);
     
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
        ex = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE );
        endI = this.semiI();
        endLoc = this.semiLoc_soft(); // TODO: semiLoc rather than endLoc
        if ( !endLoc && !this.newLineBeforeLookAhead )
          this['no.semi']( 'export.named', startc,startLoc);
   }

   this.foundStatement = !false;
   return { type: 'ExportDefaultDeclaration',    
           start: startc,
           loc: { start: startLoc, end: endLoc || ex.loc.end },
            end: endI || ex.end, declaration: core( ex ) };
}; 

},
function(){
this.parseImport = function() {
  if ( !this.canBeStatement)
     this['not.stmt']('import');

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
    if (local === null)
        this['import.no.elem.yet.comma'](startc,startLoc);

    this.next();
  }

  var spStartc = 0, spStartLoc = null;

  switch ( this.lttype ) {   
     case 'op':
       if ( this.ltraw !== '*' )
         this['import.namespace.specifier.not.*'](startc, startLoc);

       else {
         spStartc = this.c - 1;
         spStartLoc = this.locOn(1);
         this.next();
         if ( !this.expectID_soft('as') )
            this['import.namespace.specifier.no.as'](startc, startLoc);

         if (this.lttype !== 'Identifier' )
          this['import.namespace.specifier.local.not.id'](startc,startLoc);

         local = this.validateID(null);
         list.push({ type: 'ImportNamespaceSpecifier',
                    start: spStartc,
                    loc: { start: spStartLoc, end: local.loc.end },
                     end: local.end,
                    local: local  }) ;
       }
       break;

    case '{':
       hasList = !false;
       this.next();
       while ( this.lttype === 'Identifier' ) {
          local = this.id();
          var im = local; 
          if ( this.lttype === 'Identifier' ) {
             if ( this.ltval !== 'as' ) 
               this['import.specifier.no.as'](startc,startLoc);

             this.next();
             if ( this.lttype !== 'Identifier' )
               this['import.specifier.local.not.id'](startc,startLoc);

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

       if ( !this.expectType_soft('}') ) 
          this['import.specifier.list.unfinished'](startc,startLoc);

       break ;
   }
    
   if ( list.length || hasList ) {
      if ( !this.expectID_soft('from') )
         this['import.from'](startc,startLoc);
   }

   if ( !(this.lttype === 'Literal' &&
        typeof this.ltval === STRING_TYPE ))
      this['import.source.is.not.str'](startc, startLoc);

   var src = this.numstr();
   var endI = this.semiI() || src.end, 
       semiLoc = this.semiLoc();

   if ( !semiLoc && !this.newLineBeforeLookAhead )
     this['no.semi']('import',startc,startLoc);
   
   this.foundStatement = !false;
   return { type: 'ImportDeclaration',
           start: startc,
           loc: { start: startLoc, end: semiLoc || src.loc.end  },
            end:  endI , specifiers: list,
           source: src };
}; 

},
function(){
this.err = function(errorType, errorTok, args) {
   if ( has.call(this.errorHandlers, errorType) )
     return this.handleError(this.errorHandlers[errorType], errorTok, args );

   throw new CustomError( createMessage( Errors[errorType], errorTok, args ) );
};


function CustomError(start,li,col,message) {
   this.atChar = start;
   this.atLine = li;
   this.atCol = col;
   this.message = message;

}

CustomError.prototype = Error.prototype;

function createMessage( errorMessage, errorTok, args  ) {
  return errorMessage.replace( /%\{([^\}]*)\}/g,
  function(matchedString, name, matchIndex, wholeString) {
     if ( name.length === 0 )
       throw new Error( "placeholder empty on " + matchIndex + " for [" + errorMessage + "]" );

     if ( !has.call(args, name) )
       throw new Error( "[" + name + "] not found in params " );
     
     return args[name] + "" ;
  }) ;

}
   
this.handleError = function(handlerFunction, errorTok, args ) {
   var output = handlerFunction.call( this, params, coords );
   if ( output ) {
     this.errorHandlerOutput = output;
     return !false;
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
      if ( b0 === -1) this['hex.esc.byte.not.hex']();
      b = toNum(this.src.charCodeAt(++this.c));
      if ( b0 === -1) this['hex.esc.byte.not.hex']();
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
          this['strict.oct.str.esc']();
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
       if (this.tight) this['strict.oct.str.esc']();

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
       this['esc.8.or.9']();
       return;

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
    if (CHAR_u !== this.src.charCodeAt(++this.c) )
      this['u.second.esc.not.u']();

    e = (this.peekUSeq());
  }
//  else this.col--;
  if ( (e < 0x0DC00 || e > 0x0DFFF) )
    this['u.second.not.in.range'](e);

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
      if ( n === - 1 ) this['u.esc.hex']('curly');

      byteVal <<= 4;
      byteVal += n;
      if (byteVal > 0x010FFFF) this['u.curly.not.in.range'](c,byteVal);

      n = l.charCodeAt( ++ c);
    } while (c < e && n !== CHAR_RCURLY);

    if ( n !== CHAR_RCURLY) this['u.curly.is.unfinished'](c);

    this.c = c;
    return byteVal;
  }
 
  n = toNum(l.charCodeAt(c));
  if ( n === -1 ) this['u.esc.hex']('u',c);
  byteVal = n;
  c++ ;
  n = toNum(l.charCodeAt(c));
  if ( n === -1 ) this['u.esc.hex']('u',c);
  byteVal <<= 4; byteVal += n;
  c++ ;
  n = toNum(l.charCodeAt(c));
  if ( n === -1 ) this['u.esc.hex']('u',c);
  byteVal <<= 4; byteVal += n;
  c++ ;
  n = toNum(l.charCodeAt(c));
  if ( n === -1 ) this['u.esc.hex']('u',c);
  byteVal <<= 4; byteVal += n;

  this.c = c;

  return byteVal;
};



},
function(){

this . parseFor = function() {
  this.ensureStmt();
  this.fixupLabels(!false) ;

  var startc = this.c0,
      startLoc = this.locBegin();

  this.next () ;
  if ( !this.expectType_soft ('(' ) )
     this['for.with.no.opening.paren'](startc, startLoc);

  var head = null;
  var headIsExpr = false;

  var y = 0;
  var scopeFlags = this.scopeFlags;

  if ( this.lttype === 'Identifier' ) switch ( this.ltval ) {
     case 'var':
        this.canBeStatement = !false;
        head = this.parseVariableDeclaration(CONTEXT_FOR);
        break;

     case 'let':
        if ( this.v >= 5 ) {
          this.canBeStatement = !false;
          head = this.parseLet(CONTEXT_FOR);
        }

        break;

     case 'const' :

        if ( this.v < 5 )
          this['const.not.in.v5'](startc, startLoc);

        this.canBeStatement = !false;
        head = this. parseVariableDeclaration(CONTEXT_FOR);
           break ;
  }

  if ( head === null ) {
       headIsExpr = !false;
       head = this.parseExpr( CONTEXT_NULLABLE|CONTEXT_ELEM|CONTEXT_FOR ) ;
  }
  else 
     this.foundStatement = false;

  y += this.y;

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
          if (!headIsExpr && head.declarations.length !== 1 )
            this['for.in.or.of.multi'](startc, startLoc,head);

          if ( this.unsatisfiedAssignment )
            this.unsatisfiedAssignment = null;

          if (headIsExpr) this.toAssig(core(head));

          this.next();
          afterHead = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE) ;
          y += this.y;
          if ( ! this.expectType_soft (')') )
              this['for.iter.no.end.paren'](start,startLoc);

          this.scopeFlags |= ( SCOPE_BREAK|SCOPE_CONTINUE );
          nbody = this.parseStatement(!false);
          y += this.y;
          if ( !nbody ) this['null.stmt']('for.iter',startc,startLoc);

          this.scopeFlags = scopeFlags;

          this.foundStatement = !false;
 
          this.y = y;
          return { type: kind, loc: { start: startLoc, end: nbody.loc.end },
            start: startc, end: nbody.end, right: core(afterHead), left: core(head), body: nbody, y: y };

       default:
          return this['for.iter.not.of.in'](startc, startLoc);
    }
  }

  if ( this.unsatisfiedAssignment )
    this['for.simple.head.is.unsatisfied'](startc,startLoc);

/*
  if ( head && !headIsExpr ) {
    head.end = this.c;
    head.loc.end = { line: head.loc.end.line, column: this.col };
  }
*/
  if ( !this.expectType_soft (';') )
      this['for.simple.no.init.comma'](startc,startLoc);

  afterHead = this.parseExpr(CONTEXT_NULLABLE );
  y += this.y;
  if ( ! this.expectType_soft (';') )
      this['for.simple.no.test.comma'](startc,startLoc);

  var tail = this.parseExpr(CONTEXT_NULLABLE );
  y += this.y;

  if ( ! this.expectType_soft (')') )
      this['for.simple.no.end.paren'](startc,startLoc);

  this.scopeFlags |= ( SCOPE_CONTINUE|SCOPE_BREAK );
  nbody = this.parseStatement(! false);
  if ( !nbody )
    this['null.stmt']('for.simple', startc, startLoc);  

  y += this.y;
  this.scopeFlags = scopeFlags;

  this.y = y;

  this.foundStatement = !false;
  return { type: 'ForStatement', init: head && core(head), start : startc, end: nbody.end,
         test: afterHead && core(afterHead),
         loc: { start: startLoc, end: nbody.loc.end },
          update: tail && core(tail),
         body: nbody, y: y };
};



},
function(){
this .parseArgs  = function (argLen) {
  var list = [], elem = null;

  if ( !this.expectType_soft('(') )
     this['func.args.no.opening.paren']();

  var firstNonSimpArg = null;
  while ( list.length !== argLen ) {
    elem = this.parsePattern();
    if ( elem ) {
       if ( this.lttype === 'op' && this.ltraw === '=' ) {
         elem = this.parseAssig(elem);
         this.scope.makeComplex();
       }

       if ( !firstNonSimpArg && elem.type !== 'Identifier' )
             firstNonSimpArg =  elem;

       list.push(elem);
    }
    else
       break ;
    
    if ( this.lttype === ',' )
       this.next();
    else
        break ;
 
  }
  if ( argLen === ANY_ARG_LEN ) {
     if ( this.lttype === '...' ) {
        this.scope.makeComplex();
        elem = this.parseRestElement();
        list.push( elem  );
        if ( !firstNonSimpArg )
              firstNonSimpArg = elem;
     }
  }
  else {
     if ( list.length !== argLen )
       this['func.args.not.enough'](argLen);
  }

  if ( ! this.expectType_soft (')') )
    this['func.args.no.end.paren'](argLen);

  if ( firstNonSimpArg )
     this.firstNonSimpArg = firstNonSimpArg ;
 
  return list;
};

this .parseFunc = function(context, argListMode, argLen ) {
  var canBeStatement = false, startc = this.c0, startLoc = this.locBegin();
  var prevLabels = this.labels;
  var prevStrict = this.tight;
  var prevScopeFlags = this.scopeFlags;
  var prevYS = this.firstYS ;
  var prevNonSimpArg = this.firstNonSimpArg;

  if ( !this.canBeStatement )
    this.scopeFlags = 0; //  FunctionExpression's BindingIdentifier can be 'yield', even when in a *

  var isGen = false;

  var currentFuncName = null;

  if ( argListMode & WHOLE_FUNCTION ) {
     if ( canBeStatement = this.canBeStatement )
          this.canBeStatement = false;

     this.next();

     if ( this.lttype === 'op' && this.ltraw === '*' ) {
          isGen = !false;
          this.next();
     }
     if ( canBeStatement && context !== CONTEXT_DEFAULT  )  {
        if ( this.lttype !== 'Identifier' )
          this['missing.name']('func', startc, startLoc);

        this.scope.setDeclMode(DECL_MODE_VAR);
        currentFuncName = this.parsePattern();
        if ( this.tight && arguments_or_eval(currentFuncName.name) )
          this['binding.to.eval.or.arguments']('func', startc, startLoc);
     }
     else if ( this. lttype === 'Identifier' ) {
        this.enterLexicalScope(false);
        this.scope.synth = true;
        this.scope.setDeclMode(DECL_MODE_VAR);
        currentFuncName = this.parsePattern();
        if ( this.tight && arguments_or_eval(currentFuncName.name) )
          this['binding.to.eval.or.arguments']('func', startc, startLoc);
     }
     else
        currentFuncName = null;
  }
  else if ( argListMode & ARGLIST_AND_BODY_GEN )
     isGen = !false; 

  if ( this.scopeFlags )
       this.scopeFlags = 0;

  this.enterFuncScope(canBeStatement);
  this.scope.setDeclMode(DECL_MODE_FUNCTION_PARAMS);
  var argList = this.parseArgs(argLen) ;
  this.scope.setDeclMode(DECL_MODE_NONE);
  this.tight = this.tight || argListMode !== WHOLE_FUNCTION;
  this.scopeFlags = SCOPE_FUNCTION;
  if ( argListMode & METH_FUNCTION )
    this.scopeFlags |= SCOPE_METH;
  
  else if ( argListMode & CONSTRUCTOR_FUNCTION )
    this.scopeFlags |= SCOPE_CONSTRUCTOR;

  if ( isGen ) this.scopeFlags |= SCOPE_YIELD;
   
  var nbody = this.parseFuncBody(context);
  var n = { type: canBeStatement ? 'FunctionDeclaration' : 'FunctionExpression',
            id: currentFuncName,
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
  this.tight = prevStrict;
  this.scopeFlags = prevScopeFlags;
  this.firstYS = prevYS;
  this.firstNonSimpArg = prevNonSimpArg;

  this.y = 0;

  this.exitScope();
  return  n  ;
};

this.parseFuncBody = function(context) {
  var elem = null;
  
  if ( this.lttype !== '{' ) {
    elem = this.parseNonSeqExpr(PREC_WITH_NO_OP, context|CONTEXT_NULLABLE);
    if ( elem === null )
      return this['func.body.is.empty.expr'](context);

    return elem;
  }

  var startc= this.c - 1, startLoc = this.locOn(1);
  var list = [];
  this.next() ;
  elem = this.parseStatement(!false);

  if ( !this.tight && this.v > 5 && elem && 
       elem.type === 'ExpressionStatement' && elem.expression.type === 'Literal' )
       switch (this.src.slice(elem.expression.start,elem.expression.end) )  {
           case "'use strict'":
           case '"use strict"':
              this.makeStrict();
       }

  while ( elem ) { list.push(elem); elem = this.parseStatement(!false); }
  var n = { type : 'BlockStatement', body: list, start: startc, end: this.c,
           loc: { start: startLoc, end: this.loc() } };

  if ( ! this.expectType_soft ( '}' ) )
      this['func.body.is.unfinished'](n);

  return  n;
};

this . makeStrict  = function() {
   if ( this.firstNonSimpArg )
     return this['func.strict.non.simple.param']()  ; 

   if ( this.tight ) return;

   this.tight = !false;
   this.scope.strict = true;

   var a = null, argNames = this.scope.paramNames;
   for ( a in argNames ) {
        if ( argNames[a] !== null )
          this['func.args.has.dup'](argNames[a]);

        a = a.substring(0,a.length-1) ;
        this.assert(!arguments_or_eval(a));
        this.validateID(a);
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

             if (this.tight ) this['strict.let.is.id']();

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
            if ( this.canBeStatement ) {
              this.foundStatement = !false;
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
            if (this.v<5) this['const.not.in.v5']() ;
            return this.parseVariableDeclaration(CONTEXT_NONE);

        case 'throw': return this.parseThrowStatement();
        case 'while': return this.parseWhileStatement();
        case 'yield': 
             if ( this.scopeFlags & SCOPE_YIELD ) {
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
            this.isVDT = !false;
            return null;

        case 'export': 
            if ( this.isScript ) this['export.not.in.module']();

            return this.parseExport() ;

        case 'import':
            if ( this.isScript ) this['import.not.in.module'](context);

            return this.parseImport();

        case 'return': return this.parseReturnStatement();
        case 'switch': return this.parseSwitchStatement();
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
        case 'function': return this.parseFunc(context&CONTEXT_FOR, WHOLE_FUNCTION, ANY_ARG_LEN );
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
         if (CHAR_u !== src.charCodeAt(c) )
           this['id.slash.no.u'](c);

         peek = this. peekUSeq() ;
         if (peek >= 0x0D800 && peek <= 0x0DBFF ) {
           this.c++;
           byte2 = this.peekTheSecondByte();
           if (!isIDBody(((peek-0x0D800)<<10) + (byte2-0x0DC00) + 0x010000) )
             this['id.multi.must.be.idbody'](peek,byte2,c);

           v += String.fromCharCode(peek, byte2);
         }
         else {
            if ( !isIDBody(peek) )
               this['id.esc.must.be.idbody'](peek,c);
       
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
         if (!isIDBody(((peek-0x0D800 ) << 10) + (byte2-0x0DC00) + 0x010000) )
           this['id.multi.must.be.idbody'](peek,byte2,c);

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

// this function is only calld when we have a 'let' at the start of an statement,
// or else when we have a 'let' at the start of a for's init; so, CONTEXT_FOR means "at the start of a for's init ",
// not 'in for'
 
  var startc = this.c0, startLoc = this.locBegin();
  var c = this.c, li = this.li, col = this.col;

  var letDecl = this.parseVariableDeclaration(context);

  if ( letDecl )
    return letDecl;

  if (this.tight)
    this['strict.let.is.id'](startc,startLoc);

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
this .memberID = function() { return this.v > 5 ? this.id() : this.validateID(null) ; };
this .memberExpr = function() {
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next() ;
  var e = this.parseExpr(CONTEXT_NONE);
  if (!e) this['prop.dyna.no.expr'](startc,startLoc);

  var n = { type: PAREN, expr: e, start: startc, end: this.c, loc: { start: startLoc, end: this.loc() } } ;
  if ( !this.expectType_soft (']') )
        this['prop.dyna.is.unfinished'](n);
 
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
  var y = 0; // newHead is itself an exprHead; an exprHead is always called at the start of a nonSeqExpr,
             // where this.y is set 0
  switch (this  .lttype) {
    case 'Identifier':
       head = this.parseIdStatementOrId (CONTEXT_NONE);
       this.scope.reference(head.name);
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
       this['new.head.is.not.valid'](startc, startLoc);

  }

  y = this.y;

  var inner = core( head ) ;
  while ( !false ) {
    switch (this. lttype) {
       case '.':
          this.next();
          elem = this.memberID();
          head =   {  type: 'MemberExpression', property: elem, start: head.start, end: elem.end,
                      loc: { start: head.loc.start, end: elem.loc.end }, object: inner, computed: false, y: y };
          inner = head;
          continue;

       case '[':
          this.next() ;
          elem = this.parseExpr(CONTEXT_NONE) ;
          y += this.y;
          head =  { type: 'MemberExpression', property: core(elem), start: head.start, end: this.c,
                    loc: { start : head.loc.start, end: this.loc() }, object: inner, computed: !false, y: y };
          inner = head ;
          if ( !this.expectType_soft (']') )
            this['mem.unfinished'](startc,startLoc);
 
          continue;

       case '(':
          elem = this. parseArgList();
          y += this.y;
          inner = { type: 'NewExpression', callee: inner, start: startc, end: this.c,
                    loc: { start: startLoc, end: this.loc() }, arguments: elem, y: y };
          if ( !this. expectType_soft (')') )
            this['new.args.is.unfinished'](startc,startLoc);

          this.y = y;
          return inner;

       case '`' :
           this.y = 0;
           elem = this.parseTemplateLiteral () ;
           y += this.y;
           head = {
                type : 'TaggedTemplateExpression' ,
                quasi :elem ,
                start: head.start,
                 end: elem.end,
                loc : { start: head.loc.start, end: elem.loc.end },
                tag : inner,
                y: y
            };
            inner = head;
            continue ;

        default:
            this.y = y;
            return { type: 'NewExpression', callee: inner, start: startc, end: head.end,
                 loc: { start: startLoc, end: head.loc.end }, arguments : [], y: y };

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
               return this['id.u.not.after.slash']();
            
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
              if ( mustBeAnID === 1 ) return this['id.esc.must.be.idhead'](peek);
              else return this['id.multi.must.be.idhead'](peek,r);
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
     var noNewLine = !false,
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
      return !false;
  }

  return false;
};

this.expectID_soft = function (n) {
  if (this.lttype === 'Identifier' && this.ltval === n) {
     this.next();
     return !false;
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
    var y = this.y;
    var e = [core(head)] ;
    do {
      this.next() ;
      lastExpr = this.parseNonSeqExpr(PREC_WITH_NO_OP,context);
      y += this.y;
      e.push(core(lastExpr));
    } while (this.lttype === ',' ) ;

    this.y = y;
    return  { type: 'SequenceExpression', expressions: e, start: head.start, end: lastExpr.end,
              loc: { start : head.loc.start, end : lastExpr.loc.end}, y: y };
  }

  return head ;
};

this .parseCond = function(cond,context ) {
    var y = this.y;
    this.next();
    var seq = this. parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE ) ;
    y += this.y;
    if ( !this.expectType_soft (':') )
      this['cond.colon']();

    var alt = this. parseNonSeqExpr(PREC_WITH_NO_OP, context ) ;
    y += this.y;
    this.y = y;
    return { type: 'ConditionalExpression', test: core(cond), start: cond.start , end: alt.end ,
             loc: { start: cond.loc.start, end: alt.loc.end }, consequent: core(seq), alternate: core(alt), y: y };
};

this .parseUnaryExpression = function(context ) {
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
  var arg = this. parseNonSeqExpr(PREC_U,context|CONTEXT_UNASSIGNABLE_CONTAINER );

  return { type: 'UnaryExpression', operator: u, start: startc, end: arg.end,
           loc: { start: startLoc, end: arg.loc.end }, prefix: !false, argument: core(arg), y: this.y };
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

       if ( !this.ensureSimpAssig_soft (core(arg)) )
         this['incdec.pre.not.simple.assig'](c,loc,arg);

       return { type: 'UpdateExpression', argument: core(arg), start: c, operator: u,
                prefix: !false, end: arg.end, loc: { start: loc, end: arg.loc.end }, y: this.y };
    }

    if ( !this.ensureSimpAssig_soft(core(arg)) )
       this['incdec.post.not.simple.assig'](arg);

    c  = this.c;
    loc = { start: arg.loc.start, end: { line: this.li, column: this.col } };
    this.next() ;
    return { type: 'UpdateExpression', argument: core(arg), start: arg.start, operator: u,
             prefix: false, end: c, loc: loc, y: this.y };

};

this .parseO = function(context ) {

    switch ( this. lttype ) {

      case 'op': return !false;
      case '--': return !false;
      case '-': this.prec = PREC_ADD_MIN; return !false;
      case '/':
           if ( this.src.charCodeAt(this.c) === CHAR_EQUALITY_SIGN ) {
             this.c++ ;
             this.prec = PREC_OP_ASSIG;
             this.ltraw = '/=';
             this.col++; 
           }
           else
              this.prec = PREC_MUL ; 

           return !false;

      case 'Identifier': switch ( this. ltval ) {
         case 'instanceof':
           this.prec = PREC_COMP  ;
           this.ltraw = this.ltval ;
           return !false;

         case 'of':
         case 'in':
            if ( context & CONTEXT_FOR ) break ;
            this.prec = PREC_COMP ;
            this.ltraw = this.ltval;
            return !false;
     }
     break;

     case '?': this .prec = PREC_COND  ; return !false;
   }

   return false ;
};

this.parseNonSeqExpr = function (prec, context  ) {
    var firstUnassignable = null, firstParen = null;

    this.y = 0;
    var head = this. parseExprHead(context);
    var y = this.y;

    if ( head === null ) {
         switch ( this.lttype ) {
           case 'u':
           case '-':
              head = this. parseUnaryExpression(context & CONTEXT_FOR );
              y += this.y;
              break ;

           case '--':
              head = this. parseUpdateExpression(null, context&CONTEXT_FOR );
              y += this.y;
              break ;

           case 'yield':
              if (prec !== PREC_WITH_NO_OP) // make sure there is no other expression before it 
                return this['yield.as.an.id']();

              return this.parseYield(context); // everything that comes belongs to it
   
           default:
              if (!(context & CONTEXT_NULLABLE) )
                return this['nexpr.null.head']();
               
              return null;
         }
    }
    else if ( prec === PREC_WITH_NO_OP ) {
      firstParen = head. type === PAREN ? head.expr : this.firstParen ;      
      firstUnassignable = this.firstUnassignable;
    }   

    var op = false;
    while ( !false ) {
       op = this. parseO( context );
       if ( op && isAssignment(this.prec) ) {
         this.firstUnassignable = firstUnassignable;
         if ( prec === PREC_WITH_NO_OP ) {
            head =  this. parseAssignment(head, context );
            y = this.y;
         }
         else
            this['assig.not.first']();

         break ;
       }
       else {
         if ( this.unsatisfiedArg ) 
           this['arrow.paren.no.arrow'](); 

         if ( this.firstEA )
            if( !(context & CONTEXT_ELEM_OR_PARAM) || op )
              this['assig.to.eval.or.arguments']();

         if ( this.unsatisfiedAssignment ) {
            if ( !(prec===PREC_WITH_NO_OP && (context & CONTEXT_ELEM_OR_PARAM ) ) )
              this['assignable.unsatisfied']();

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
          y = this.y;
          break ;
       }

       if ( this. prec < prec ) break ;
       if ( this. prec  === prec && !isRassoc(prec) ) break ;

       var o = this.ltraw;
       var currentPrec = this. prec;
       this.next();
       var right = this.parseNonSeqExpr(currentPrec, (context & CONTEXT_FOR)|CONTEXT_UNASSIGNABLE_CONTAINER );
       y += this.y;
       head = { type: !isBin(currentPrec )  ? 'LogicalExpression' :   'BinaryExpression',
                operator: o,
                start: head.start,
                end: right.end,
                loc: {
                   start: head.loc.start,
                   end: right.loc.end
                },
                left: core(head),
                right: core(right),
                y: y
              };
    }
  
    if ( prec === PREC_WITH_NO_OP ) {
      this.firstParen = firstParen ;
      this.firstUnassignable = firstUnassignable;
    }

    this.y = y;
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
         if (c >= len) this['num.with.no.digits']('hex', c);
         b = src.charCodeAt(c);
         if ( ! isHex(b)) this['num.with.first.not.valid']('hex', c);
         c++;
         while ( c < len && isHex( b = src.charCodeAt(c) ) )
             c++ ;
         this.ltval = parseInt( this.ltraw = src.slice(this.c,c) ) ;
         this.c = c;
         return;

      case CHAR_B: case CHAR_b:
        ++c;
        if (c >= len ) this['num.with.no.digits']('bin',c);
        b = src.charCodeAt(c);
        if ( b !== CHAR_0 && b !== CHAR_1) this['num.with.first.not.valid']('bin',c);
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
        return;

      case CHAR_O: case CHAR_o:
        ++c;
        if (c >= len ) this['num.with.no.digits']('oct',c); 
        b = src.charCodeAt(c);
        if ( (b < CHAR_0 || b >= CHAR_8) ) this['num.with.first.not.valid']('oct',c) ;

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
        return;

      default:
        if ( b >= CHAR_0 && b <= CHAR_9 ) {
          if ( this.tight ) this['num.legacy.oct']();
          var base = 8;
          do {
            if ( b >= CHAR_8 && base === 8 ) base = 10 ;
            c ++;
          } while ( c < len &&
                  ( b = src.charCodeAt(c), b >= CHAR_0 && b <= CHAR_9) );
          
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
    while (c < len && num(src.charCodeAt(c))) c++ ;
    this.c = c;
    if ( this.frac(b) )
       return;
    else
       this.ltval = parseInt(this.ltraw = src.slice(b, this.c)  ) ;

    this.c = c;
  }
  
  if ( ( c < len && isIDHead(src.charCodeAt(c))) ) this['num.idhead.tail']() ; // needless
};

this . frac = function(n) {
  var c = this.c,
      l = this.src,
      e = l.length ;
  if ( n === -1 || l.charCodeAt(c)=== CHAR_SINGLEDOT )
     while( ++c < e && Num(l.charCodeAt (c)))  ;

  switch(l.charCodeAt(c)){
      case CHAR_E:
      case CHAR_e:
        c++;
        switch(l.charCodeAt(c)){case CHAR_MIN: case CHAR_ADD: c++ ; }
        while ( c < e && Num(l.charCodeAt( c) )) c++ ;
  }
  if ( c === this.c ) return false  ;
  this.ltraw = l.slice (n === -1 ? this.c - 1 : n, c);
  this.ltval =  parseFloat(this.ltraw )  ;
  this.c = c ;
  return ! false   ;
}



},
function(){

this .parseMeth = function(name, isClass) {
   var val = null; 
   var y = this.y;

   if ( !isClass ) {
     val = this.parseFunc(CONTEXT_NONE,ARGLIST_AND_BODY,ANY_ARG_LEN );
     this.y = y;
     return { type: 'Property', key: core(name), start: name.start, end: val.end,
              kind: 'init', computed: name.type === PAREN,
              loc: { start: name.loc.start, end : val.loc.end },
              method: !false, shorthand: false, value : val, y: y };
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

   val = this.parseFunc(CONTEXT_NONE ,
      ARGLIST_AND_BODY|(kind !== 'constructor' ? METH_FUNCTION : CONSTRUCTOR_FUNCTION), ANY_ARG_LEN ); 

   this.y = y;
   return { type: 'MethodDefinition', key: core(name), start: name.start, end: val.end,
            kind: kind, computed: name.type === PAREN,
            loc: { start: name.loc.start, end: val.loc.end },
            value: val,    'static': false, y: y };
};

this .parseGen = function(isClass ) {
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next();
  var name = null;
  var y = 0;

  switch ( this.lttype ) {
     case 'Identifier':
        if (isClass && this.ltval === 'constructor' )
         this['class.mem.name.is.ctor']('gen',startc,startLoc);

        name = this.memberID();
        break ;

     case '[':
        this.y = 0;
        name = this.memberExpr();
        y = this.y;
        break ;

     case 'Literal' :
        if ( isClass && this.ltval === 'constructor' )
          this['class.mem.name.is.ctor']('gen',startc,startLc);
        name = this.numstr();
        break ;

     default:
        return this['class.or.obj.mem.name'](isClass,startc,startLoc);
  }

  var val = null;

  if ( !isClass ) {
     val  =  this.parseFunc ( CONTEXT_NONE, ARGLIST_AND_BODY_GEN, ANY_ARG_LEN );

     this.y = y;
     return { type: 'Property', key: core(name), start: startc, end: val.end,
              kind: 'init', computed: name.type === PAREN,
              loc: { start: startLoc , end : val.loc.end },
              method: !false, shorthand: false, value : val, y: y };
  }

  val = this.parseFunc(  CONTEXT_NONE , ARGLIST_AND_BODY_GEN|METH_FUNCTION, ANY_ARG_LEN );

  this.y = y;
  return { type: 'MethodDefinition', key: core(name), start: startc, end: val.end,
           kind: 'method', computed: name.type === PAREN,
           loc : { start: startLoc, end: val.loc.end },    'static': false, value: val, y: y };
};

this . parseSetGet= function(isClass) {
  var startc = this.c0,
      startLoc = this.locBegin();

  var c = this.c, li = this.li, col = this.col;

  var kind = this.ltval;
  this.next();

  var strName = null;
  var name = null;

  var y = 0;
  switch ( this.lttype ) {
      case 'Identifier':
         if (isClass) strName = this.ltval;
         name = this.memberID();
         break;
      case '[':
         name = this.memberExpr();
         y = this.y;
         break;
      case 'Literal':
         if (isClass) strName = this.ltval;
         name = this.numstr();
         break ;
      default: // get or set represent actual names 
           name = { type: 'Identifier', name: this.ltval, start: startc,  end: c,
                   loc: { start: startLoc, end: { line: li, column: col } } };

           this.y = 0;
           return !isClass ? this.parseProperty(name) : this.parseMeth(name, !isClass) ;
  }

  var val = null;
  if ( !isClass ) {
       val = this.parseFunc ( CONTEXT_NONE, ARGLIST_AND_BODY, kind === 'set' ? 1 : 0 ); 
       this.y = y;
       return { type: 'Property', key: core(name), start: startc, end: val.end,
             kind: kind, computed: name.type === PAREN,
             loc: { start: startLoc, end: val.loc.end }, method: false,
             shorthand: false, value : val, y: y };
  }
  
  if ( strName === 'constructor' )
    this['class.mem.name.is.ctor'](kind, startc, startLoc);

  val = this.parseFunc ( CONTEXT_NONE , ARGLIST_AND_BODY|METH_FUNCTION, kind === 'set' ? 1 : 0 )

  this.y = y;
  return { type: 'MethodDefinition', key: core(name), start: startc, end: val.end,
           kind: kind, computed: name.type === PAREN,
           loc : { start: startLoc, end: val.loc.end }, 'static': false, value: val, y: y };
};



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

  if ( context & CONTEXT_UNASSIGNABLE_CONTAINER ) 
    context = context & CONTEXT_PARAM;

  else
    context = context & CONTEXT_PARAM|CONTEXT_ELEM;

  var y = 0;

  do {
     this.next();
     this.unsatisfiedAssignment = null;
  
     this.first__proto__ = first__proto__;
     this.firstEA = null;
     this.firstElemWithYS = null;

     elem = this.parseProperty(null,context);

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
       y += this.y;

       if (!unsatisfiedAssignment && this.unsatisfiedAssignment ) {
           if (!( context & CONTEXT_ELEM)  ) this['assig.unsatisfied']() ;
           unsatisfiedAssignment =  this.unsatisfiedAssignment ;
       }
       
       if ( !firstParen && this.firstParen )
             firstParen =  this.firstParen ;

       if ( !firstUnassignable && this.firstUnassignable )
             firstUnassignable =  this.firstUnassignable ;

       if ( !firstYS && this.firstYS )
         firstYS = this.firstYS;

     }
     else
        break ;

  } while ( this.lttype === ',' );

  this.y = y;
  elem = { properties: list, type: 'ObjectExpression', start: startc,
     end: this.c , loc: { start: startLoc, end: this.loc() }, y: y };

  if ( ! this.expectType_soft ('}') )
    this['obj.unfinished'](elem);

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

  return elem;
};

this.parseProperty = function (name, context) {

  var __proto__ = false, first__proto__ = this.first__proto__ ;
  var val = null;
  
  var y = 0;
  SWITCH:
  if ( name === null ) switch ( this.lttype  ) {
      case 'op':
         return this.ltraw === '*' ? this.parseGen(OBJ_MEM) : null;

      case 'Identifier': switch ( this.ltval ) {
         case 'get':
            return this.parseSetGet(OBJ_MEM);
         case 'set':
            return this.parseSetGet(OBJ_MEM);

         case '__proto__':
            __proto__ = !false;

         default:
            name = this.memberID();
            break SWITCH;
      }
      case 'Literal':
            if ( this.ltval === '__proto__' )
               __proto__ = !false;
 
            name = this.numstr();
            break SWITCH;

      case '[':
            this.y = 0;
            name = this.memberExpr();
            y += this.y;
            break SWITCH;

      default: return null;
  }

  this.firstUnassignable = this.firstParen = null;

  switch (this.lttype) {
      case ':':
         if ( __proto__ && first__proto__ ) this['obj.proto.has.dup'](name, first__proto__ ) ;

         this.next();
         this.y = 0;
         val = this.parseNonSeqExpr ( PREC_WITH_NO_OP, context )  ;
         y += this.y;
         val = { type: 'Property', start: name.start, key: core(name), end: val.end,
                  kind: 'init', loc: { start: name.loc.start, end: val.loc.end }, computed: name.type === PAREN ,
                  method: false, shorthand: false, value: core(val), y: y };
         if ( __proto__ )
            this.first__proto__ = val;

         this.y = y;
         return val;

      case '(':
         return this.parseMeth(name, OBJ_MEM);

      default:
          if (name.type !== 'Identifier' ) this['obj.prop.assig.not.id'](name);

          if ( this.lttype === 'op' ) {
             if (this.ltraw !== '=' ) this['obj.prop.assig.not.assigop'](name);
             if (!(context & CONTEXT_ELEM) ) this['obj.prop.assig.not.allowed'](name);

             val = this.parseAssig(name);
             this.unsatisfiedAssignment = val;
          }
          else
             val = name;

          return { type: 'Property', key: name, start: val.start, end: val.end,
                    loc: val.loc, kind: 'init',  shorthand: !false, method: false,
                   value: val, computed: false, y: 0 };
  }

       return n   ;
};



},
function(){

this.parsePattern = function() {
  this.y = 0; 
  switch ( this.lttype ) {
    case 'Identifier' :
       var id = this.validateID(null);
       this.scope.parserDeclare(id);
 
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

  var y = 0;

  this.next();
  while ( !false ) {
      elem = this.parsePattern();
      if ( elem ) {
         y += this.y;
         if ( this.lttype === 'op' && this.ltraw === '=' ) {
           elem = this.parseAssig(elem);
           y += this.y; 
         }
      }
      else {
         if ( this.lttype === '...' ) {
           list.push(this.parseRestElement());
           y += this.y;
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
           start: startc, end: this.c, elements : list, y: y };

  this.y = y;

  if ( !this. expectType_soft ( ']' ) )
     this['pat.array.is.unfinished'](elem);

  return elem;
};

this.parseObjectPattern  = function() {

    var sh = false;
    var startc = this.c-1;
    var startLoc = this.locOn(1);
    var list = [];
    var val = null;
    var name = null;

    var yObj = 0, yProp = 0;
    this.enterComplex();

    LOOP:
    do {
      sh = false;
      yProp = 0;
      this.next ()   ;
      switch ( this.lttype ) {
         case 'Identifier':
            name = this.memberID();
            if ( this.lttype === ':' ) {
              this.next();
              val = this.parsePattern()
              yProp += this.y;
            }
            else { sh = !false; val = name; }
            break ;

         case '[':
            name = this.memberExpr();
            yProp = this.y;
            this.expectType(':');
            val = this.parsePattern();
            yProp += this.y;
            break ;

         case 'Literal':
            name = this.numstr();
            this.expectType(':');
            val = this.parsePattern();
            yProp += this.y;
            break ;

         default:
            break LOOP;
      }
      if ( this.lttype === 'op' && this.ltraw === '=' ) {
        val = this.parseAssig(val);
        yProp += this.y;
      }

      yObj += yProp;
      list.push({ type: 'Property', start: name.start, key: core(name), end: val.end,
                  loc: { start: name.loc.start, end: val.loc.end },
                 kind: 'init', computed: name.type === PAREN, value: val,
               method: false, shorthand: sh, y: yProp });

    } while ( this.lttype === ',' );

    var n = { type: 'ObjectPattern',
             loc: { start: startLoc, end: this.loc() },
             start: startc,
              end: this.c,
              properties: list, y: yObj };

    this.y = yObj;
    if ( ! this.expectType_soft ('}') ) this['pat.obj.is.unfinished'](n);

    return n;
};

// this need not enter complex mode by itself, because the head has already been taken care of
this .parseAssig = function (head) {
    this.next() ;
    var y = this.y;
    var e = this.parseNonSeqExpr( PREC_WITH_NO_OP, CONTEXT_NONE );
    return { type: 'AssignmentPattern', start: head.start, left: head, end: e.end,
           right: core(e), loc: { start: head.loc.start, end: e.loc.end }, y: y + this.y };
};

// this need not enter complex mode by itself too, because can occur in either an obj- or an arr-pattern,
// which are themselves already complex, or it can directly be a param, in which case the `this.enterComplexMode()` thing is called
// on site.
this.parseRestElement = function() {
   var startc = this.c-1-2,
       startLoc = this.locOn(1+2);

   this.next ();
   var e = this.parsePattern();
   if (!e ) this['rest.has.no.arg'](starc, startLoc);

   return { type: 'RestElement', loc: { start: startLoc, end: e.loc.end }, start: startc, end: e.end,argument: e, y: this.y };
};



},
function(){
this.parseExprHead = function (context) {
  var firstUnassignable = null;
  var firstParen = null;

  var head = null;
  var inner = null;
  var elem = null;

  var y = 0;

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
            y += this.y;
            if ( this. unsatisfiedAssignment ) {
               this.y = y;
               return head ;
            }

            firstUnassignable = this.firstUnassignable;
            firstParen = this.firstParen;

            break ;

        case '(' :
            this.arrowParen = !false;
            head = this. parseParen() ;
            y += this.y;
            if ( this.unsatisfiedArg ) {
               this.y = y;
               return head ;
            }

            break ;

        case '{' :
            this.firstUnassignable = this.firstParen = null;

            head = this. parseObjectExpression(
              context & (CONTEXT_UNASSIGNABLE_CONTAINER|CONTEXT_PARAM) ) ;
            y += this.y;
            if ( this.unsatisfiedAssignment ) {
              this.y = y;
              return head;
            }

            firstUnassignable = this.firstUnassignable;
            firstParen = this.firstParen;

            break ;

        case '/' :
            head = this. parseRegExpLiteral () ;
            break ;

        case '`' :
            head = this. parseTemplateLiteral () ;
            y += head.y;
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
       this['contains.assigned.eval.or.arguments']();
  }
     
  if (head.type === 'Identifier')
    this.scope.reference(head.name);

  inner = core( head ) ;

  LOOP:
  while ( !false ) {
     switch (this.lttype ) {
         case '.':
            this.next();
            elem  = this.memberID();
            this.assert(elem);
            head = {  type: 'MemberExpression', property: elem, start: head.start, end: elem.end,
                      loc: { start: head.loc.start, end: elem.loc.end }, object: inner, computed: false, y: y };
            inner =  head ;
            continue;

         case '[':
            this.next() ;
            elem   = this. parseExpr(PREC_WITH_NO_OP,CONTEXT_NONE ) ;
            y += this.y;
            head =  { type: 'MemberExpression', property: core(elem), start: head.start, end: this.c,
                      loc : { start: head.loc.start, end: this.loc()  }, object: inner, computed: !false, y: y };
            inner  = head ;
            if ( !this.expectType_soft (']') )
               this['mem.unfinished'](head);

            continue;

         case '(':
            elem  = this. parseArgList() ;
            y += this.y;
            head =  { type: 'CallExpression', callee: inner , start: head.start, end: this.c,
                      arguments: elem, loc: { start: head.loc.start, end: this.loc() }, y: y };
            if ( !this.expectType_soft (')'   ) )
               this['call.args.is.unfinished'](head);

            inner = head  ;
            continue;

          case '`' :
            elem = this. parseTemplateLiteral();
            y += elem.y;
            head = {
                  type : 'TaggedTemplateExpression',
                  quasi : elem,
                  start: head.start,
                   end: elem.end,
                  loc : { start: head.loc.start, end: elem.loc.end },
                  tag : inner,
                  y: y
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

  this.y = y;
  return head ;
} ;

this .parseMeta = function(startc,end,startLoc,endLoc,new_raw ) {
    if ( this.ltval !== 'target' )  
      this['meta.new.has.unknown.prop'](startc,startLoc);

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

this.idLit = function(val) {
  var n = { type: 'Literal', value: val, start: this.c0, end: this.c,
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

  var y = 0;
  while ( !false ) {
     this.firstParen = null;
     this.next() ;
     this.unsatisfiedAssignment = null;
     this.firstEA = null;
     this.firstElemWithYS = null;
     this.y = 0;
     elem =   // unsatisfiedArg ? this.parsePattern() :
            this.parseNonSeqExpr(PREC_WITH_NO_OP, context ) ;

     if ( !elem ) {
        if ( this.lttype === '...' ) {
           if ( ! ( context & CONTEXT_PARAM ) )
              this['paren.has.an.spread.elem']();
 
           elem = this.parseSpreadElement();
           if ( !firstParen && this.firstParen ) firstParen = this.firstParen;
           if ( !firstEA && this.firstEA ) firstEA = this.firstEA;
           if ( !firstElemWithYS && this.firstYS ) {
                 firstElemWithYS = elem;
                 parenYS = this.firstYS;
           }
           if ( !unsatisfiedArg ) unsatisfiedArg = elem;
        }
        break;
     }

     y += this.y;
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
           if ( ! (context & CONTEXT_PARAM) )
             this['paren.with.an.unsatisfied.assig'](startc, startLoc);

           unsatisfiedArg =  this.unsatisfiedAssignment;
     }

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
               loc: { start:  firstElem .loc.start , end: elem.loc.end }, y: y };
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

  if ( ! this.expectType_soft (')') ) this['paren.unfinished'](n);

  this.y = y;
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

    var y = 0;
    do { 
       this.next();
       elem = this.parseNonSeqExpr(PREC_WITH_NO_OP,CONTEXT_NULLABLE ); 
       if ( elem ) {
         y += this.y;
         list.push (core(elem));
       }
       else if ( this.lttype === '...' ) {
         list.push(this.parseSpreadElement());
         y += this.y;
       }
       else
         break ;
    } while ( this.lttype === ',' );

    this.y = y;
    return list ;
};



},
function(){
this.parseProgram = function () {
  var startc = this.c, li = this.li, col = this.col;
  var endI = this.c , startLoc = null;
  this.scope = new ParserScope(this, null, SCOPE_TYPE_MAIN);
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
        
  var n = { type: 'Program', body: list, start: startc, end: endI, sourceType: !this.isScript ? "module" : "script" ,
           loc: { start: startLoc, end: endLoc } };

  if ( !this.expectType_soft ('eof') )
    this['program.unfinished'](n);

  return n;
};



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
               inSquareBrackets = !false;

            break;

         case CHAR_BACK_SLASH:
            ++c;
            break;

         case CHAR_RSQBRACKET:
            if ( inSquareBrackets )
               inSquareBrackets = false;

            break;

         case CHAR_DIV :
            if ( inSquareBrackets )
               break;

            break WHILE;

//       default:if ( o >= 0x0D800 && o <= 0x0DBFF ) { this.col-- ; }
       }

       c++ ;
     }

     if ( src.charCodeAt(c) !== CHAR_DIV ) 
       this['regex.unfinished'](startc,startLoc,c);

     var flags = 0;
     var flagCount = 0;
     WHILE:
     while ( flagCount <= 5 ) {
        switch ( src.charCodeAt ( ++c ) ) {
            case CHAR_g:
                if (flags & gRegexFlag)
                  this['regex.flag.is.dup'](startc,startLoc,c);
                flags |= gRegexFlag; break;
            case CHAR_u:
                if (flags & uRegexFlag)
                  this['regex.flag.is.dup'](startc,startLoc,c);
                flags |= uRegexFlag; break;
            case CHAR_y:
                if (flags & yRegexFlag)
                  this['regex.flag.is.dup'](startc,startLoc,c);
                flags |= yRegexFlag; break;
            case CHAR_m:
                if (flags & mRegexFlag)
                  this['regex.flag.is.dup'](startc,startLoc,c);
                flags |= mRegexFlag; break;
            case CHAR_i:
                if (flags & iRegexFlag)
                  this['regex.flag.is.dup'](startc,startLoc,c);
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

     if ( !val )
       this['regex.not.valid'](startc,startLoc,flagsString,patternString);

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

this.enterComplex = function() {
   if (this.scope.declMode === DECL_MODE_FUNCTION_PARAMS)
     this.scope.makeComplex();
};

this.enterLexicalScope = function(loop) { this.scope = this.scope.spawnLexical(loop); };

this.setDeclModeByName = function(modeName) {
  this.scope.setDeclMode(modeName === 'var' ? DECL_MODE_VAR : DECL_MODE_LET);
};

this.exitScope = function() {
  this.scope.finish();
  this.scope = this.scope.parent;
  if (this.scope.synth)
    this.scope = this.scope.parent;
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
  var head = null, l, e ;
  this.y = 0;
  switch (this.lttype) {
    case '{': return this.parseBlckStatement();
    case ';': return this.parseEmptyStatement() ;
    case 'Identifier':
       this.canBeStatement = !false;
       head = this.parseIdStatementOrId(CONTEXT_NONE);
       if ( this.foundStatement ) {
          this.foundStatement = false ;
          return head;
       }

       break ;

    case 'eof':
      if (!allowNull) this['stmt.null']();

      return null;
  }

  this.assert(head === null) ;
  head = this.parseExpr(CONTEXT_NULLABLE) ;
  if ( !head ) {
    if ( !allowNull ) this['stmt.null']();

    return null;
  }

  if ( head.type === 'Identifier' && this.lttype === ':')
    return this.parseLabeledStatement(head, allowNull);

  this.fixupLabels(false) ;
  e  = this.semiI() || head.end;
  l = this.semiLoc_soft ();
  if ( !l && !this.newLineBeforeLookAhead )
    this['no.semi']('expr', head);
 
  return {
    type : 'ExpressionStatement',
    expression : core(head),
    start : head.start,
    end : e,
    loc : { start : head.loc.start, end : l || head.loc.end },
    y: this.y
  };
};

this . findLabel = function(name) {
    return has.call(this.labels, name) ?this.labels[name]:null;

};

this .parseLabeledStatement = function(label, allowNull) {
   this.next();
   var l = label.name;
   l += '%';
   if ( this.findLabel(l)) this['label.is.a.dup'](label);

   this.labels[l] =
        this.unsatisfiedLabel ?
        this.unsatisfiedLabel :
        this.unsatisfiedLabel = { loop: false };

   var stmt  = this.parseStatement(allowNull);
   this.labels[l] = null;

   return { type: 'LabeledStatement', label: label, start: label.start, end: stmt.end,
            loc: { start: label.loc.start, end: stmt.loc.end }, body: stmt, y: this.y };
};

this .ensureStmt = function() {
   if ( this.canBeStatement ) this.canBeStatement = false;
   else this.assert(false);
};

this .ensureStmt_soft = function() {
   if ( this.canBeStatement ) {
     this.canBeStatement = false;
     return !false;
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
  if ( !this.ensureStmt_soft () ) this['not.stmt']('if');

  this.fixupLabels(false);
  this.enterLexicalScope(false);

  var startc = this.c0,
      startLoc  = this.locBegin();
  this.next () ;
  if ( !this.expectType_soft('(') )
     this['if.has.no.opening.paren'](startc,startLoc);

  var y = 0;
  var cond = core( this.parseExpr(CONTEXT_NONE) );
  y += this.y;

  if ( !this.expectType_soft (')' ) )
     this['if.has.no.closing.paren'](startc,startLoc);

  var scopeFlags = this.scopeFlags ;
  this.scopeFlags |= SCOPE_BREAK; 
  var nbody = this. parseStatement (false);
  y += this.y;
  this.scopeFlags = scopeFlags ;
  var alt = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'else') {
     this.next() ;
     alt = this.parseStatement(!false);
     y += this.y;
  }

  this.foundStatement = !false;
  this.y = y;

  this.exitScope();
  return { type: 'IfStatement', test: cond, start: startc, end: (alt||nbody).end,
     loc: { start: startLoc, end: (alt||nbody).loc.end }, consequent: nbody, alternate: alt, y: y };
};

this.parseWhileStatement = function () {
   this.enterLexicalScope(true);
   if ( ! this.ensureStmt_soft () )
       this['not.stmt']('while');

   this.fixupLabels(!false);

   var startc = this.c0,
       startLoc = this.locBegin();
   this.next();
   if ( !this.expectType_soft ('(') )
      this['while.has.no.opening.paren'](startc,startLoc);
 
   var y = 0;
   var cond = core( this.parseExpr(CONTEXT_NONE) );
   y = this.y;

   if ( !this.expectType_soft (')') )
      this['while.has.no.closing.paren' ](startc,startLoc);

   var scopeFlags = this.scopeFlags;
   this.scopeFlags |= (SCOPE_CONTINUE|SCOPE_BREAK );
   var nbody = this.parseStatement(false);
   y += this.y;
   this.scopeFlags = scopeFlags ;
   this.foundStatement = !false;

   this.y = y;

   this.exitScope();
   return { type: 'WhileStatement', test: cond, start: startc, end: nbody.end,
       loc: { start: startLoc, end: nbody.loc.end }, body:nbody, y: y };
};

this.parseBlckStatement = function () {
  this.fixupLabels(false);
  this.enterLexicalScope(false);
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next();
  var b = this.blck();
  var n = { type: 'BlockStatement', body: b, start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() }, y: this.y };

  if ( !this.expectType_soft ('}' ) )
     this['block.unfinished'](n);

  this.exitScope();
  return n;
};

this.parseDoWhileStatement = function () {
  if ( !this.ensureStmt_soft () )
     this['not.stmt']('do-while');

  this.enterLexicalScope(true);
  this.fixupLabels(!false);

  var startc = this.c0,
      startLoc = this.locBegin() ;
  this.next() ;
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= (SCOPE_BREAK| SCOPE_CONTINUE);
  var nbody = this.parseStatement (!false) ;
  var y = this.y;
  this.scopeFlags = scopeFlags;
  if ( !this.expectID_soft('while') )
     this['do.has.no.while'](startc,startLoc);

  if ( !this.expectType_soft('(') )
     this['do.has.no.opening.paren'](startc,startLoc);

  var cond = core(this.parseExpr(CONTEXT_NONE));
  y += this.y;

  var c = this.c, li = this.li, col = this.col;
  if ( !this.expectType_soft (')') )
     this['do.has.no.closing.paren'](startc,startLoc);

  if (this.lttype === ';' ) {
     c = this.c;
     li = this.li ;
     col = this.col;
     this.next();
  }
 
  this.y = y;

  this.foundStatement = !false;

  this.exitScope();
  return { type: 'DoWhileStatement', test: cond, start: startc, end: c,
          body: nbody, loc: { start: startLoc, end: { line: li, column: col } }, y: y } ;
};

this.parseContinueStatement = function () {
   if ( ! this.ensureStmt_soft   () )
       this['not.stmt']('continue');

   this.fixupLabels(false);
   if (!(this.scopeFlags & SCOPE_CONTINUE) )
      this['continue.not.in.loop']();

   var startc = this.c0, startLoc = this.locBegin();
   var c = this.c, li = this.li, col = this.col;

   this.next() ;

   var name = null, label = null, semi = 0;

   var semiLoc = null;

   if ( !this.newLineBeforeLookAhead && this.lttype === 'Identifier' ) {
       label = this.validateID(null);
       name = this.findLabel(label.name + '%');
       if (!name) this['continue.no.such.label'](label) ;
       if (!name.loop) this['continue.not.a.loop.label'](label);

       semi = this.semiI();
       semiLoc = this.semiLoc_soft();
       if ( !semiLoc && !this.newLineBeforeLookAhead )
          this['no.semi']('continue',startc,startLoc);

       this.foundStatement = !false;
       return { type: 'ContinueStatement', label: label, start: startc, end: semi || label.end,
           loc: { start: startLoc, end: semiLoc || label.loc.end } };
   }
   semi = this.semiI();
   semiLoc = this.semiLoc_soft();
   if ( !semiLoc && !this.newLineBeforeLookAhead )
      this['no.semi']('continue',startc,startLoc);

   this.foundStatement = !false;
   return { type: 'ContinueStatement', label: null, start: startc, end: semi || c,
           loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseBreakStatement = function () {
   if (! this.ensureStmt_soft() )
      this['not.stmt']('break');

   this.fixupLabels(false);
   if (!(this.scopeFlags & SCOPE_BREAK) )
      this['break.not.in.breakable']();

   var startc = this.c0, startLoc = this.locBegin();
   var c = this.c, li = this.li, col = this.col;

   this.next() ;

   var name = null, label = null, semi = 0;

   var semiLoc = null;

   if ( !this.newLineBeforeLookAhead && this.lttype === 'Identifier' ) {
       label = this.validateID(null);
       name = this.findLabel(label.name + '%');
       if (!name) this['break.no.such.label'](label);
       semi = this.semiI();
       semiLoc = this.semiLoc_soft();
       if ( !semiLoc && !this.newLineBeforeLookAhead )
         this['no.semi'](startc,startLoc);

       this.foundStatement = !false;
       return { type: 'BreakStatement', label: label, start: startc, end: semi || label.end,
           loc: { start: startLoc, end: semiLoc || label.loc.end } };
   }
   semi = this.semiI();
   semiLoc = this.semiLoc_soft();
   if ( !semiLoc && !this.newLineBeforeLookAhead )
     this['no.semi'](startc,startLoc,c,li,col,semi,label);

   this.foundStatement = !false;
   return { type: 'BreakStatement', label: null, start: startc, end: semi || c,
           loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseSwitchStatement = function () {
  if ( ! this.ensureStmt_soft () )
      this['not.stmt']('switch');

  this.fixupLabels(false) ;

  var startc = this.c0,
      startLoc = this.locBegin(),
      cases = [],
      hasDefault = false ,
      scopeFlags = this.scopeFlags,
      elem = null;

  this.next() ;
  if ( !this.expectType_soft ('(') )
    this['switch.has.no.opening.paren'](startc,startLoc);

  var switchExpr = core(this.parseExpr(CONTEXT_NONE));
  var y = this.y;
  if ( !this.expectType_soft (')') )
     this['switch.has.no.closing.paren'](startc,startLoc);

  if ( !this.expectType_soft ('{') )
     this['switch.has.no.opening.curly'](startc,stratLoc);

  this.enterLexicalScope(false);
  this.scopeFlags |=  SCOPE_BREAK;
  while ( elem = this.parseSwitchCase()) {
    y += this.y;
    if (elem.test === null) {
       if (hasDefault ) this['switch.has.a.dup.default'](elem);
       hasDefault = !false ;
    }
    cases.push(elem);
  }

  this.scopeFlags = scopeFlags ;
  this.foundStatement = !false;

  var n = { type: 'SwitchStatement', cases: cases, start: startc, discriminant: switchExpr,
            end: this.c, loc: { start: startLoc, end: this.loc() }, y: y };

  this.y = y;
  if ( !this.expectType_soft ('}' ) )
     this['switch.unfinished'](n);

  this.exitScope();
  return n;
};

this.parseSwitchCase = function () {
  var startc,
      startLoc;

  var nbody = null,
      cond  = null;

  var y = 0;
  if ( this.lttype === 'Identifier' ) switch ( this.ltval ) {
     case 'case':
       startc = this.c0;
       startLoc = this.locBegin();
       this.next();
       cond = core(this.parseExpr(CONTEXT_NONE)) ;
       y = this.y;
       break;

     case 'default':
       startc = this.c0;
       startLoc = this.locBegin();
       this.next();
       break ;

     default:
       this.y = y;
       return null;
  }
  else {
     this.y = y;
     return null;
  }

  var c = this.c, li = this.li, col = this.col;
  if ( ! this.expectType_soft (':') )
    this['switch.case.has.no.colon'](startc,startLoc);

  nbody = this.blck();
  y += this.y;
  var last = nbody.length ? nbody[nbody.length-1] : null;

  this.y = y;
  return { type: 'SwitchCase', test: cond, start: startc, end: last ? last.end : c,
     loc: { start: startLoc, end: last ? last.loc.end : { line: li, column: col } }, consequent: nbody, y: y };
};

this.parseReturnStatement = function () {
  if (! this.ensureStmt_soft () )
    this['not.stmt']('return');

  this.fixupLabels(false ) ;

  if ( !( this.scopeFlags & SCOPE_FUNCTION ) )
       this['return.not.in.a.function']();

  var startc = this.c0,
      startLoc = this.locBegin(),
      retVal = null,
      li = this.li,
      c = this.c,
      col = this.col;

  this.next();

  var semi = 0, semiLoc = null;

  var y = 0;
  if ( !this.newLineBeforeLookAhead ) {
     retVal = this.parseExpr(CONTEXT_NULLABLE);
     y = this.y;
  }

  semi = this.semiI();
  semiLoc = this.semiLoc();
  if ( !semiLoc && !this.newLineBeforeLookAhead )
    this['no.semi']('return', startc,startLoc);

  if ( retVal ) {
     this.foundStatement = !false;
     return { type: 'ReturnStatement', argument: core(retVal), start: startc, end: semi || retVal.end,
        loc: { start: startLoc, end: semiLoc || retVal.loc.end }, y: y }
  }

  this.foundStatement = !false;
  return {  type: 'ReturnStatement', argument: retVal, start: startc, end: semi || c,
     loc: { start: startLoc, end: semiLoc || { line: li, column : col } }, y: y };
};

this.parseThrowStatement = function () {
  if ( ! this.ensureStmt_soft () )
      this['not.stmt']('throw');

  this.fixupLabels(false ) ;

  var startc = this.c0,
      startLoc = this.locBegin(),
      retVal = null,
      li = this.li,
      c = this.c,
      col = this.col;

  this.next();

  var semi = 0 , semiLoc = null ;
  if ( this.newLineBeforeLookAhead )
    this['throw.has.newline'](startc,startLoc);

  retVal = this.parseExpr(CONTEXT_NONE);

  semi = this.semiI();
  semiLoc = this.semiLoc();
  if ( !semiLoc && !this.newLineBeforeLookAhead )
     this['no.semi']('throw',startc,startLoc);

  this.foundStatement = !false;
  return {  type: 'ThrowStatement', argument: core(retVal), start: startc, end: semi || retVal.end,
     loc: { start: startLoc, end: semiLoc || retVal.loc.end }, y: this.y };
};

this. parseBlockStatement_dependent = function() {
    var startc = this.c - 1,
        startLoc = this.locOn(1);
    if ( !this.expectType_soft ('{') )
      this['block.dependent.no.opening.curly' ]();

    var b = this.blck();
    var n = { type: 'BlockStatement', body: b, start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() }, y: this.y };
    if ( ! this.expectType_soft ('}') )
      this['block.dependent.is.unfinished' ]( n);

    return n;
};

this.parseTryStatement = function () {
  if ( ! this.ensureStmt_soft () )
      this['not.stmt' ]('try' );

  this.fixupLabels(false);
  var startc = this.c0,
      startLoc = this.locBegin();

  this.next() ;

  this.enterLexicalScope(false);
  var tryBlock = this.parseBlockStatement_dependent();
  this.exitScope();
  var y = this.y;
  
  var finBlock = null, catBlock  = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'catch') {
    catBlock = this.parseCatchClause();
    y += this.y;
  }

  if ( this.lttype === 'Identifier' && this.ltval === 'finally') {
     this.next();
     this.enterLexicalScope(false);
     finBlock = this.parseBlockStatement_dependent();
     this.exitScope();
     y += this.y;
  }

  var finOrCat = finBlock || catBlock;
  if ( ! finOrCat )
    this['try.has.no.tail'](startc,startLoc);

  this.foundStatement = !false;

  this.y = y;
  return  { type: 'TryStatement', block: tryBlock, start: startc, end: finOrCat.end,
            handler: catBlock, finalizer: finBlock, loc: { start: startLoc, end: finOrCat.loc.end }, y: y };
};

this. parseCatchClause = function () {
   var startc = this.c0,
       startLoc = this.locBegin();

   this.next();

   this.enterLexicalScope(false);
   if ( !this.expectType_soft ('(') )
     this['catch.has.no.opening.paren'](startc,startLoc);

   this.scope.setDeclMode(DECL_MODE_LET);

   var catParam = this.parsePattern();
   this.scope.setDeclMode(DECL_MODE_NONE);
   var y = this.y;

   if (this.lttype=='op' && this.ltval=='=') {
     catParam = this.parseAssig(catParam);
     y += this.y;
   }

   if ( !this.expectType_soft (')') )
      this['catch.has.no.end.paren' ] (startc,startLoc);

   var catBlock = this.parseBlockStatement_dependent();
   this.y += y;

   this.exitScope();
   return {
       type: 'CatchClause',
        loc: { start: startLoc, end: catBlock.loc.end },
       start: startc,
       end: catBlock.end,
       param: catParam ,
       body: catBlock, y: this.y
   };
};

this . parseWithStatement = function() {
   if ( !this.ensureStmt_soft () )
      this['not.stmt']('with' );

   if ( this.tight) this['with.strict' ]();
   this.fixupLabels(false);

   var startc = this.c0,
       startLoc = this.locBegin();

   this.next();
   if (! this.expectType_soft ('(') )
      this['with.has.no.opening.paren'] (startc, startLoc);

   var obj = core( this.parseExpr(CONTEXT_NONE) );
   var y = this.y;

   if (! this.expectType_soft (')') )
      this['with.has.no.end.paren'](startc,startLoc,obj );

   var nbody = this.parseStatement(!false);
   this.y += y;

   this.foundStatement = !false;
   return  {
       type: 'WithStatement',
       loc: { start: startLoc, end: nbody.loc.end },
       start: startc,
       end: nbody.end,
       object: obj,
       body: nbody,
       y: this.y
   };
};

this . prseDbg = function () {
  if (! this.ensureStmt_soft () )
     this['not.stmt']('debugger');

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
  else if ( !this.newLineBeforeLookAhead )
     this['no.semi']('debugger', startc,startLoc);

  this.foundStatement = !false;
  return {
     type: 'DebuggerStatement',
      loc: { start: startLoc, end: { line: li, column: col } } ,
     start: startc,
     end: c
   };
}

this.blck = function () { // blck ([]stmt)
  var stmts = [], stmt;
  var y = 0;
  while (stmt = this.parseStatement(!false)) {
     y += this.y; 
     stmts.push(stmt);
  }

  this.y = y;
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
            this['str.newline'](c);
    }
    c++;
  }

  if ( v_start !== c ) { v += l.slice(v_start,c ) ; }
  if (!(c < e && (l.charCodeAt(c)) === start) )
    this['str.unfinished'](c);

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
 
  var y = 0;
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
             
              this.next(); // this must be done manually because we must have a lookahead before starting to parse an actual expression
              templExpressions.push( this.parseExpr(CONTEXT_NONE) );
              y += this.y;

              if ( this. lttype !== '}')
                this['templ.expr.is.unfinished']() ;

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
           currentElemContents += src.slice( startElemFragment, c ) + this.readEsc();
           c  = this.c;
           c++;
           if ( this.col === 0 ) // if we had an escaped newline 
             startColIndex = c;
           
           startElemFragment = c ;
           continue ;
    }

    c++ ;
  }

  if ( ch !== CHAR_BACKTICK ) this['templ.lit.is.unfinished']() ;
  
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
     tail: !false,
     value: { raw: src.slice(startElem,c).replace(/\r\n|\r/g,'\n'), 
              cooked: currentElemContents }
  }); 

  c++; // backtick  
  this.col ++ ;

  var n = { type: 'TemplateLiteral', start: startc, quasis: templStr, end: c,
       expressions: templExpressions , loc: { start: startLoc, end : this.loc() }, y: y };

  this.y = y;
  this.c = c;
  this.next(); // prepare the next token  

  return n;
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
         case 'case': case 'else': case 'this': case 'void':
         case 'with': case 'enum':
            return this.errorReservedID(e);

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
            if ( !( this.tight || ( this.scopeFlags & SCOPE_YIELD ) ) )
              break SWITCH;

         case 'break': case 'catch': case 'class': case 'const':
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
         case 'interface':
            if ( this.tight )
              return this.errorReservedID (e);
         case 'protected': case 'transient':
            if ( this.v <= 5 )
              return this.errorReservedID(e) ;

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
       this.throwReserved = !false;
       return null;
    }
    this['reserved.id'](id); 
}



},
function(){
this . parseVariableDeclaration = function(context) {
     if ( ! this.canBeStatement )
         this['not.stmt']('var');

     this.canBeStatement = false;

     var startc = this.c0, startLoc = this.locBegin(), kind = this.ltval;
     var elem = null;

     this.next () ;

     this.setDeclModeByName(kind);

     elem = this.parseVariableDeclarator(context);
     var y = this.y;
   
     if ( elem === null ) {
       if (kind !== 'let' ) 
         this['var.has.no.declarators'](startc,startLoc,kind);

       return null; 
     }

     var list = [elem];
     if ( !this.unsatisfiedAssignment ) // parseVariableDeclarator sets it when it finds an uninitialized BindingPattern
          while ( this.lttype === ',' ) {
            this.next();     
            elem = this.parseVariableDeclarator(context);
            if (!elem )
              this['var.has.an.empty.declarator'](startc,startLoc,kind);

            y += this.y;
            list.push(elem);
          }

     var lastItem = list[list.length-1];
     var endI = 0, endLoc = null;

     if ( !(context & CONTEXT_FOR) ) {
       endI = this.semiI() || lastItem.end;
       endLoc = this.semiLoc();
       if (  !endLoc ) {
          if ( this.newLineBeforeLookAhead ) endLoc =  lastItem.loc.end; 
          else  this['no.semi']('var',startc,startLoc,kind );
       }
     }
     else {
       endI = lastItem.end;
       endLoc = lastItem.loc.end;
     }

     this.foundStatement  = !false ;

     this.y = y;
     return { declarations: list, type: 'VariableDeclaration', start: startc, end: endI,
              loc: { start: startLoc, end: endLoc }, kind: kind, y: y };
};

this . parseVariableDeclarator = function(context) {
  if ( (context & CONTEXT_FOR) &&
       this.lttype === 'Identifier' &&
       this.ltval === 'in' )
      return null;

  var head = this.parsePattern(), init = null;
  if ( !head ) return null;
  
  var y = this.y;

  if ( this.lttype === 'op' && this.ltraw === '=' )  {
       this.next();
       init = this.parseNonSeqExpr(PREC_WITH_NO_OP,context);
       y += this.y;
  }
  else if ( head.type !== 'Identifier' ) { // our pattern is an arr or an obj?
       if (!( context & CONTEXT_FOR) )  // bail out in case it is not a 'for' loop's init
         this['var.decl.neither.of.in'](head) ;

       if( !this.unsatisfiedAssignment )
         this.unsatisfiedAssignment  =  head;     // an 'in' or 'of' will satisfy it
  }

  var initOrHead = init || head;

  this.y = y;
  return { type: 'VariableDeclarator', id: head, start: head.start, end: initOrHead.end,
           loc: { start: head.loc.start, end: initOrHead.loc.end }, init: init && core(init), y: y };
};


},
function(){

this.parseYield = function(context) {
  var arg = null,
      deleg = false;

  var c = this.c, li = this.li, col = this.col;
  var startc = this.c0, startLoc = this.locBegin();

  var y = 1;
  this.next();
  if (  !this.newLineBeforeLookAhead  ) {
     if ( this.lttype === 'op' && this.ltraw === '*' ) {
            deleg = !false;
            this.next();
            arg = this.parseNonSeqExpr ( PREC_WITH_NO_OP, context & CONTEXT_FOR );
            y += this.y;
            if (!arg )
              this['yield.has.no.expr.deleg'](startc,startLoc);
     }
     else {
        arg = this. parseNonSeqExpr ( PREC_WITH_NO_OP, (context & CONTEXT_FOR)|CONTEXT_NULLABLE );
        y += this.y;
     }
  }

  var endI, endLoc;

  if ( arg ) { endI = arg.end; endLoc = arg.loc.end; }
  else { endI = c; endLoc = { line: li, column: col }; }  

  var n = { type: 'YieldExpression', argument: arg && core(arg), start: startc, delegate: deleg,
           end: endI, loc: { start : startLoc, end: endLoc }, y: y }

  if ( !this.firstYS )
        this.firstYS = n;
 
  this.y = y;
  return n;
};



}]  ],
[ParserScope.prototype, [function(){

ParserScope.prototype = createObj(Scope.prototype);

ParserScope.prototype.spawnFunc = function(fundecl) {
  return new ParserScope(
       this.parser,
       this,
       fundecl ?
         SCOPE_TYPE_FUNCTION_DECLARATION :
         SCOPE_TYPE_FUNCTION_EXPRESSION
  );
};

ParserScope.prototype.spawnLexical = function(loop) {
  return new ParserScope(
       this.parser,
       this,
       !loop ?
        SCOPE_TYPE_LEXICAL_SIMPLE :
        SCOPE_TYPE_LEXICAL_LOOP );
};

ParserScope.prototype.setDeclMode = function(mode) {
  this.declMode = mode;
};

ParserScope.prototype.makeComplex = function() {
  ASSERT.call(this, this.declMode === DECL_MODE_FUNCTION_PARAMS);
  if (this.mustNotHaveAnyDupeParams()) return;
  for (var a in this.paramNames) {
     if (!HAS.call(this.paramNames, a)) continue;
     a = this.paramNames[a];
     if (a !== null) this.parser.err('func.args.has.dup', a);
  }
  this.isInComplexArgs = true;
};

ParserScope.prototype.parserDeclare = function(id) {
   switch (this.declMode) {
     case DECL_MODE_FUNCTION_PARAMS:
       this.addParam(id);
       break;

     case DECL_MODE_LET:
       this.declare(id.name, LET);
       break;

     case DECL_MODE_VAR:
       this.declare(id.name, VAR);
       break;

     default:
       ASSERT.call(this, false, 'default mode is not defined');
   }
};

ParserScope.prototype.mustNotHaveAnyDupeParams = function() {
  return this.strict || this.isInComplexArgs;
};

ParserScope.prototype.err = function(errType, errParams) {
  return this.parser.err(errType, errParams);
};
 
ParserScope.prototype.hasParam = function(name) {
  return HAS.call(this.paramNames, name+'%');
};

ParserScope.prototype.addParam = function(id) {
  ASSERT.call(this, this.declMode === DECL_MODE_FUNCTION_PARAMS);
  var name = id.name + '%';
  if ( HAS.call(this.paramNames, name) ) {
    if (this.mustNotHaveAnyDupeParams())
      this.err('func.args.has.dup', id);

    if (this.paramNames[name] === null)
      this.paramNames[name] = id ;
  }
  else
    this.paramNames[name] = null;
};

ParserScope.prototype.ensureParamIsNotDupe = function(id) {
   var name = id.name + '%';

   if (HAS.call(this.paramNames, name) && this.paramNames[name])
     this.parser.err('func.args.has.dup', id );
};


}]  ],
[Partitioner.prototype, [function(){
this.push = function(n) {
   ASSERT.call(this, !this.isSimple());
   if ( ( y(n) !== 0 || n.type === 'LabeledStatement' ) && HAS.call(pushList, n.type) )
     pushList[n.type].call( this, n );
   else
     this.current().addStmt(n);

   return this;
}; 

this.close_current_active_partition = function() {
   ASSERT.call(this, !this.isSimple());
   if ( this.currentPartition === null )
     return;

   ASSERT.call(this, this.currentPartition.isSimple());
   if (this.currentPartition.statements.length !== 0) {
     this.currentPartition = null;
   }
};

this.current = function() { // TODO: substitute it with add_to_current_partition
   ASSERT.call(this, !this.isSimple());
   if (this.currentPartition !== null)
     return this.currentPartition;

   var n = new Partitioner(this, null);
   this.max++; 
   this.partitions.push(n);

   this.currentPartition = n;
   return n;
};

this.pushAll = function(a) {
  var e = 0;
  while (e < a.length) this.push(a[e++]);
 
  return this;
};

this.isSimple = function() {
  return this.type === 'SimpleContainer';
};

this.hasMany = function() {
  return !this.isSimple() &&
         this.type !== 'IfContainer' &&
         !this.isLoop() &&
         ( this.partitions.length > 1 || 
           ( this.partitions.length === 1 &&
             this.partitions[0].type === 'BlockContainer'
           )
         );
};

// TODO: do it just once in the constructor
this.addErrorGuard = function() {
  var next = this.next();
  if (next)
    this.partitions = [set_state(-next.min)].concat(this.partitions);
};

this.addStmt = function(n) {
  this.scanStmt(n);
  this.statements.push(n);
};

this.scanStmt = function(n) {
  if (HAS.call(scanList, n.type)) {
    scanList[n.type].call(this, n);
  }
};

this.isContainer = function() {
  return !this.isSimple();
};

var pushList = {};
var scanList = {};
  
this.prettyString = function(emitter) {
   if (!emitter) emitter = new Emitter();
    
   var list = null, e = 0;
   if (this.isContainer()) {
     list = this.partitions;
     emitter.newlineIndent();
     emitter.write('<container:'+ this.type +
                    ' [' + this.min + ' to ' + (this.max-1) +']>');
     emitter.indent();
     while (e < list.length) {
         if ( list[e]===START_BLOCK ) {
           emitter.newlineIndent();
           emitter.write('<B>') ;
           emitter.indent();
         }
         else if ( list[e]===FINISH_BLOCK ) {
           emitter.unindent();
           emitter.newlineIndent();
           emitter.write('</B>');
         }
         else list[e].prettyString(emitter);
         e++ ;
     }
     emitter.unindent();
     emitter.newlineIndent();
     emitter.write('</container>');
   }
   else {
     ASSERT.call(this, this.min === this.max);
     list = this.statements;
     emitter.newlineIndent();
     emitter.write('<seg'+(this === this.owner.test ? ':test' : '') +
                   ' [' + this.min + ']>');
     if ( list.length>1 ) {
        emitter.indent();     
        while (e < list.length) {
          emitter.newlineIndent();
          emitter.emit(list[e]);
          e++ ;
        }
        emitter.unindent();
        emitter.newlineIndent();
     }
     else
        emitter.emit (list[0]);
    
     emitter.write('</seg>');
   }
   
   return emitter.code;
};

this.enterScope = function() {
  this.partitions.push(START_BLOCK);
};

this.exitScope = function() {
  this.partitions.push(FINISH_BLOCK);
};

this.next = function() {   
  if ( this.owner === null ) return null;
  if ( this.idx < this.owner.partitions.length - 1 )
    return this.owner.partitions[this.idx+1];
  
  if ( this.owner.isLoop() )
    return this.owner.partitions[0];

  return this.owner.next();
};

this.addLabel = function(name, labelRef) {
  if (!labelRef) labelRef = LabelRef.real();

  var existingLabel = this.findLabel(name);
  if (existingLabel) {
    existingLabel.synthName = this.synthLabelName(existingLabel.baseName);
    this.addLabel(existingLabel.synthName, existingLabel);
  }
  this.labelNames[name+'%'] = labelRef;
};

this.removeLabel = function(name) {
  this.labelNames[name+'%'] = null;
};

this.synthLabelName = function(baseName) {
  baseName = baseName || "label";
  var num = 0;
  var name = baseName;
  while (this.findLabel(name)) {
    num++;  
    name = baseName + "" + num;
  }
  return name;
};

this.useSynthLabel = function() {
   this.synthLabel = LabelRef.synth(this.type);
   this.synthLabel.synthName = this.synthLabelName(this.synthLabel.baseName);
   this.addLabel(this.synthLabel.synthName, this.synthLabel);
};

this.removeContainerLabel = function() {
   if (this.synthLabel !== null)
     this.removeLabel(this.synthLabel.synthName);
}; 
  
this.findLabel = function(name) {
   name += '%';
   return HAS.call(this.labelNames, name) ?
       this.labelNames[name] : null;
};

this.verifyBreakTarget = function() {
  if (this.abt !== this.ebt) this.ebt.useSynthLabel();
};

this.verifyContinueTarget = function() {
  if (this.act !== this.ect) this.ect.useSynthLabel();
};

this.scanArray = function(list) {
   var e = 0;
   while (e < list.length) this.scanStmt(list[e++]);
};

this.isLoop = function() {
   switch (this.type) {
     case 'ForInContainer':
     case 'ForOfContainer':
     case 'ForContainer': 
     case 'DoWhileContainer':
     case 'WhileContainer':
        return true;
     
     default:
        return false;
   }
};

this.isTest = function() {
   return this.owner &&
          this === this.owner.test;
};

this.isLoopTestSeg = function() {
  return this.isTest() &&
         this.owner.isLoop();
};

this.addSynthContinuePartition = function() {
  ASSERT.call(this, this.isLoop());
  this.partitions.push(new Partitioner(this, null));
  this.max++;
};

this.isSynthContinuePartition = function() {

  if ( this.owner !== null &&
       this.owner.isLoop() &&
       this.idx === this.owner.partitions.length ) {
    ASSERT.call(this, this.partitions.length === 0);
    return true;
  }

  return false;
};

this.isIfTestSeg = function() {
  return this.isTest() &&
         this.owner.type === 'IfContainer';
};

pushList['BlockStatement'] = function(n) {
   var list = n.body, e = 0;
   var container = new Partitioner(this, n);
   while (e < list.length) {
      container.push(list[e]);
      e++ ;
   }
   this.max = container.max;
   this.partitions.push(container);
};

scanList['BlockStatement'] = function(n) {
  this.scanArray(n.body);
};

scanList['TryStatement'] = function(n) {
  this.scanArray(n.block.body);
  if (n.handler) this.scanArray(n.handler.body);
  if (n.finalizer) this.scanArray(n.finalizer.body);
};

scanList['SwitchStatement'] = function(n) {
  var abt = this.abt, ebt = this.ebt;
  this.abt = this.ebt = n;
  var list = n.cases, e = 0;
  while (e < list.length)
     this.scanArray(list[e++].consequent);
  
  this.abt = abt; this.ebt = ebt;
};

scanList['IfStatement'] = function(n) {
  this.scanStmt(n.consequent);
  if (n.alternate) this.scanStmt(n.alternate);
};

scanList['ForOfStatement'] =
scanList['ForInStatement'] =
scanList['ForStatement'] =
scanList['DoWhileStatement'] =
scanList['WhileStatement'] = function(n) {
   var abt = this.abt, ebt = this.ebt;
   this.abt = this.ebt = n;
   var act = this.act, ect = this.ect; 
   this.act = this.ect = n;

   this.scanStmt(n.body); 

   this.abt = abt; this.ebt = ebt;
   this.act = act; this.ect = ect;   
};

scanList['BreakStatement'] = function(n) { this.verifyBreakTarget(); };
scanList['ContinueStatement'] = function(n) { this.verifyContinueTarget(); };

function synth_do_while(cond, body) {
   return { type: 'DoWhileStatement', test: cond, body: BLOCK(body) };
};

pushList['ExpressionStatement'] = function(n) {
   var yc = y(n);
   var e = this.emitter.transformYield(n.expression, this, NOT_VAL);
   if (e !== NOEXPRESSION && !( e.type === 'Identifier' && e.synth ) )
     this.current().addStmt(e);
};

pushList['WhileStatement'] = function(n) {
   this.close_current_active_partition();
   var container = new Partitioner(this, n);
   var test = this.emitter.transformYield(n.test, container, IS_VAL);
   container.close_current_active_partition();
   var test_seg = container.current();
   test_seg.addStmt(test);
   container.close_current_active_partition();
   container.test = test_seg;
   container.push(n.body);
   container.removeContainerLabel();
   container.addSynthContinuePartition();

   this.partitions.push(container);
   this.max = container.max;
};
       
pushList['IfStatement'] = function(n) {
   this.close_current_active_partition();
   var container = new Partitioner(this, n);
   var test = this.emitter.transformYield(n.test, container, IS_VAL);
   container.close_current_active_partition();
   var test_seg = container.current();
   test_seg.addStmt(test);
   container.close_current_active_partition();
   container.test = test_seg;
   var consequentContainer = new Partitioner(container, { type: 'CustomContainer' } );
   consequentContainer.push(n.consequent);
   container.consequent = consequentContainer;
   container.max = consequentContainer.max;
   if (n.alternate !== null) {
       container.close_current_active_partition();
       var elseContainer = new Partitioner(container, { type: 'CustomContainer' }); // TODO: eliminate { type: 'BlockStatement' }
       elseContainer.push(n.alternate);
       container.alternate = elseContainer;
       container.max = elseContainer.max;
   }
   this.partitions.push(container);
   this.max = container.max;
};  

pushList['YieldExpression'] = function(n) {
   this.current().addStmt(n);
   this.close_current_active_partition();
};

pushList['ForStatement'] = function(n) {
  this.close_current_active_partition();
  var container = new Partitioner(this, n);
  var e = this.transformYield(n.init, container, NOT_VAL);
  container.close_current_active_partition();
  var seg = container.current();
  seg.addStmt(e);
  container.close_current_active_partition();
  container.init = seg;

  e = this.transformYield(n.test);
  container.close_current_active_partition();
  seg = container.current();
  seg.push(e);
  container.close_current_active_partition();
  container.test = e;

  container.push(n.body);
  var uContainer = new Partitioner(container, { type: 'CustomContainer' });
  uContainer.push(n.update);

  container.next = n.update;
  container.max = uContainer.max;

  this.partitions.push(container);
  this.max = container.max;
};
     
pushList['TryStatement'] = function(n) {
   this.close_current_active_partition();
   var container = new Partitioner(this, n);

   var tryContainer = new Partitioner(container, {type:'CustomContainer'});
   tryContainer.pushAll(n.block.body);
   container.block = tryContainer;
   container.partitions.push(tryContainer);
   container.max = tryContainer.max;

   if (n.handler) {
      var catchContainer = new Partitioner(container, {type:'CustomContainer'});
      var temp = this.emitter.scope.allocateTemp();
      catchContainer.catchVar = temp;
      if (n.handler.param.type !== 'Identifier') {
         catchContainer.push( { type: 'ExpressionStatement', expression: {
            type: 'AssignmentExpression',
            y: y(n.handler.param),
            left: n.handler.param,
            right: temp
         }, y: y(n.handler.param) } );
         // n.handler.param = temp;
      }
      this.emitter.scope.releaseTemp(temp);
      catchContainer.pushAll(n.handler.body.body);
      container.handler = catchContainer;
      catchContainer.idx = tryContainer.idx; // TODO: find a better way to track "next" (or eliminate it altogether maybe?)
      container.max = catchContainer.max; 
   }  
   else
      n.handler = null;

   if (n.finalizer) {
      this.mainContainer.hasFinally = true;
      var finallyContainer = new Partitioner(container, {type:'CustomContainer'});
      finallyContainer.pushAll(n.finalizer.body);
      container.finalizer = finallyContainer;
      container. partitions.push(finallyContainer);
      container.max = finallyContainer.max;
   }
   else
      n.finalizer = null;

   this.partitions.push(container);
   this.max = container.max;
};      

pushList['LabeledStatement'] = function(n) {
   this.addLabel(n.label.name);
   if (y(n) > 0) {
     this.close_current_active_partition();
     var container = new Partitioner(this, n);
     var name = n.label.name + '%';
     container.label = { name: n.label.name, head: null, next: null };
     container.label.head = container.label;
     container.push(n.body);
     this.partitions.push(container);
     this.max = container.max;
   }
   else
      this.current().addStmt(n);
   this.removeLabel(n.label.name);
};

pushList['SwitchStatement'] = function(n) {
   this.close_current_active_partition();
   var switchContainer = new Partitioner(this, n);
   var switchBody = this.emitter.transformSwitch(n), e = 0;
   while (e < switchBody.length)
     switchContainer.push(switchBody[e++]);

   this.partitions.push(switchContainer);
   this.max = switchContainer.max;
};
   
pushList['NoExpression'] = function() { return; };

}]  ],
[RefMode.prototype, [function(){
this.updateExistingRefWith = function(name, fromScope) {

  // TODO: check whether the scope has a direct eval, because it can make things like this happen:
  // var a = []; while (a.length<12) { let e = a.length; a.push(function(){ return eval("e++") }); }
  // when there is a direct eval in a (possibly loop) scope, the transformation for closure-let must be applied for every let
  // declaration the scope might contain, even if none of them has been expressly accessed from inside a function
  if (!fromScope.isFunc()) {
    var ref = fromScope.unresolvedNames[name+'%'];
    if (ref.indirect) this.indirect |= ACCESS_EXISTING;
    if (ref.direct) this.direct |= ACCESS_EXISTING;
  }
  else {
    // let e = 12; var l = function() { return e--; };
    if (!fromScope.isDeclaration()) this.indirect |= ACCESS_EXISTING;

    // let e = 12; function l()  { return e--; } 
    else this.indirect |= ACCESS_FORWARD;
  }
};

this.updateForwardRefWith = function(name, fromScope) {
   var ref = fromScope.unresolvedNames[name+'%'];
   if (fromScope.isFunc()) {
     this.indirect |= ref.direct;
     this.indirect |= ref.indirect;
   }
   else {
     this.indirect |= ref.indirect;
     this.direct |= ref.direct;
   }   
};


}]  ],
[Scope.prototype, [function(){
this.reference = function(name, fromScope) {
  if (!fromScope) fromScope = this;
  var decl = this.findDeclInScope(name), ref = null;
  if (decl && !decl.scope.isFunc() && this.isFunc()) { // the decl is synthetic, and must be renamed
    decl.rename();
    decl = null;
    // TODO: the name should be deleted altogether (i.e., `delete this.definedNames[name+'%']`),
    // but looks like setting it to null will do
    this.definedNames[name+'%'] = null;
  }
  if (decl) {
    ref = decl.refMode;
    if (this !== fromScope) ref.updateExistingRefWith(name, fromScope);
    else ref.direct |= ACCESS_EXISTING;
  }
  else {
    ref = this.findRefInScope(name);
    if (!ref) {
      ref = new RefMode();
      this.insertRef(name, ref);
    }
    if (this !== fromScope) ref.updateForwardRefWith(name, fromScope);
    else ref.direct |= ACCESS_FORWARD;
  }
};

this.declare = function(name, declType) {
  return declare[declType].call(this, name);
};

this.findRefInScope = function(name) {
  name += '%';
  return HAS.call(this.unresolvedNames, name) ?
            this.unresolvedNames[name] : null;
};

this.err = function(errType, errParams) {
   if (errType === 'exists.in.current') {
     var decl = errParams.newDecl,
         existingDecl = errParams.existingDecl;

     ASSERT.call(this, false, 
        'name "'+decl.name+'" is a "'+decl.type+
        '" and can not override the "'+existingDecl.type+
        '" that exists in the current scope');
   }
   else
     ASSERT.call(this, false, errType + '; PARAMS='+errParams);
};

var declare = {};

declare[VAR] = function(name) {
   var func = this.funcScope;
   var decl = new Decl(VAR, name, func, name);
   var scope = this;
   scope.insertDecl(name, decl);
   while (scope !== func) {
     scope = scope.parent;
     scope.insertDecl(name, decl);
   }
   return decl;
};

declare[LET] = function(name) {
   var decl = new Decl(LET, name, this, name);
   this.insertDecl(name, decl);
   return decl;
};

this.insertDecl = function(name, decl) {
  var existingDecl = this.findDeclInScope(name);
  var func = this.funcScope;
  if (existingDecl !== null) {
    if (decl.type === VAR && existingDecl.type === VAR) // if a var decl is overriding a var decl of the same name,
      return; // no matter what scope we are in, it's not a problem.
     
    if ( 
         ( // but
           this === func && // if we are in func scope
           existingDecl.scope === func // and what we are trying to override is real (i.e., not synthesized)
         ) ||
         this !== func // or we are in a lexical scope, trying to override a let with a var or vice versa, 
       ) // then raise an error
       this.err('exists.in.current',{
           newDecl:decl, existingDecl:existingDecl});
  }
  if (this !== func) {
    this.insertDecl0(true, name, decl);
    if (decl.type !== VAR && !decl.scope.isFunc()) {
      decl.rename();
    }
  }
  else {
    this.insertDecl0(true, name, decl);
    if (existingDecl !== null) { // if there is a synthesized declaration of the same name, rename it
      var synthName = existingDecl.scope.newSynthName(name);
      existingDecl.synthName = synthName;
      this.insertDecl0(false, synthName, existingDecl);
    } 
  }
};

this.insertDecl0 = function(isOwn, name, decl) {
  name += '%';
  this.definedNames[name] = decl;
  if (isOwn)
    if (HAS.call(this.unresolvedNames, name)) {
      decl.refMode = this.unresolvedNames[name];
      this.unresolvedNames[name] = null;
    }
    else decl.refMode = new RefMode();
};

this.findDeclInScope = function(name) {
  name += '%';
  return HAS.call(this.definedNames, name) ? 
     this.definedNames[name] : null;
};

this.finish = function() {
  var parent = this.parent;
  if (!parent) return;

  // hand the current scope's unresolved references to the parent scope
  for (var name in this.unresolvedNames) {
    if (!HAS.call(this.unresolvedNames, name)) continue;
    var n = this.unresolvedNames[name];
    if (n === null) continue;
    parent.reference(name.substring(0,name.length-1), this);
  }

  if (!this.isLoop()) return;

  for (var name in this.definedNames) {
    if (!HAS.call(this.definedNames, name)) continue;
    var n = this.definedNames[name];
    if (!n.needsScopeVar()) continue;
    this.addChildLexicalDeclaration(n);
  }
};
    
this.insertRef = function(name, ref) {
  this.unresolvedNames[name+'%'] = ref;
};

this.newSynthName = function(baseName) {
  var num = 0, func = this.funcScope;
  var name = baseName;
  for (;;num++, name = baseName + "" + num) {
     if (name === this.catchVar) continue;
     if (func.findDeclInScope(name)) continue; // must not be in the surrounding func scope's defined names, 
     if (func.findRefInScope(name)) continue; // must not be in the surrounding func scope's referenced names;
     if (!this.isFunc()) { // furthermore, if we're not allocating in a func scope,
       if (this.findRefInScope(name)) continue; // it must not have been referenced in the current scope
       
       // this one requires a little more clarification; while a func scope's defined names are "real" names (in the sense
       // that an entry like 'n' in the func scope's definedNames maps to a variable of the exact same name 'n'), it is not so
       // for lexical scopes; this gives us the possibility to choose synthesized name with the exact same name as the variable
       // itself. For example, if we want to find a synthesized approximate name for a name like 'n2' defined inside
       // a lexical scope, and it has satisfied all previous conditions (i.e., it's neither defined nor referenced in the 
       // surrounding func scope, and it has not been referenced in the scope we are synthesizing the name in), then the synthesized
       // name can be the name itself, in this case 'n2'.

       // if the current "suffixed" name (i.e., the baseName appended with num)
       // exists in the scope's declarations,
       if (this.findDeclInScope(name)) 
         // it must not actually be a suffixed name (i.e., it must be the base name,
         // which has not been appended with a 'num' yet); this the case only when num is 0, obviously.
         if (name !== baseName) continue; // alternatively, num !== 0 
     }
     break;
  }
  return name;
};

this.makeScopeObj = function() {
  if (this.scopeObjVar !== null) return;
  var scopeName = this.newSynthName('scope');
  this.scopeObjVar = this.declare(scopeName, LET);
  this.wrappedDeclList = [];
  this.wrappedDeclNames = {};
};   

this.allocateTemp = function() {
  var temp = "";
  if (this.tempStack.length) 
    temp = this.tempStack.pop();
  else {
    do {
      temp = this.funcScope.declSynth('temp');
    } while (temp === this.catchVar);
  }
  return temp;
};

this.releaseTemp = function(tempName) {
  this.tempStack.push(tempName);
};
 
this.declSynth = function(name) {
  ASSERT.call(this, this.isFunc());
  var synthName = this.newSynthName(name);
  this.declare(synthName, VAR);
  return synthName;
};

this.isLoop = function() { return this.type === SCOPE_TYPE_LEXICAL_LOOP; };
this.isLexical = function() { return this.type & SCOPE_TYPE_LEXICAL_SIMPLE; };
this.isFunc = function() { return this.type & SCOPE_TYPE_FUNCTION_EXPRESSION; };
this.isDeclaration = function() { return this.type === SCOPE_TYPE_FUNCTION_DECLARATION; };

this.addChildLexicalDeclaration = function(decl) {
   ASSERT.call(this, this.isLoop(), 'only a loop scope can currently have a scope var');
   this.makeScopeObj();
   var funcScope = this.funcScope;
   funcScope.removeDecl(decl);
   this.wrappedDeclList.push(decl);
   this.wrappedDeclNames[decl.name+'%'] = decl;
   decl.synthName = decl.name;
};

this.removeDecl = function(decl) {
   delete this.definedNames[decl.synthName+'%'];
   return decl;
};


}]  ],
null,
null,
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

; this.Parser = Parser;  
; this.Scope = Scope;
; this.Emitter = Emitter;
; this.Partitioner = Partitioner;
  this.Decl = Decl;
  this.RefMode = RefMode;

;}).call (this)