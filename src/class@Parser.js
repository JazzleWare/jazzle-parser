this. parseClass = function(context) {
  if (this.v <= 5)
    this.err('ver.class');
  if (this.unsatisfiedLabel)
    this.err('class.label.not.allowed');

  var startc = this.c0,
      startLoc = this.locBegin();

  var isStmt = false, name = null;
  if (this.canBeStatement) {
    isStmt = true;
    this.canBeStatement = false;
  }
  this.next(); // 'class'

  var prevStrict = this.tight;

  this.tight = true;

  // TODO: this is highly unnecessary, and prone to many errors if missed
//this.scope.strict = true;

  if (isStmt) {
    if (!this.canDeclareClassInScope())
      this.err('class.decl.not.in.block',{c0:startc,loc0:startLoc});
    if (this.lttype === 'Identifier' && this.ltval !== 'extends') {
      this.declMode = DECL_MODE_CLASS_STMT;
      name = this.parsePattern();
    }
    else if (!(context & CTX_DEFAULT))
      this.err('class.decl.has.no.name', {c0:startc,loc0:startLoc});
  }
  else if (this.lttype === 'Identifier' && this.ltval !== 'extends') {
    this.enterLexicalScope(false);
    this.scope.synth = true;
    this.declMode = DECL_MODE_CLASS_EXPR;
    name = this.parsePattern();
  }

  var memParseFlags = MEM_CLASS;
  var superClass = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'extends' ) {
     this.next();
     superClass = this.parseExprHead(CTX_NONE);
     memParseFlags |= MEM_SUPER;
  }

  var list = [];
  var startcBody = this.c - 1, startLocBody = this.locOn(1);

  if (!this.expectType_soft('{'))
    this.err('class.no.curly',{c0:startc,loc0:startLoc,extra:{n:name,s:superClass,c:context}});

  var elem = null;

  while (true) {
    if (this.lttype === ';') {
      this.next();
      continue;
    }
    elem = this.parseMem(CTX_NONE, memParseFlags);
    if (elem !== null) {
      list.push(elem);
      if (elem.kind === 'constructor')
        memParseFlags |= MEM_HAS_CONSTRUCTOR;
    }
    else break;
  }

  var endLoc = this.loc();
  var n = {
    type: isStmt ? 'ClassDeclaration' : 'ClassExpression', id: name, start: startc,
    end: this.c, superClass: superClass,
    loc: { start: startLoc, end: endLoc },
    body: {
      type: 'ClassBody', loc: { start: startLocBody, end: endLoc },
      start: startcBody, end: this.c,
      body: list/* ,y:-1*/
    }/* ,y:-1*/ 
  };

  this.tight = prevStrict;

  if (!this.expectType_soft('}'))
    this.err('class.unfinished',{tn:n, extra:{delim:'}'}});

  if (isStmt)
    this.foundStatement = true;

  return n;
};

this.parseSuper = function() {
  if (this.v <=5 ) this.err('ver.super');

  var n = {
    type: 'Super', loc: { start: this.locBegin(), end: this.loc() },
    start: this.c0, end: this.c
  };
 
  this.next();
  switch ( this.lttype ) {
  case '(':
    if ((this.scopeFlags & SCOPE_FLAG_CONSTRUCTOR_WITH_SUPER) !==
      SCOPE_FLAG_CONSTRUCTOR_WITH_SUPER)
      this.err('class.super.call',{tn:n});
 
    break;
 
  case '.':
  case '[':
    if (!(this.scopeFlags & SCOPE_FLAG_ALLOW_SUPER))
      this.err('class.super.mem',{tn:n});
 
    break ;
  
  default:
    this.err('class.super.lone',{tn:n}); 

  }
 
  return n;
};
