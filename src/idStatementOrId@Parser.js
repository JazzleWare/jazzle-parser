this . notId = function(id) { throw new Error ( 'not a valid id '   +   id )   ;  } ;
this. parseIdStatementOrId = function ( context ) {
  var id = this.ltval ;
  var pendingExprHead = null;

  SWITCH:
  switch (id.length) {
  case 1:
    pendingExprHead = this.id(); break SWITCH ;

  case 2:
    switch (id) {
    case 'do':
      this.resvchk();
      return this.parseDoWhileStatement();
    case 'if':
      this.resvchk();
      return this.parseIfStatement();
    case 'in':
      this.resvchk();
      // TODO: is it actually needed anymore?
      if ( context & CTX_FOR )
        return null;
 
       this.notId() ;
    default: pendingExprHead = this.id(); break SWITCH ;
    }

  case 3:
    switch (id) {
    case 'new':
      this.resvchk();
      if ( this.canBeStatement ) {
        this.canBeStatement = false ;
        this.pendingExprHead = this.parseNewHead();
        return null;
      }
      return this.parseNewHead();

    case 'for':
      this.resvchk();
      return this.parseFor();
    case 'try':
      this.resvchk();
      return this.parseTryStatement();
    case 'let':
      if ( this.canBeStatement && this.v >= 5 )
        return this.parseLet(CTX_NONE);

      if (this.tight) this.err('strict.let.is.id');

      pendingExprHead = this.id();
      break SWITCH;

    case 'var':
      this.resvchk();
      return this.parseVariableDeclaration( context & CTX_FOR );
    case 'int':
      if (this.v <= 5) {
        this.errorReservedID();
      }

    default: pendingExprHead = this.id(); break SWITCH  ;
    }

  case 4:
    switch (id) {
    case 'null':
      this.resvchk();
      pendingExprHead = this.parseNull();
      break SWITCH;
    case 'void':
      this.resvchk();
      if ( this.canBeStatement )
         this.canBeStatement = false;
      this.lttype = 'u'; 
      this.isVDT = VDT_VOID;
      return null;
    case 'this':
      this.resvchk();
      pendingExprHead = this. parseThis();
      break SWITCH;
    case 'true':
      this.resvchk();
      pendingExprHead = this.parseTrue();
      break SWITCH;
    case 'case':
      this.resvchk();
      if ( this.canBeStatement ) {
        this.foundStatement = true;
        this.canBeStatement = false ;
        return null;
      }

    case 'else':
      this.resvchk();
      this.notId();
    case 'with':
      this.resvchk();
      return this.parseWithStatement();
    case 'enum': case 'byte': case 'char':
    case 'goto': case 'long':
      if (this. v <= 5 ) this.errorReservedID();

    default: pendingExprHead = this.id(); break SWITCH  ;
  }

  case 5:
    switch (id) {
    case 'super':
      this.resvchk();
      pendingExprHead = this.parseSuper();
      break SWITCH;
    case 'break':
      this.resvchk();
      return this.parseBreakStatement();
    case 'catch':
      this.resvchk();
      this.notId();
    case 'class':
      this.resvchk();
      return this.parseClass(CTX_NONE ) ;
    case 'const':
      this.resvchk();
      if (this.v<5) this.err('const.not.in.v5') ;
      return this.parseVariableDeclaration(CTX_NONE);

    case 'throw':
      this.resvchk();
      return this.parseThrowStatement();
    case 'while':
      this.resvchk();
      return this.parseWhileStatement();
    case 'yield': 
      if ( this.scopeFlags & SCOPE_FLAG_GEN ) {
        this.resvchk();
        if (this.scopeFlags & SCOPE_FLAG_ARG_LIST)
          this.err('yield.args');

        if ( this.canBeStatement )
          this.canBeStatement = false;

        this.lttype = 'yield';
        return null;
      }
      else if (this.tight) this.errorReservedID(null);

      pendingExprHead = this.id();
      break SWITCH;
          
    case 'false':
      this.resvchk();
      pendingExprHead = this.parseFalse();
      break SWITCH;

    case 'await':
      if (this.scopeFlags & SCOPE_FLAG_ALLOW_AWAIT_EXPR) {
        this.resvchk();
        if (this.scopeFlags & SCOPE_FLAG_ARG_LIST)
          this.err('await.args');
        if (this.canBeStatement)
          this.canBeStatement = false;
        this.isVDT = VDT_AWAIT;
        this.lttype = 'u';
        return null;
      }
      if (this.tight) {
        this.resvchk();
        this.err('await.in.strict');
      }

      pendingExprHead = this.id();
      break SWITCH;

    case 'async':
      pendingExprHead = this.parseAsync(context);
      break SWITCH;

    case 'final':
    case 'float':
    case 'short':
      if ( this. v <= 5 ) this.errorReservedID() ;
    default: pendingExprHead = this.id(); break SWITCH ;
    }

  case 6: switch (id) {
    case 'static':
      if (this.tight || this.v <= 5)
        this.errorReservedID();

    case 'delete':
    case 'typeof':
      this.resvchk();
      if ( this.canBeStatement )
        this.canBeStatement = false ;
      this.lttype = 'u'; 
      this.isVDT = id === 'delete' ? VDT_DELETE : VDT_VOID;
      return null;

    case 'export': 
      this.resvchk();
      if ( this.isScript && this.err('export.not.in.module') )
        return this.errorHandlerOutput;

      return this.parseExport() ;

    case 'import':
      this.resvchk();
      if ( this.isScript && this.err('import.not.in.module') )
        return this.errorHandlerOutput;

      return this.parseImport();

    case 'return':
      this.resvchk();
      return this.parseReturnStatement();
    case 'switch':
      this.resvchk();
      return this.parseSwitchStatement();
    case 'public':
      if (this.tight) this.errorReservedID();
    case 'double': case 'native': case 'throws':
      if ( this. v <= 5 ) this.errorReservedID();

    default: pendingExprHead = this.id(); break SWITCH ;
    }

  case 7:
    switch (id) {
    case 'default':
      this.resvchk();
      if ( this.canBeStatement ) this.canBeStatement = false ;
      return null;

    case 'extends': case 'finally':
      this.resvchk();
      this.notId();

    case 'package': case 'private':
      if (this.tight)
        this.errorReservedID();

    case 'boolean':
      if (this.v <= 5)
        this.errorReservedID();

    default: pendingExprHead = this.id(); break SWITCH  ;
    }

  case 8:
    switch (id) {
    case 'function':
      this.resvchk();
      return this.parseFunc(context&CTX_FOR, 0 );
    case 'debugger':
      this.resvchk();
      return this.prseDbg();
    case 'continue':
      this.resvchk();
      return this.parseContinueStatement();
    case 'abstract': case 'volatile':
      if ( this. v <= 5 ) this.errorReservedID();

    default: pendingExprHead = this.id(); break SWITCH  ;
    }

  case 9:
    switch (id ) {
    case 'interface': case 'protected':
      if (this.tight) this.errorReservedID() ;

    case 'transient':
      if (this.v <= 5) this.errorReservedID();

    default: pendingExprHead = this.id(); break SWITCH  ;
    }

  case 10:
    switch ( id ) {
    case 'instanceof':
       this.resvchk();
       this.notId();
    case 'implements':
      if ( this.v <= 5 || this.tight )
        this.errorReservedID(id);

    default: pendingExprHead = this.id(); break SWITCH ;
    }

  case 12:
     if ( this.v <= 5 && id === 'synchronized' ) this.errorReservedID();

  default: pendingExprHead = this.id();

  }

  if ( this.canBeStatement ) {
    this.canBeStatement = false;
    this.pendingExprHead = pendingExprHead;
    return null;
  }

  return pendingExprHead;
};
 
this.resvchk = function() {
  if (this.esct !== ERR_NONE_YET) {
    ASSERT.call(this.esct === ERR_PIN_UNICODE_IN_RESV,
      'the error in this.esct is something other than ERR_PIN_UNICODE_IN_RESV: ' + this.esct);
    this.err('resv.unicode');
  }
};

