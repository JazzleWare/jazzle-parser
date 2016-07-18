_class .parseArgs  = function (argLen) {
  var list = [], elem = null;

  this.expectType('(') ;

  var firstNonSimpArg = null;
  while ( list.length !== argLen ) {
    elem = this.parsePattern();
    if ( elem ) {
       if ( this.lttype === 'op' && this.ltraw === '=' )
         elem = this.parseAssig(elem);

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
        elem = this.parseRestElement()
        list.push( elem  );
        if ( !firstNonSimpArg )
              firstNonSimpArg = elem;
     }
  }
  else
     this.assert( list.length === argLen );

  this.expectType(')');

  if ( firstNonSimpArg )
     this.firstNonSimpArg = firstNonSimpArg ;
 
  return list;
};

_class .addArg = function(id) {
  var name = id.name + '%';
  if ( has.call(this.argNames, name) ) {
    this.assert( !this.tight );
    if ( this.argNames[name] === null )
      this.argNames[name] = id ;
  }
  else
     this.argNames[name] = null ;
};

  
_class .parseFunc = function(context, argListMode, argLen ) {
  var canBeStatement = false, startc = this.c0, startLoc = this.locBegin();
  var prevLabels = this.labels;
  var prevStrict = this.tight;
  var prevInArgList = this.isInArgList;
  var prevArgNames = this.argNames;
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
        this.assert( this.lttype === 'Identifier' ) ;
        currentFuncName = this.validateID(null);
        this.assert( !( this.tight && arguments_or_eval(currentFuncName.name) ) );
     }
     else if ( this. lttype == 'Identifier' ) {
        currentFuncName = this.validateID(null);
        this.assert( !( this.tight && arguments_or_eval(currentFuncName.name) ) );
     }
     else
        currentFuncName = null;
  }
  else if ( argListMode & ARGLIST_AND_BODY_GEN )
     isGen = !false; 

  if ( this.scopeFlags )
       this.scopeFlags = 0;

  this.isInArgList = !false;
  this.argNames = {};
  var argList = this.parseArgs(argLen) ;
  this.isInArgList = false;
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
  this.isInArgList = prevInArgList;
  this.argNames = prevArgNames; 
  this.tight = prevStrict;
  this.scopeFlags = prevScopeFlags;
  this.firstYS = prevYS;
  this.firstNonSimpArg = prevNonSimpArg;

  return  n  ;
};

_class.parseFuncBody = function(context) {
  if ( this.lttype !== '{' )
    return this.parseNonSeqExpr(PREC_WITH_NO_OP, context);

  var startc= this.c - 1, startLoc = this.locOn(1);
  var list = [], stmt = null;
  this.next() ;
  stmt = this.parseStatement(!false);

  if ( !this.tight && this.v > 5 && stmt && 
       stmt.type === 'ExpressionStatement' && stmt.expression.type === 'Literal' )
       switch (this.src.slice(stmt.expression.start,stmt.expression.end) )  {
           case "'use strict'":
           case '"use strict"':
              this.makeStrict();
       }

  while ( stmt ) { list.push(stmt); stmt = this.parseStatement(!false); }
  var n = { type : 'BlockStatement', body: list, start: startc, end: this.c,
           loc: { start: startLoc, end: this.loc() } };
  this.expectType ( '}' );

  return  n;
};

_class . makeStrict  = function() {
   this.assert( !this.firstNonSimpArg )  ; 
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


