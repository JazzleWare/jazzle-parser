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

this .parseFunc = function(context, argListMode, argLen ) {
  var canBeStatement = false, startc = this.c0, startLoc = this.locBegin();
  var prevLabels = this.labels;
  var prevStrict = this.tight;

  var prevScopeFlags = this.scopeFlags;
  var prevYS = this.firstYS ;
  var prevNonSimpArg = this.firstNonSimpArg;

  if ( !this.canBeStatement ) 
    this.scopeFlags = 0; //  FunctionExpression's BindingIdentifier can be 'yield', even when in a *
  else if ( !(this.scopeFlags & SCOPE_WITH_FUNC_DECL) )
      this.err('func.decl.not.in.block', startc, startLoc);

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
     if ( !canBeStatement && isGen ) // GeneratorExpression's BindingIdentifier can't be 'yield'
       this.scopeFlags = SCOPE_YIELD;

     if ( canBeStatement && context !== CONTEXT_DEFAULT  )  {
        if ( this.lttype !== 'Identifier' &&
             this.err('missing.name','func', 
                { s: startc, l: startLoc, labels: prevLabels, strict: prevStrict, inArgsList: prevInArgList,
                  argNames: prevArgNames, scopeFlags: prevScopeFlags, ys: prevYS, nonSimp: prevNonSimpArg,
                  args: [context, argListMode, argLen] } ) )
          return this.errorHandlerOutput ;

        this.scope.setDeclMode(DECL_MODE_VAR);
        currentFuncName = this.parsePattern();

        if ( this.tight && arguments_or_eval(currentFuncName.name) &&
             this.err('binding.to.eval.or.arguments','func',
                { s: startc, l: startLoc, labels: prevLabels, stmt: !false, strict: prevStrict, inArgsList: prevInArgList,
                  argNames: prevArgNames, scopeFlags: prevScopeFlags, ys: prevYS, nonSimp: prevNonSimpArg,
                  args: [context, argListMode, argLen] } ) )
          return this.errorHandlerOutput ;
     }
     else if ( this. lttype === 'Identifier' ) {
        this.enterLexicalScope(false);
        this.scope.synth = true;
        this.scope.setDeclMode(DECL_MODE_VAR);
        currentFuncName = this.parsePattern();
        
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

  this.enterFuncScope(canBeStatement);
  this.scope.setDeclMode(DECL_MODE_FUNCTION_PARAMS);
  
  if ( isGen ) this.scopeFlags |= SCOPE_YIELD|SCOPE_ARGS;
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

  this.exitScope();

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

  this.scopeFlags |= SCOPE_BLOCK;
  var startc= this.c - 1, startLoc = this.locOn(1);
  this.next() ;

  this.directive = DIRECTIVE_FUNC;
  var list = this.blck();

  var n = { type : 'BlockStatement', body: list, start: startc, end: this.c,
           loc: { start: startLoc, end: this.loc() }/* ,y:-1*/ };

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

   var a = null, argNames = this.scope.definedNames;
   for (a in argNames) {
     var declType = argNames[a] /* #if V */ .type /* #end */ ;
     a = a.substring(0,a.length-1);
     if (declType&DECL_DUPE)
       this.err('func.args.has.dup',a);

     ASSERT.call(this, !arguments_or_eval(a));
     this.validateID(a);
   }
};


