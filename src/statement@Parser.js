this.parseStatement = function ( allowNull ) {
  var head = null, l, e , directive = this.directive ;
  this.directive = DIRECTIVE_NONE;

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
      if (!allowNull && this.err('stmt.null') )
        return this.errorHandlerOutput ;

      return null;
  }

  this.assert(head === null) ;
  head = this.parseExpr(CONTEXT_NULLABLE) ;
  if ( !head ) {
    if ( !allowNull && this.err('stmt.null') )
      this.errorHandlerOutput;

    return null;
  }

  if ( head.type === 'Identifier' && this.lttype === ':')
    return this.parseLabeledStatement(head, allowNull);

  this.fixupLabels(false) ;
  if ( directive &&
       head.type === 'Literal' &&
       typeof head.value === STRING_TYPE )
     switch ( this.src.substring(head.start, head.end ) ) {
       case "'use strict'":
       case '"use strict"':
          if (directive & DIRECTIVE_FUNC) this.makeStrict();
          else this.tight = true;
     }
 
  e  = this.semiI() || head.end;
  l = this.semiLoc_soft ();
  if ( !l && !this.newLineBeforeLookAhead &&
       this.err('no.semi','expr',{head:head,e:e}) )
    return this.errorHandlerOutput;
 
  return {
    type : 'ExpressionStatement',
    expression : core(head),
    start : head.start,
    end : e,
    loc : { start : head.loc.start, end : l || head.loc.end }
  };
};

this . findLabel = function(name) {
    return has.call(this.labels, name) ?this.labels[name]:null;

};

this .parseLabeledStatement = function(label, allowNull) {
   this.next();
   var l = label.name;
   l += '%';
   if ( this.findLabel(l) && this.err('label.is.a.dup',label,allowNull) )
     return this.errorHandlerOutput ;

   this.labels[l] =
        this.unsatisfiedLabel ?
        this.unsatisfiedLabel :
        this.unsatisfiedLabel = { loop: false };

   var stmt  = this.parseStatement(allowNull);
   this.labels[l] = null;

   return { type: 'LabeledStatement', label: label, start: label.start, end: stmt.end,
            loc: { start: label.loc.start, end: stmt.loc.end }, body: stmt };
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
  if ( !this.ensureStmt_soft () && this.err('not.stmt','if') )
    return this.errorHandlerOutput;

  this.fixupLabels(false);
  this.enterLexicalScope(false); 

  var startc = this.c0,
      startLoc  = this.locBegin();
  this.next () ;
  if ( !this.expectType_soft('(') &&
        this.err('if.has.no.opening.paren',startc,startLoc) )
    return this.errorHanlerOutput;

  var cond = core( this.parseExpr(CONTEXT_NONE) );
  if ( !this.expectType_soft (')' ) &&
        this.err('if.has.no.closing.paren',startc,startLoc) )
    return this.errorHandlerOutput ;

  var scopeFlags = this.scopeFlags ;
  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= SCOPE_IF;
  var nbody = this. parseStatement (false);
  this.scopeFlags = scopeFlags ;
  var alt = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'else') {
     this.next() ;
     alt = this.parseStatement(false);
  }

  this.exitScope(); 

  this.foundStatement = !false;
  return { type: 'IfStatement', test: cond, start: startc, end: (alt||nbody).end,
     loc: { start: startLoc, end: (alt||nbody).loc.end }, consequent: nbody, alternate: alt /* ,y:-1*/};
};

this.parseWhileStatement = function () {
   this.enterLexicalScope(true);
   if ( ! this.ensureStmt_soft () &&
          this.err('not.stmt','while') )
     return this.errorHandlerOutput;

   this.fixupLabels(!false);

   var startc = this.c0,
       startLoc = this.locBegin();
   this.next();
   if ( !this.expectType_soft ('(') &&
         this.err('while.has.no.opening.paren',startc,startLoc) )
     return this.errorHandlerOutput;
 
   var cond = core( this.parseExpr(CONTEXT_NONE) );
   if ( !this.expectType_soft (')') &&
         this.err('while.has.no.closing.paren' ,startc,startLoc) )
     return this.errorHandlerOutput;

   var scopeFlags = this.scopeFlags;
   this.scopeFlags &= CLEAR_IB;
   this.scopeFlags |= (SCOPE_CONTINUE|SCOPE_BREAK );
   var nbody = this.parseStatement(false);
   this.scopeFlags = scopeFlags ;
   this.foundStatement = !false;

   this.exitScope();
   return { type: 'WhileStatement', test: cond, start: startc, end: nbody.end,
       loc: { start: startLoc, end: nbody.loc.end }, body:nbody/* ,y:-1*/ };
};

this.parseBlckStatement = function () {
  this.fixupLabels(false);

  this.enterLexicalScope(false); 
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next();
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= SCOPE_BLOCK;

  var n = { type: 'BlockStatement', body: this.blck(), start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() } /* ,y:-1*/};

  if ( !this.expectType_soft ('}' ) &&
        this.err('block.unfinished',n) )
    return this.errorHandlerOutput ;

  this.exitScope(); 
  this.scopeFlags = scopeFlags;
  return n;
};

this.parseDoWhileStatement = function () {
  if ( !this.ensureStmt_soft () &&
        this.err('not.stmt','do-while') )
    return this.errorHandlerOutput ;

  this.enterLexicalScope(true); 
  this.fixupLabels(!false);

  var startc = this.c0,
      startLoc = this.locBegin() ;
  this.next() ;
  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= (SCOPE_BREAK| SCOPE_CONTINUE);
  var nbody = this.parseStatement (!false) ;
  this.scopeFlags = scopeFlags;
  if ( !this.expectID_soft('while') &&
        this.err('do.has.no.while',startc,startLoc,scopeFlags,nbody) )
    return this.errorHandlerOutput;

  if ( !this.expectType_soft('(') &&
        this.err('do.has.no.opening.paren',startc,startLoc,scopeFlags,nbody) )
    return this.errorHandlerOutput;

  var cond = core(this.parseExpr(CONTEXT_NONE));
  var c = this.c, li = this.li, col = this.col;
  if ( !this.expectType_soft (')') &&
        this.err('do.has.no.closing.paren',startc,startLoc,scopeFlags,nbody,c,li,col,cond) )
    return this.errorHandlerOutput;

  if (this.lttype === ';' ) {
     c = this.c;
     li = this.li ;
     col = this.col;
     this.next();
  }

 this.foundStatement = !false;

 this.exitScope(); 
 return { type: 'DoWhileStatement', test: cond, start: startc, end: c,
          body: nbody, loc: { start: startLoc, end: { line: li, column: col } } /* ,y:-1*/} ;
};

this.parseContinueStatement = function () {
   if ( ! this.ensureStmt_soft   () &&
          this.err('not.stmt','continue') )
     return this.errorHandlerOutput ;

   this.fixupLabels(false);
   if (!(this.scopeFlags & SCOPE_CONTINUE) &&
         this.err('continue.not.in.loop') )
     return this.errorHandlerOutput  ;

   var startc = this.c0, startLoc = this.locBegin();
   var c = this.c, li = this.li, col = this.col;

   this.next() ;

   var name = null, label = null, semi = 0;

   var semiLoc = null;

   if ( !this.newLineBeforeLookAhead && this.lttype === 'Identifier' ) {
       label = this.validateID(null);
       name = this.findLabel(label.name + '%');
       if (!name) this.err('continue.no.such.label',label) ;
       if (!name.loop) this.err('continue.not.a.loop.label',label);

       semi = this.semiI();
       semiLoc = this.semiLoc_soft();
       if ( !semiLoc && !this.newLineBeforeLookAhead &&
             this.err('no.semi','continue',startc,startLoc,c,li,col,semi,label) )
         return this.errorHandlerOutput;

       this.foundStatement = !false;
       return { type: 'ContinueStatement', label: label, start: startc, end: semi || label.end,
           loc: { start: startLoc, end: semiLoc || label.loc.end } };
   }
   semi = this.semiI();
   semiLoc = this.semiLoc_soft();
   if ( !semiLoc && !this.newLineBeforeLookAhead &&
         this.err('no.semi','continue',startc,startLoc,c,li,col,semi,label) )
     return this.errorHandlerOutput;

   this.foundStatement = !false;
   return { type: 'ContinueStatement', label: null, start: startc, end: semi || c,
           loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseBreakStatement = function () {
   if (! this.ensureStmt_soft   () &&
         this.err('not.stmt','break') )
     return this.errorHandlerOutput ;

   this.fixupLabels(false);
   if (!(this.scopeFlags & SCOPE_BREAK) &&
         this.err('break.not.in.breakable') )
     return this.errorHandlerOutput ;

   var startc = this.c0, startLoc = this.locBegin();
   var c = this.c, li = this.li, col = this.col;

   this.next() ;

   var name = null, label = null, semi = 0;

   var semiLoc = null;

   if ( !this.newLineBeforeLookAhead && this.lttype === 'Identifier' ) {
       label = this.validateID(null);
       name = this.findLabel(label.name + '%');
       if (!name) this.err('break.no.such.label',label);
       semi = this.semiI();
       semiLoc = this.semiLoc_soft();
       if ( !semiLoc && !this.newLineBeforeLookAhead &&
            this.err('no.semi',startc,startLoc,c,li,col,semi,label) )
         return this.errorHandlerOutput;

       this.foundStatement = !false;
       return { type: 'BreakStatement', label: label, start: startc, end: semi || label.end,
           loc: { start: startLoc, end: semiLoc || label.loc.end } };
   }
   semi = this.semiI();
   semiLoc = this.semiLoc_soft();
   if ( !semiLoc && !this.newLineBeforeLookAhead &&
        this.err('no.semi',startc,startLoc,c,li,col,semi,label) )
     return this.errorHandlerOutput;

   this.foundStatement = !false;
   return { type: 'BreakStatement', label: null, start: startc, end: semi || c,
           loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseSwitchStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt','switch') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false) ;

  var startc = this.c0,
      startLoc = this.locBegin(),
      cases = [],
      hasDefault = false ,
      scopeFlags = this.scopeFlags,
      elem = null;

  this.next() ;
  if ( !this.expectType_soft ('(') &&
       this.err('switch.has.no.opening.paren',startc,startLoc) )
    return this.errorHandlerOutput;

  var switchExpr = core(this.parseExpr(CONTEXT_NONE));
  if ( !this.expectType_soft (')') &&
        this.err('switch.has.no.closing.paren',startc,startLoc) )
    return this.errorHandlerOutput ;

  if ( !this.expectType_soft ('{') &&
        this.err('switch.has.no.opening.curly',startc,stratLoc) )
    return this.errorHandlerOutput ;

  this.enterLexicalScope(false); 
  this.scopeFlags |=  (SCOPE_BREAK|SCOPE_BLOCK);
  while ( elem = this.parseSwitchCase()) {
    if (elem.test === null) {
       if (hasDefault ) this.err('switch.has.a.dup.default',elem );
       hasDefault = !false ;
    }
    cases.push(elem);
  }

  this.scopeFlags = scopeFlags ;
  this.foundStatement = !false;
  this.exitScope(); 
  var n = { type: 'SwitchStatement', cases: cases, start: startc, discriminant: switchExpr,
            end: this.c, loc: { start: startLoc, end: this.loc() } /* ,y:-1*/};
  if ( !this.expectType_soft ('}' ) &&
        this.err('switch.unfinished',n) )
    return this.errorHandlerOutput ;

  return n;
};

this.parseSwitchCase = function () {
  var startc,
      startLoc;

  var nbody = null,
      cond  = null;

  if ( this.lttype === 'Identifier' ) switch ( this.ltval ) {
     case 'case':
       startc = this.c0;
       startLoc = this.locBegin();
       this.next();
       cond = core(this.parseExpr(CONTEXT_NONE)) ;
       break;

     case 'default':
       startc = this.c0;
       startLoc = this.locBegin();
       this.next();
       break ;

     default: return null;
  }
  else
     return null;

  var c = this.c, li = this.li, col = this.col;
  if ( ! this.expectType_soft (':') &&
       this.err('switch.case.has.no.colon',startc,startLoc,c,li,cond,col) )
    return this.errorHandlerOutput;

  nbody = this.blck();
  var last = nbody.length ? nbody[nbody.length-1] : null;
  return { type: 'SwitchCase', test: cond, start: startc, end: last ? last.end : c,
     loc: { start: startLoc, end: last ? last.loc.end : { line: li, column: col } }, consequent: nbody/* ,y:-1*/ };
};

this.parseReturnStatement = function () {
  if (! this.ensureStmt_soft () &&
       this.err('not.stmt','return') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false ) ;

  if ( !( this.scopeFlags & SCOPE_FUNCTION ) &&
          this.err('return.not.in.a.function') )
    return this.errorHandlerOutput ;

  var startc = this.c0,
      startLoc = this.locBegin(),
      retVal = null,
      li = this.li,
      c = this.c,
      col = this.col;

  this.next();

  var semi = 0, semiLoc = null;

  if ( !this.newLineBeforeLookAhead )
     retVal = this.parseExpr(CONTEXT_NULLABLE);

  semi = this.semiI();
  semiLoc = this.semiLoc();
  if ( !semiLoc && !this.newLineBeforeLookAhead &&
       this.err('no.semi','return', [startc,startLoc,c,li,col,semi,retVal] ) )
    return this.errorHandlerOutput;

  if ( retVal ) {
     this.foundStatement = !false;
     return { type: 'ReturnStatement', argument: core(retVal), start: startc, end: semi || retVal.end,
        loc: { start: startLoc, end: semiLoc || retVal.loc.end } }
  }

  this.foundStatement = !false;
  return {  type: 'ReturnStatement', argument: retVal, start: startc, end: semi || c,
     loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseThrowStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt','throw') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false ) ;

  var startc = this.c0,
      startLoc = this.locBegin(),
      retVal = null,
      li = this.li,
      c = this.c,
      col = this.col;

  this.next();

  var semi = 0 , semiLoc = null ;
  if ( this.newLineBeforeLookAhead &&
       this.err('throw.has.newline',startc,startLoc,c,li,col) )
    return this.errorHandlerOutput;

  retVal = this.parseExpr(CONTEXT_NULLABLE );
  if ( retVal === null &&
       this.err('throw.has.no.argument',[startc,startLoc,c,li,col,semi,retVal]) )
     return this.errorHandlerOutput;

  semi = this.semiI();
  semiLoc = this.semiLoc();
  if ( !semiLoc && !this.newLineBeforeLookAhead &&
        this.err('no.semi','throw',[startc,startLoc,c,li,col,semi,retVal] ) )
    return this.errorHandlerOutput;

  this.foundStatement = !false;
  return { type: 'ThrowStatement', argument: core(retVal), start: startc, end: semi || retVal.end,
     loc: { start: startLoc, end: semiLoc || retVal.loc.end } }

};

this. parseBlockStatement_dependent = function() {
    var startc = this.c - 1,
        startLoc = this.locOn(1);
    if ( !this.expectType_soft ('{') &&
         this.err('block.dependent.no.opening.curly') )
      return this.errorHandlerOutput;

    var scopeFlags = this.scopeFlags;
    this.scopeFlags |= SCOPE_BLOCK;

    var n = { type: 'BlockStatement', body: this.blck(), start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() } };
    if ( ! this.expectType_soft ('}') &&
         this.err('block.dependent.is.unfinished' , n)  )
      return this.errorHandlerOutput;

    this.scopeFlags = scopeFlags;
    return n;
};

this.parseTryStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt' ,'try' ) )
    return this.errorHandlerOutput ;

  this.fixupLabels(false);
  var startc = this.c0,
      startLoc = this.locBegin();

  this.next() ;

  this.enterLexicalScope(false); 
  var tryBlock = this.parseBlockStatement_dependent();
  this.exitScope(); 
  var finBlock = null, catBlock  = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'catch')
    catBlock = this.parseCatchClause();

  if ( this.lttype === 'Identifier' && this.ltval === 'finally') {
     this.next();
     this.enterLexicalScope(false); 
     finBlock = this.parseBlockStatement_dependent();
     this.exitScope(); 
  }

  var finOrCat = finBlock || catBlock;
  if ( ! finOrCat &&
       this.err('try.has.no.tail',startc,startLoc,tryBlock)  )
    return this.errorHandlerOutput ;

  this.foundStatement = !false;
  return  { type: 'TryStatement', block: tryBlock, start: startc, end: finOrCat.end,
            handler: catBlock, finalizer: finBlock, loc: { start: startLoc, end: finOrCat.loc.end } /* ,y:-1*/};
};

this.enterCatchScope = function() {
  this.scope = this.scope.spawnCatch();
};

this. parseCatchClause = function () {
   var startc = this.c0,
       startLoc = this.locBegin();

   this.next();

   this.enterCatchScope();
   if ( !this.expectType_soft ('(') &&
        this.err('catch.has.no.opening.paren',startc,startLoc) )
     return this.errorHandlerOutput ;

   this.scope.setDeclMode(DECL_MODE_CATCH_PARAMS);
   var catParam = this.parsePattern();
   if (this.lttype === 'op' && this.ltraw === '=')
     this.err('catch.param.has.default.val');

   this.scope.setDeclMode(DECL_MODE_NONE);
   if (catParam === null)
     this.err('catch.has.no.param');

   if ( !this.expectType_soft (')') &&
         this.err('catch.has.no.end.paren' , startc,startLoc,catParam)  )
     return this.errorHandlerOutput    ;

   var catBlock = this.parseBlockStatement_dependent();

   this.exitScope();
   return {
       type: 'CatchClause',
        loc: { start: startLoc, end: catBlock.loc.end },
       start: startc,
       end: catBlock.end,
       param: catParam ,
       body: catBlock/* ,y:-1*/
   };
};

this . parseWithStatement = function() {
   if ( !this.ensureStmt_soft () &&
         this.err('not.stmt','with' ) )
     return this.errorHandlerOutput ;

   if ( this.tight) this.err('with.strict')  ;

   this.enterLexicalScope(false);
   this.fixupLabels(false);

   var startc = this.c0,
       startLoc = this.locBegin();

   this.next();
   if (! this.expectType_soft ('(') &&
         this.err('with.has.no.opening.paren', startc, startLoc) )
     return this.errorHandlerOutput ;

   var obj = this.parseExpr(CONTEXT_NONE);
   if (! this.expectType_soft (')' ) &&
         this.err('with.has.no.end.paren',startc,startLoc,obj ) )
     return this.errorHandlerOutput ;

   var scopeFlags = this.scopeFlags;

   this.scopeFlags &= CLEAR_IB;
   var nbody = this.parseStatement(!false);
   this.scopeFlags = scopeFlags;
   
   this.foundStatement = !false;

   this.exitScope();
   return  {
       type: 'WithStatement',
       loc: { start: startLoc, end: nbody.loc.end },
       start: startc,
       end: nbody.end,
       object: obj, body: nbody/* ,y:-1*/
   };
};

this . prseDbg = function () {
  if (! this.ensureStmt_soft () &&
        this.err('not.stmt','debugger') )
    return this.errorHandlerOutput ;

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
  else if ( !this.newLineBeforeLookAhead &&
     this.err('no.semi','debugger', [startc,startLoc,c,li,col] ) )
     return this.errorHandlerOutput;

  this.foundStatement = !false;
  return {
     type: 'DebuggerStatement',
      loc: { start: startLoc, end: { line: li, column: col } } ,
     start: startc,
     end: c
   };
};

this.blck = function () { // blck ([]stmt)
  var stmts = [], stmt;
  while (stmt = this.parseStatement(!false)) stmts.push(stmt);
  return (stmts);
};


