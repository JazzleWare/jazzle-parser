this.noNameError = function() { 
    return this.err('u.token', this.locAndType() );
};

this.ctorMultiError = function() {
  return this.err( 'class.ctor.multi' );
};

this. parseClass = function(context) {
  var startc = this.c0,
      startLoc = this.locBegin();

  var canBeStatement = this.canBeStatement, name = null;
  this.next () ;

  if ( canBeStatement ) {
     if (!(this.scopeFlags & SCOPE_BLOCK))
       this.err('class.decl.not.in.block', startc, startLoc);

     if ( context !== CONTEXT_DEFAULT ) {
       if ( this.lttype !== 'Identifier' ) {
         if ( this.noNameError() ) return this.errorHandlerOutput;
       }
       else
         name = this. validateID(null);
     }
     this.canBeStatement = false;
  }
  else if ( this.lttype === 'Identifier' && this.ltval !== 'extends' )
     name = this.validateID(null); 

  var memParseFlags = MEM_CLASS;
  var classExtends = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'extends' ) {
     this.next();
     classExtends = this.parseExprHead(CONTEXT_NONE);
     memParseFlags |= MEM_SUPER;
  }

  var list = [];
  var nbodyStartc = this.c - 1, nbodyStartLoc = this.locOn(1);

  this.expectType ( '{' ) ;
  var elem = null, foundConstructor = false;

  var startcStatic, liStatic, colStatic, rawStatic, cStatic, startLocStatic;
  var isStatic = false;

  WHILE:
  while (true) {
    if (this.lttype === ';') {
      this.next();
      continue;
    }
    elem = this.parseMem(CONTEXT_NONE, memParseFlags);
    if (elem !== null) {
      list.push(elem);
      if (elem.kind === 'constructor')
        memParseFlags |= MEM_HAS_CONSTRUCTOR;
    }
    else 
      break;
  }

  var endLoc = this.loc();
  var n = { type: canBeStatement ? 'ClassDeclaration' : 'ClassExpression',
            id: name,
           start: startc,
            end: this.c,
           superClass: classExtends,
           loc: { start: startLoc, end: endLoc },
            body: { type: 'ClassBody',
                   loc: { start: nbodyStartLoc, end: endLoc },
                   start: nbodyStartc,
                    end: this.c,
                    body: list/* ,y:-1*/ }/* ,y:-1*/ };

  this.expectType('}');
  if ( canBeStatement ) { this.foundStatement = !false; }

  return n;
};

this.parseSuper  = function   () {
   var n = { type: 'Super', loc: { start: this.locBegin(), end: this.loc() }, start: this.c0 , end: this.c };
   this.next() ;
   switch ( this.lttype ) {
        case '(':
          if ( (this.scopeFlags & (SCOPE_FLAG_ALLOW_SUPER|MEM_CONSTRUCTOR)) !== (SCOPE_FLAG_ALLOW_SUPER|MEM_CONSTRUCTOR) &&
                  this.err('class.super.call') ) return this.errorHandlerOutput;
          break ;
        case '.':
        case '[':
           if ( !(this.scopeFlags & SCOPE_FLAG_ALLOW_SUPER) &&
                  this.err('class.super.mem') ) return this.errorHandlerOutput ;
           break ;
        
       default:
          if ( this.err('class.super.lone') )
            return this.errorHandlerOutput ; 
   }

   if ( !this.firstYS )
         this.firstYS = n;

   return n;
};


