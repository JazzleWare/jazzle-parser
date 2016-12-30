this.parseArgs = function (argLen) {
  var c0 = -1, li0 = -1, col0 = -1, tail = true,
      list = [], elem = null;

  if (!this.expectType_soft('('))
    this.err('func.args.no.opening.paren');

  var firstNonSimpArg = null;
  while (list.length !== argLen) {
    elem = this.parsePattern();
    if (elem) {
      if (this.lttype === 'op' && this.ltraw === '=') {
        elem = this.parseAssig(elem);
        this.makeComplex();
      }
      if (!firstNonSimpArg && elem.type !== 'Identifier')
        firstNonSimpArg =  elem;
      list.push(elem);
    }
    else {
      if (list.length !== 0) {
        if (this.v < 7)
          this.err('arg.non.tail.in.func',
            {c0:c0,li0:li0,col0:col0,extra:{list:list}});
      }
      break ;
    }

    if (this.lttype === ',' ) {
      c0 = this.c0, li0 = this.li0, col0 = this.col0;
      this.next();
    }
    else { tail = false; break; }
  }
  if (argLen === ARGLEN_ANY) {
    if (tail && this.lttype === '...') {
      this.makeComplex();
      elem = this.parseRestElement();
      list.push( elem  );
      if ( !firstNonSimpArg )
        firstNonSimpArg = elem;
    }
  }
  else if (list.length !== argLen)
    this.err('func.args.not.enough');

  if (!this.expectType_soft (')'))
    this.err('func.args.no.end.paren');

  if (firstNonSimpArg)
    this.firstNonSimpArg = firstNonSimpArg;
 
  return list;
};

this.parseFuncBody = function(context) {
  var elem = null;
  
  if ( this.lttype !== '{' ) {
    elem = this.parseNonSeqExpr(PREC_WITH_NO_OP, context|CTX_NULLABLE|CTX_PAT);
    if ( elem === null )
      return this.err('func.body.is.empty.expr');
    return elem;
  }

  this.scopeFlags |= SCOPE_FLAG_IN_BLOCK;
  var startc= this.c - 1, startLoc = this.locOn(1);


  this.directive = DIR_FUNC;
  this.clearAllStrictErrors();

  this.next() ;

  var list = this.blck();

  var n = { type : 'BlockStatement', body: list, start: startc, end: this.c,
           loc: { start: startLoc, end: this.loc() }/* ,scope: this.scope ,y:-1*/ };

  if ( ! this.expectType_soft ( '}' ) &&
         this.err('func.body.is.unfinished') )
    return this.errorHandlerOutput ;

  return  n;
};

// #if V
this . makeStrict  = function() {
   if ( this.firstNonSimpArg )
     return this.err('func.strict.non.simple.param')  ; 

   if ( this.tight ) return;

   this.tight = true;

   var a = 0, argNames = this.scope.nameList;
   while (a < argNames.length) {
     var decl = argNames[a];
     if (decl.type&DECL_DUPE)
       this.err('func.args.has.dup');
     ASSERT.call(this, !arguments_or_eval(decl.name));
     this.validateID(decl.name);

     a++;
   }
};

// #else
this . makeStrict  = function() {
   if ( this.firstNonSimpArg )
     return this.err('func.strict.non.simple.param')  ; 

   if ( this.tight ) return;

   // TODO: squash them into one
   this.tight = true;
   this.scope.strict = true;

   var a = null, argNames = this.scope.definedNames;
   for (a in argNames) {
     var declType = argNames[a];
     a = a.substring(0,a.length-1);
     if (declType&DECL_DUPE)
       this.err('func.args.has.dup');

     ASSERT.call(this, !arguments_or_eval(a));
     this.validateID(a);
   }
};
// #end

