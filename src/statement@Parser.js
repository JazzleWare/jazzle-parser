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
  return { type: 'IfStatement', test: cond, start: startc, end: (alt||nbody).end,
     loc: { start: startLoc, end: (alt||nbody).loc.end }, consequent: nbody, alternate: alt, y: y };
};

this.parseWhileStatement = function () {
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
   return { type: 'WhileStatement', test: cond, start: startc, end: nbody.end,
       loc: { start: startLoc, end: nbody.loc.end }, body:nbody, y: y };
};

this.parseBlckStatement = function () {
  this.fixupLabels(false);
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next();
  var b = this.blck();
  var n = { type: 'BlockStatement', body: b, start: startc, end: this.c,
        loc: { start: startLoc, end: this.loc() }, y: this.y };

  if ( !this.expectType_soft ('}' ) )
     this['block.unfinished'](n);

  return n;
};

this.parseDoWhileStatement = function () {
  if ( !this.ensureStmt_soft () )
     this['not.stmt']('do-while');

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
  return {  type: 'ThrowStatement', argument: retVal, start: startc, end: semi || retVal.end,
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

  var tryBlock = this.parseBlockStatement_dependent();
  var y = this.y;
  
  var finBlock = null, catBlock  = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'catch') {
    catBlock = this.parseCatchClause();
    y += this.y;
  }

  if ( this.lttype === 'Identifier' && this.ltval === 'finally') {
     this.next();
     finBlock = this.parseBlockStatement_dependent();
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
   if ( !this.expectType_soft ('(') )
     this['catch.has.no.opening.paren'](startc,startLoc);

   var catParam = this.parsePattern();
   var y = this.y;

   if (this.lttype=='op' && this.ltval=='=') {
     catParam = this.parseAssig(catParam);
     y += this.y;
   }

   if ( !this.expectType_soft (')') )
      this['catch.has.no.end.paren' ] (startc,startLoc);

   var catBlock = this.parseBlockStatement_dependent();
   this.y += y;

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


