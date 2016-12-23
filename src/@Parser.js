var Parser = function (src, isModule) {

  this.src = src;

  this.unsatisfiedLabel = null;

  this.nl = false;

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

  this.firstNonSimpArg = null;

  this.isScript = !isModule;
  this.v = 12/2;

  this.throwReserved = true;
 
  this.errorHandlers = {};
  this.errorHandlerOutput = null;

  this.first__proto__ = false;

  this.scope = null;
  this.directive = DIR_NONE;
  
  this.declMode = DECL_NONE;
 
  // TODO:eliminate
  this.pendingExprHead = null;

  // ERROR TYPE           CORE ERROR NODE    OWNER NODE
  this.pt = ERR_NONE_YET; this.pe = null; this.po = null; // paramErr info
  this.at = ERR_NONE_YET; this.ae = null; this.ao = null; // assigErr info
  this.st = ERR_NONE_YET; this.se = null; this.so = null; // simpleErr info

  this.suspys = null;
  this.missingInit = false;
};

