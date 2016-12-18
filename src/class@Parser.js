this. parseClass = function(context) {
  var startc = this.c0,
      startLoc = this.locBegin();

  var isStmt = false, name = null;
  if (this.canBeStatement) {
    isStmt = true;
    this.canBeStatement = false;
  }
  this.next(); // 'class'

  if (isStmt) {
    if (!this.canDeclareClassInScope())
      this.err('class.decl.not.in.block', startc, startLoc);
    if (this.lttype === 'Identifier' && this.ltval !== 'extends') {
      this.declMode = DECL_MODE_CLASS_DECL;
      name = this.parsePattern();
    }
    else if (!(context & CTX_DEFAULT))
      this.err('class.decl.has.no.name');
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
    this.err('class.no.curly');

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

  if (!this.expectType_soft('}'))
    this.err('class.unfinished');

  if (isStmt)
    this.foundStatement = true;

  return n;
};

this.parseSuper = function() {
  var n = {
    type: 'Super', loc: { start: this.locBegin(), end: this.loc() },
    start: this.c0, end: this.c
  };
 
  this.next();
  switch ( this.lttype ) {
  case '(':
    if ((this.scopeFlags & SCOPE_FLAG_CONSTRUCTOR_WITH_SUPER) !==
      SCOPE_FLAG_CONSTRUCTOR_WITH_SUPER)
      this.err('class.super.call');
 
    break;
 
  case '.':
  case '[':
    if (!(this.scopeFlags & SCOPE_FLAG_ALLOW_SUPER))
      this.err('class.super.mem');
 
    break ;
  
  default:
    this.err('class.super.lone'); 

  }
 
  if (!this.firstYS)
    this.firstYS = n;
 
  return n;
};
