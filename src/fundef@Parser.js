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
         if ( elem.left.type === 'Identifier' )
           this.scope.ensureParamIsNotDupe(elem.left);

         this.scope.setComplexMode(true);
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
        this.scope.setComplexMode(true);
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

   var a = null, argNames = this.scope.argNames;
   for ( a in argNames ) {
        if ( argNames[a] !== null )
          this['func.args.has.dup'](argNames[a]);

        a = a.substring(0,a.length-1) ;
        this.assert(!arguments_or_eval(a));
        this.validateID(a);
   }
};


