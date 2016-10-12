this .parseArgs  = function (argLen) {
  var list = [], elem = null;

  if ( !this.expectType_soft('(') &&
        this.err('func.args.no.opening.paren',argLen) )
    return this.errorHandlerOutput  ;

  var firstNonSimpArg = null;
  while ( list.length !== argLen ) {
    elem = this.parsePattern();
    if ( elem ) {
       if ( this.lttype === 'op' && this.ltraw === '=' ) {
         elem = this.parseAssig(elem);
         if ( elem.left.type === 'Identifier' ) {
            if ( this.argNames[elem.left.name+'%'] !== null )
                 this.err('func.args.has.dup',elem);
         }
         this.inComplexArgs = !false;
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
        this.inComplexArgs = !false;
        elem = this.parseRestElement();
        list.push( elem  );
        if ( !firstNonSimpArg )
              firstNonSimpArg = elem;
     }
  }
  else {
     if ( list.length !== argLen &&
          this.err('func.args.not.enough',argLen,list) )
       return this.errorHandlerOutput;
  }

  if ( ! this.expectType_soft (')') &&
       this.err('func.args.no.end.paren',argLen,list) )
    return this.errorHandlerOutput ;

  if ( firstNonSimpArg )
     this.firstNonSimpArg = firstNonSimpArg ;
 
  return list;
};

this .addArg = function(id) {
  var name = id.name + '%';
  if ( has.call(this.argNames, name) ) {
    if ( this.inComplexArgs )
       this.err('func.args.has.dup',id);

    if ( this.argNames[name] === null )
      this.argNames[name] = id ; // this will be useful if the body has a strictness directive
  }
  else
     this.argNames[name] = null ;
};

this .parseFunc = function(context, argListMode, argLen ) {
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
        if ( this.lttype !== 'Identifier' &&
             this.err('missing.name','func', 
                { s: startc, l: startLoc, labels: prevLabels, strict: prevStrict, inArgsList: prevInArgList,
                  argNames: prevArgNames, scopeFlags: prevScopeFlags, ys: prevYS, nonSimp: prevNonSimpArg,
                  args: [context, argListMode, argLen] } ) )
          return this.errorHandlerOutput ;

        currentFuncName = this.validateID(null);
        if ( this.tight && arguments_or_eval(currentFuncName.name) &&
             this.err('binding.to.eval.or.arguments','func',
                { s: startc, l: startLoc, labels: prevLabels, stmt: !false, strict: prevStrict, inArgsList: prevInArgList,
                  argNames: prevArgNames, scopeFlags: prevScopeFlags, ys: prevYS, nonSimp: prevNonSimpArg,
                  args: [context, argListMode, argLen] } ) )
          return this.errorHandlerOutput ;
     }
     else if ( this. lttype === 'Identifier' ) {
        currentFuncName = this.validateID(null);
        if ( this.tight && arguments_or_eval(currentFuncName.name) &&
             this.err('binding.to.eval.or.arguments','func',
                { s: startc, l: startLoc, labels: prevLabels, stmt: canBeStatement, strict: prevStrict, inArgsList: prevInArgList,
                  argNames: prevArgNames, scopeFlags: prevScopeFlags, ys: prevYS, nonSimp: prevNonSimArg,
                  context: [ context, argListMode, argLen] } )   )
          return this.errorHandlerOutput;
     }
     else
        currentFuncName = null;
  }
  else if ( argListMode & ARGLIST_AND_BODY_GEN )
     isGen = !false; 

  if ( this.scopeFlags )
       this.scopeFlags = 0;

  var prevComplexArgs = this.inComplexArgs;
  this.inComplexArgs = this.tight;
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
   
  this.inComplexArgs = false;
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
  this.inComplexArgs = prevComplexArgs;

  return  n  ;
};

this.parseFuncBody = function(context) {
  var elem = null;
  
  if ( this.lttype !== '{' ) {
    elem = this.parseNonSeqExpr(PREC_WITH_NO_OP, context|CONTEXT_NULLABLE);
    if ( elem === null )
      return this.err('func.body.is.empty.expr',context);
    return elem;
  }

  var startc= this.c - 1, startLoc = this.locOn(1);
  var list = [];
  this.next() ;
  elem = this.parseStatement(!false);

  if ( !this.tight && this.v > 5 && elem && 
       elem.type === 'ExpressionStatement' && elem.expression.type === 'Literal' && typeof elem.expression.value === typeof "" )
       switch (this.src.slice(elem.expression.start,elem.expression.end) )  {
           case "'use strict'":
           case '"use strict"':
              this.makeStrict();
       }

  while ( elem ) { list.push(elem); elem = this.parseStatement(!false); }
  var n = { type : 'BlockStatement', body: list, start: startc, end: this.c,
           loc: { start: startLoc, end: this.loc() } };

  if ( ! this.expectType_soft ( '}' ) &&
         this.err('func.body.is.unfinished',n) )
    return this.errorHandlerOutput ;

  return  n;
};

this . makeStrict  = function() {
   if ( this.firstNonSimpArg )
     return this.err('func.strict.non.simple.param')  ; 

   if ( this.tight ) return;

   this.tight = !false;

   var argName = null;
   for ( argName in this.argNames ) {
        if ( this.argNames[argName] !== null )
          this.err('func.args.has.dup',this.argNames[argName]);

        argName = argName.substring(0,argName.length-1) ;
        this.assert(!arguments_or_eval(argName));
        this.validateID(argName);

   }
};


