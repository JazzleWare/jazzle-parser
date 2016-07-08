_class . notId = function(id) { throw new Error ( 'not a valid id '   +   id )   ;  } ;
_class. parseIdStatementOrOrId = function ( context ) {
  var id = this.ltval ;
  var pendingExprHead = null;

  SWITCH:
  switch (id.length) {
    case 1:
       pendingExprHead = this.id(); break SWITCH ;

    case 2: switch (id) {
        case 'do': return this.parseDoWhileStatement();
        case 'if': return this.parseIfStatement();
        case 'in':
           if ( context & CONTEXT_FOR )
             return null;
 
           this.notId() ;
        default: pendingExprHead = this.id(); break SWITCH ;
    }

    case 3: switch (id) {
        case 'new':
             if ( this.canBeStatement ) {
                this.canBeStatement = false ;
                this.pendingExprHead = this.parseNewHead();
                return null;
             }
             return this.parseNewHead();

        case 'for': return this.parseFor();
        case 'try': return this.parseTryStatement();
        case 'let':
             if ( this.canBeStatement && this.v >= 5 )
               return this.parseLet(CONTEXT_NONE);

             _assert(!this.tight);
             pendingExprHead = this.id();
             break SWITCH;

        case 'var': return this.parseVariableDeclaration( context & CONTEXT_FOR );
        case 'int':
            if ( this.v <= 5 )
              this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 4: switch (id) {
        case 'null':
            pendingExprHead = this.idLit(null);
            break SWITCH;
        case 'void':
            if ( this.canBeStatement )
               this.canBeStatement = false;
            this.lttype = 'u'; 
            this.isVDT = !false;
            return null;
        case 'this':
            pendingExprHead = this. parseThis();
            break SWITCH;
        case 'true':
            pendingExprHead = this.idLit(!false);
            break SWITCH;
        case 'case':
            if ( this.canBeStatement ) this.canBeStatement = false ;
            return null;

        case 'else':
            this.notId();
        case 'with':
            return this.parseWithStatement();
        case 'enum': case 'byte': case 'char': case 'goto':
        case 'long':
            if ( this. v <= 5 ) this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 5: switch (id) {
        case 'super': pendingExprHead = this.parseSuper(); break SWITCH;
        case 'break': return this.parseBreakStatement();
        case 'catch': this.notId ()  ;
        case 'class': return this.parseClass() ;
        case 'const':
            _assert(this.v>=5);
            return this.parseVariableDeclaration(CONTEXT_NONE);

        case 'throw': return this.parseThrowStatement();
        case 'while': return this.parseWhileStatement();
        case 'yield': 
             if ( this.scopeFlags & SCOPE_YIELD ) {
                if ( this.canBeStatement )
                     this.canBeStatement = false;

                this.lttype = 'yield';
                return null;
             }

             pendingExprHead = this.id();
             break SWITCH;
                 
        case 'false':
                pendingExprHead = this.idLit(false);
                break  SWITCH;
        case 'final':
        case 'float':
        case 'short':
            if ( this. v <= 5 ) this.errorReservedID() ;
        case 'await':
        default: pendingExprHead = this.id(); break SWITCH ;
    }

    case 6: switch (id) {
        case 'static':
            if ( this.tight || this.v <= 5 )
               this.error();

        case 'delete':
        case 'typeof':
            if ( this.canBeStatement )
               this.canBeStatement = false ;
            this.lttype = 'u'; 
            this.isVDT = !false;
            return null;

        case 'export': (parse) = _class.stmtPrse_export; break;
        case 'import': parse = _class.stmtPrse_import; break;
        case 'return': return this.parseReturnStatement();
        case 'switch': return this.parseSwitchStatement();
        case 'double': case 'native': case 'throws':
            if ( this. v <= 5 ) this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH ;
    }

    case 7: switch (id) {
        case 'default':
           if ( this.canBeStatement ) this.canBeStatement = false ;
           return null;

        case 'extends': case 'finally':
           this.notId() ;

        case 'package': case 'private':
            if ( this. tight  )
               this.errorReservedID();

        case 'boolean':
            if ( this. v <= 5 )
               this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 8: switch (id) {
        case 'function': return this.parseFunc(context&CONTEXT_FOR, WHOLE_FUNCTION, ANY_ARG_LEN );
        case 'debugger': return this.prseDbg();
        case 'continue': return this.parseContinueStatement();
        case 'abstract': case 'volatile':
           if ( this. v <= 5 ) this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 9: switch (id ) {
        case 'interface': case 'protected':
           if (this.tight) this.errorReservedID() ;

        case 'transient':
           if (this.v <= 5) this.errorReservedID();

        default: pendingExprHead = this.id(); break SWITCH  ;
    }

    case 10: switch ( id ) {
        case 'instanceof':
           this.notId()  ;
        case 'implements':
           if ( this.v <= 5 || this.tight )
             this.resv();

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
 
