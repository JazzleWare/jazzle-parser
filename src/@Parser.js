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

  this.isInArgList = false;
  this.argNames = null;

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
  this.inComplexArgs = false;

  this.first__proto__ = false;
};

