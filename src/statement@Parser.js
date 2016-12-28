this.parseStatement = function ( allowNull ) {
  var head = null, l, e , directive = DIR_NONE;

  if (this.directive !== DIR_NONE) {
    directive = this.directive;
    if (this.st === ERR_PIN_OCTAL_IN_STRICT) {
      directive |= DIR_HAS_OCTAL_ERROR;
      this.st = ERR_NONE_YET;
    }
  }

  switch (this.lttype) {
    case '{': return this.parseBlckStatement();
    case ';': return this.parseEmptyStatement() ;
    case 'Identifier':
       this.canBeStatement = true;
       head = this.parseIdStatementOrId(CTX_NONE|CTX_PAT);
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

  if (head !== null)
    this.err('must.not.have.reached');

  head = this.parseExpr(CTX_NULLABLE|CTX_PAT|CTX_NO_SIMPLE_ERR) ;
  if ( !head ) {
    if ( !allowNull && this.err('stmt.null') )
      this.errorHandlerOutput;

    return null;
  }

  if ( head.type === 'Identifier' && this.lttype === ':')
    return this.parseLabeledStatement(head, allowNull);

  this.fixupLabels(false) ;

  if (DIR_MAYBE & directive) {
    if (head.type !== 'Literal')
      this.directive = directive|DIR_LAST;
    else {
      if (!(this.directive & DIR_HANDLED_BY_NEWLINE)) {
        ASSERT.call(this.directive === DIR_NONE,
          'an expression that is going to become a statement must have either set a non-null directive to none if it has not handled it');
        this.gotDirective(this.dv, directive);
      }
    }
    if (this.esct !== ERR_NONE_YET && this.se === null)
      this.se = head;
  }

  e  = this.semiI() || head.end;
  l = this.semiLoc_soft ();
  if ( !l && !this.nl &&
       this.err('no.semi') )
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
   if ( this.findLabel(l) && this.err('label.is.a.dup') )
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

this .ensureStmt_soft = function() {
   if ( this.canBeStatement ) {
     this.canBeStatement = false;
     return true;
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
  if ( !this.ensureStmt_soft () && this.err('not.stmt') )
    return this.errorHandlerOutput;

  this.fixupLabels(false);
  this.enterLexicalScope(false); 

  var startc = this.c0,
      startLoc  = this.locBegin();
  this.next () ;
  if ( !this.expectType_soft('(') &&
        this.err('if.has.no.opening.paren') )
    return this.errorHanlerOutput;

  var cond = core( this.parseExpr(CTX_NONE) );
  if ( !this.expectType_soft (')' ) &&
        this.err('if.has.no.closing.paren') )
    return this.errorHandlerOutput ;

  var scopeFlags = this.scopeFlags ;
  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= SCOPE_FLAG_IN_IF;
  var nbody = this. parseStatement (false);
  var alt = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'else') {
     this.next() ;
     alt = this.parseStatement(false);
  }
  this.scopeFlags = scopeFlags ;

  var scope = this.exitScope(); 

  this.foundStatement = true;
  return { type: 'IfStatement', test: cond, start: startc, end: (alt||nbody).end,
     loc: { start: startLoc, end: (alt||nbody).loc.end }, consequent: nbody, alternate: alt/*,scope:  scope  ,y:-1*/};
};

this.parseWhileStatement = function () {
   this.enterLexicalScope(true);
   if ( ! this.ensureStmt_soft () &&
          this.err('not.stmt') )
     return this.errorHandlerOutput;

   this.fixupLabels(true);

   var startc = this.c0,
       startLoc = this.locBegin();
   this.next();
   if ( !this.expectType_soft ('(') &&
         this.err('while.has.no.opening.paren') )
     return this.errorHandlerOutput;
 
   var cond = core( this.parseExpr(CTX_NONE) );
   if ( !this.expectType_soft (')') &&
         this.err('while.has.no.closing.paren') )
     return this.errorHandlerOutput;

   var scopeFlags = this.scopeFlags;
   this.scopeFlags &= CLEAR_IB;
   this.scopeFlags |= (SCOPE_FLAG_CONTINUE|SCOPE_FLAG_BREAK );
   var nbody = this.parseStatement(false);
   this.scopeFlags = scopeFlags ;
   this.foundStatement = true;

   var scope = this.exitScope();
   return { type: 'WhileStatement', test: cond, start: startc, end: nbody.end,
       loc: { start: startLoc, end: nbody.loc.end }, body:nbody/*,scope:  scope ,y:-1*/ };
};

this.parseBlckStatement = function () {
  this.fixupLabels(false);

  this.enterLexicalScope(false); 
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next();
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= SCOPE_FLAG_IN_BLOCK;

  var n = { type: 'BlockStatement', body: this.blck(), start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() }/*,scope:  this.scope  ,y:-1*/};

  if ( !this.expectType_soft ('}' ) &&
        this.err('block.unfinished') )
    return this.errorHandlerOutput ;

  this.exitScope(); 
  this.scopeFlags = scopeFlags;
  return n;
};

this.parseDoWhileStatement = function () {
  if ( !this.ensureStmt_soft () &&
        this.err('not.stmt') )
    return this.errorHandlerOutput ;

  this.enterLexicalScope(true); 
  this.fixupLabels(true);

  var startc = this.c0,
      startLoc = this.locBegin() ;
  this.next() ;
  var scopeFlags = this.scopeFlags;
  this.scopeFlags &= CLEAR_IB;
  this.scopeFlags |= (SCOPE_FLAG_BREAK| SCOPE_FLAG_CONTINUE);
  var nbody = this.parseStatement (true) ;
  this.scopeFlags = scopeFlags;
  if ( !this.expectID_soft('while') &&
        this.err('do.has.no.while') )
    return this.errorHandlerOutput;

  if ( !this.expectType_soft('(') &&
        this.err('do.has.no.opening.paren') )
    return this.errorHandlerOutput;

  var cond = core(this.parseExpr(CTX_NONE));
  var c = this.c, li = this.li, col = this.col;
  if ( !this.expectType_soft (')') &&
        this.err('do.has.no.closing.paren') )
    return this.errorHandlerOutput;

  if (this.lttype === ';' ) {
     c = this.c;
     li = this.li ;
     col = this.col;
     this.next();
  }

 this.foundStatement = true;

 this.exitScope(); 
 return { type: 'DoWhileStatement', test: cond, start: startc, end: c,
          body: nbody, loc: { start: startLoc, end: { line: li, column: col } } /* ,y:-1*/} ;
};

this.parseContinueStatement = function () {
   if ( ! this.ensureStmt_soft   () &&
          this.err('not.stmt') )
     return this.errorHandlerOutput ;

   this.fixupLabels(false);
   if (!(this.scopeFlags & SCOPE_FLAG_CONTINUE) &&
         this.err('continue.not.in.loop') )
     return this.errorHandlerOutput  ;

   var startc = this.c0, startLoc = this.locBegin();
   var c = this.c, li = this.li, col = this.col;

   this.next() ;

   var name = null, label = null, semi = 0;

   var semiLoc = null;

   if ( !this.nl && this.lttype === 'Identifier' ) {
       label = this.validateID("");
       name = this.findLabel(label.name + '%');
       if (!name) this.err('continue.no.such.label') ;
       if (!name.loop) this.err('continue.not.a.loop.label');

       semi = this.semiI();
       semiLoc = this.semiLoc_soft();
       if ( !semiLoc && !this.nl &&
             this.err('no.semi') )
         return this.errorHandlerOutput;

       this.foundStatement = true;
       return { type: 'ContinueStatement', label: label, start: startc, end: semi || label.end,
           loc: { start: startLoc, end: semiLoc || label.loc.end } };
   }
   semi = this.semiI();
   semiLoc = this.semiLoc_soft();
   if ( !semiLoc && !this.nl &&
         this.err('no.semi') )
     return this.errorHandlerOutput;

   this.foundStatement = true;
   return { type: 'ContinueStatement', label: null, start: startc, end: semi || c,
           loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseBreakStatement = function () {
   if (! this.ensureStmt_soft   () &&
         this.err('not.stmt') )
     return this.errorHandlerOutput ;

   this.fixupLabels(false);
   var startc = this.c0, startLoc = this.locBegin();
   var c = this.c, li = this.li, col = this.col;

   this.next() ;

   var name = null, label = null, semi = 0;

   var semiLoc = null;

   if ( !this.nl && this.lttype === 'Identifier' ) {
       label = this.validateID("");
       name = this.findLabel(label.name + '%');
       if (!name) this.err('break.no.such.label');
       semi = this.semiI();
       semiLoc = this.semiLoc_soft();
       if ( !semiLoc && !this.nl &&
            this.err('no.semi') )
         return this.errorHandlerOutput;

       this.foundStatement = true;
       return { type: 'BreakStatement', label: label, start: startc, end: semi || label.end,
           loc: { start: startLoc, end: semiLoc || label.loc.end } };
   }
   else if (!(this.scopeFlags & SCOPE_FLAG_BREAK) &&
         this.err('break.not.in.breakable') )
     return this.errorHandlerOutput ;

   semi = this.semiI();
   semiLoc = this.semiLoc_soft();
   if ( !semiLoc && !this.nl &&
        this.err('no.semi') )
     return this.errorHandlerOutput;

   this.foundStatement = true;
   return { type: 'BreakStatement', label: null, start: startc, end: semi || c,
           loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseSwitchStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt') )
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
       this.err('switch.has.no.opening.paren') )
    return this.errorHandlerOutput;

  var switchExpr = core(this.parseExpr(CTX_NONE));
  if ( !this.expectType_soft (')') &&
        this.err('switch.has.no.closing.paren') )
    return this.errorHandlerOutput ;

  if ( !this.expectType_soft ('{') &&
        this.err('switch.has.no.opening.curly') )
    return this.errorHandlerOutput ;

  this.enterLexicalScope(false); 
  this.scopeFlags |=  (SCOPE_FLAG_BREAK|SCOPE_FLAG_IN_BLOCK);
  while ( elem = this.parseSwitchCase()) {
    if (elem.test === null) {
       if (hasDefault ) this.err('switch.has.a.dup.default');
       hasDefault = true ;
    }
    cases.push(elem);
  }

  this.scopeFlags = scopeFlags ;
  this.foundStatement = true;

  var scope = this.exitScope(); 
  var n = { type: 'SwitchStatement', cases: cases, start: startc, discriminant: switchExpr,
            end: this.c, loc: { start: startLoc, end: this.loc() }/*,scope:  scope  ,y:-1*/};
  if ( !this.expectType_soft ('}' ) &&
        this.err('switch.unfinished') )
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
       cond = core(this.parseExpr(CTX_NONE)) ;
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
       this.err('switch.case.has.no.colon') )
    return this.errorHandlerOutput;

  nbody = this.blck();
  var last = nbody.length ? nbody[nbody.length-1] : null;
  return { type: 'SwitchCase', test: cond, start: startc, end: last ? last.end : c,
     loc: { start: startLoc, end: last ? last.loc.end : { line: li, column: col } }, consequent: nbody/* ,y:-1*/ };
};

this.parseReturnStatement = function () {
  if (! this.ensureStmt_soft () &&
       this.err('not.stmt') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false ) ;

  if ( !( this.scopeFlags & SCOPE_FLAG_FN ) &&
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

  if ( !this.nl )
     retVal = this.parseExpr(CTX_NULLABLE);

  semi = this.semiI();
  semiLoc = this.semiLoc_soft();
  if ( !semiLoc && !this.nl &&
       this.err('no.semi') )
    return this.errorHandlerOutput;

  if ( retVal ) {
     this.foundStatement = true;
     return { type: 'ReturnStatement', argument: core(retVal), start: startc, end: semi || retVal.end,
        loc: { start: startLoc, end: semiLoc || retVal.loc.end } }
  }

  this.foundStatement = true;
  return {  type: 'ReturnStatement', argument: retVal, start: startc, end: semi || c,
     loc: { start: startLoc, end: semiLoc || { line: li, column : col } } };
};

this.parseThrowStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt') )
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
  if ( this.nl &&
       this.err('throw.has.newline') )
    return this.errorHandlerOutput;

  retVal = this.parseExpr(CTX_NULLABLE );
  if ( retVal === null &&
       this.err('throw.has.no.argument') )
     return this.errorHandlerOutput;

  semi = this.semiI();
  semiLoc = this.semiLoc_soft();
  if ( !semiLoc && !this.nl &&
        this.err('no.semi') )
    return this.errorHandlerOutput;

  this.foundStatement = true;
  return { type: 'ThrowStatement', argument: core(retVal), start: startc, end: semi || retVal.end,
     loc: { start: startLoc, end: semiLoc || retVal.loc.end } }

};

this. parseBlockStatement_dependent = function(owner) {
    var startc = this.c - 1,
        startLoc = this.locOn(1);

    if (!this.expectType_soft ('{'))
      this.err('block.dependent.no.opening.curly');
    var scopeFlags = this.scopeFlags;
    this.scopeFlags |= SCOPE_FLAG_IN_BLOCK;

    var n = { type: 'BlockStatement', body: this.blck(), start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() }/*,scope:  this.scope  ,y:-1*/ };
    if ( ! this.expectType_soft ('}') &&
         this.err('block.dependent.is.unfinished')  )
      return this.errorHandlerOutput;

    this.scopeFlags = scopeFlags;
    return n;
};

this.parseTryStatement = function () {
  if ( ! this.ensureStmt_soft () &&
         this.err('not.stmt') )
    return this.errorHandlerOutput ;

  this.fixupLabels(false);
  var startc = this.c0,
      startLoc = this.locBegin();

  this.next() ;

  this.enterLexicalScope(false); 

  var tryBlock = this.parseBlockStatement_dependent('try');
  this.exitScope(); 
  var finBlock = null, catBlock  = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'catch')
    catBlock = this.parseCatchClause();

  if ( this.lttype === 'Identifier' && this.ltval === 'finally') {
     this.next();

     this.enterLexicalScope(false); 
     finBlock = this.parseBlockStatement_dependent('finally');
     this.exitScope(); 
  }

  var finOrCat = finBlock || catBlock;
  if ( ! finOrCat &&
       this.err('try.has.no.tail')  )
    return this.errorHandlerOutput ;

  this.foundStatement = true;
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
        this.err('catch.has.no.opening.paren') )
     return this.errorHandlerOutput ;

   this.declMode = DECL_MODE_CATCH_PARAMS;
   var catParam = this.parsePattern();
   if (this.lttype === 'op' && this.ltraw === '=')
     this.err('catch.param.has.default.val');

   this.declMode = DECL_NONE;
   if (catParam === null)
     this.err('catch.has.no.param');

   if ( !this.expectType_soft (')') &&
         this.err('catch.has.no.end.paren')  )
     return this.errorHandlerOutput    ;

   var catBlock = this.parseBlockStatement_dependent('catch');

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
         this.err('not.stmt') )
     return this.errorHandlerOutput ;

   if ( this.tight) this.err('with.strict')  ;

   this.enterLexicalScope(false);
   this.fixupLabels(false);

   var startc = this.c0,
       startLoc = this.locBegin();

   this.next();
   if (! this.expectType_soft ('(') &&
         this.err('with.has.no.opening.paren') )
     return this.errorHandlerOutput ;

   var obj = this.parseExpr(CTX_NONE);
   if (! this.expectType_soft (')' ) &&
         this.err('with.has.no.end.paren') )
     return this.errorHandlerOutput ;

   var scopeFlags = this.scopeFlags;

   this.scopeFlags &= CLEAR_IB;
   var nbody = this.parseStatement(true);
   this.scopeFlags = scopeFlags;
   
   this.foundStatement = true;

   var scope = this.exitScope();
   return  {
       type: 'WithStatement',
       loc: { start: startLoc, end: nbody.loc.end },
       start: startc,
       end: nbody.end,
       object: obj, body: nbody/*,scope:  scope ,y:-1*/
   };
};

this . prseDbg = function () {
  if (! this.ensureStmt_soft () &&
        this.err('not.stmt') )
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
  else if ( !this.nl &&
     this.err('no.semi') )
     return this.errorHandlerOutput;

  this.foundStatement = true;
  return {
     type: 'DebuggerStatement',
      loc: { start: startLoc, end: { line: li, column: col } } ,
     start: startc,
     end: c
   };
};

this.blck = function () { // blck ([]stmt)
  var isFunc = false, stmt = null, stmts = [];
  if (this.directive !== DIR_NONE)
    this.parseDirectives(stmts);

  while (stmt = this.parseStatement(true))
    stmts.push(stmt);

  return (stmts);
};

this.checkForStrictError = function(directive) {
  if (this.esct !== ERR_NONE_YET)
    this.err('strict.err.esc.not.valid');
};

this.parseDirectives = function(list) {
  if (this.v < 5)
    return;

  var r = this.directive;

  // TODO: maybe find a way to let the `readStringLiteral` take over this process (partially, at the very least);
  // that way, there will no longer be a need to check ltval's type
  while (this.lttype === 'Literal' && typeof this.ltval === STRING_TYPE) {
    this.directive = DIR_MAYBE|r;
    var rv = this.src.substring(this.c0+1, this.c-1);

    // other directives might actually come after "use strict",
    // but that is the only one we are interested to find; TODO: this behavior ought to change
    if (rv === 'use strict')
      this.directive |= DIR_LAST;

    this.dv.value = this.ltval;
    this.dv.raw = rv;

    var elem = this.parseStatement(true);
    list.push(elem);

    if (this.directive & DIR_LAST)
      break;

  }

  this.directive = DIR_NONE;
};

this.gotDirective = function(dv, flags) {
  if (dv.raw === 'use strict') {
    if (flags & DIR_FUNC)
      this.makeStrict()
    else {
      this.tight = true;
      this.scope.strict = true;
    }

    this.checkForStrictError(flags);
  }
};
 
this.clearAllStrictErrors = function() {
  this.esct = ERR_NONE_YET;
  this.se = null;
};
 
