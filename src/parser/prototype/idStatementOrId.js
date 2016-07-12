var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;

module.exports.notId = function(id) {
  throw new Error ('not a valid id ' + id);
};

module.exports.parseIdStatementOrId =  function( context ) {
  var id = this.ltval ;
  var pendingExprHead = null;

  SWITCH:
  switch (id.length) {
  case 1:
    pendingExprHead = this.id(); break SWITCH ;

  case 2:
    switch (id) {
    case 'do': return this.parseDoWhileStatement();
    case 'if': return this.parseIfStatement();
    case 'in':
      if ( context & CONTEXT.FOR )
        return null;

      this.notId() ;
    //  break;
    //  fall through
    default: pendingExprHead = this.id(); break SWITCH ;
    }
  //  break;
  case 3:
    switch (id) {
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
        return this.parseLet(CONTEXT.NONE);

      this.assert(!this.tight);
      pendingExprHead = this.id();
      break SWITCH;

    case 'var': return this.parseVariableDeclaration( context & CONTEXT.FOR );
    case 'int':
      if ( this.v <= 5 )
        this.errorReservedID();
      // fall through

    default: pendingExprHead = this.id(); break SWITCH;
    }
  //  break;
  case 4:
    switch (id) {
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
    //  break;
    //  fall through
    case 'with':
      return this.parseWithStatement();
    case 'enum': case 'byte': case 'char': case 'goto':
    case 'long':
      if ( this. v <= 5 ) this.errorReservedID();
    //  break;
    //  fall through
    default: pendingExprHead = this.id(); break SWITCH  ;
    }
  //  break;
  case 5:
    switch (id) {
    case 'super': pendingExprHead = this.parseSuper(); break SWITCH;
    case 'break': return this.parseBreakStatement();
    case 'catch': this.notId ();
    // break;
    //  fall through
    case 'class': return this.parseClass(CONTEXT.NONE ) ;
    case 'const':
      this.assert(this.v>=5);
      return this.parseVariableDeclaration(CONTEXT.NONE);

    case 'throw': return this.parseThrowStatement();
    case 'while': return this.parseWhileStatement();
    case 'yield':
      if ( this.scopeFlags & SCOPE.YIELD ) {
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
    //  break;
    //  fall through
    case 'await':
    default: pendingExprHead = this.id(); break SWITCH ;
    }
  //  break;
  case 6:
    switch (id) {
    case 'static':
      if ( this.tight || this.v <= 5 )
        this.error();
    //  break;
    //  fall through
    case 'delete':
    case 'typeof':
      if ( this.canBeStatement )
        this.canBeStatement = false ;
      this.lttype = 'u';
      this.isVDT = !false;
      return null;

    case 'export':
      this.assert( !this.isScript );
      return this.parseExport() ;

    case 'import':
      this.assert( !this.isScript );
      return this.parseImport();

    case 'return': return this.parseReturnStatement();
    case 'switch': return this.parseSwitchStatement();
    case 'double': case 'native': case 'throws':
      if ( this. v <= 5 ) this.errorReservedID();
    //  break;
    //  fall through
    default:
      pendingExprHead = this.id();
      break SWITCH ;
    }
  //  break;
  case 7:
    switch (id) {
    case 'default':
      if ( this.canBeStatement ) this.canBeStatement = false ;
      return null;

    case 'extends': case 'finally':
      this.notId() ;
    //  break;
    //  fall through
    case 'package': case 'private':
      if ( this. tight  )
        this.errorReservedID();
    //  break;
    //  fall through
    case 'boolean':
      if ( this. v <= 5 )
        this.errorReservedID();
    //  break;
    //  fall through
    default:
      pendingExprHead = this.id();
      break SWITCH  ;
    }
  //  break;
  case 8:
    switch (id) {
    case 'function': return this.parseFunc(CONTEXT.FOR, CONST.WHOLE_FUNCTION,  CONST.ANY_ARG_LEN );
    case 'debugger': return this.prseDbg();
    case 'continue': return this.parseContinueStatement();
    case 'abstract': case 'volatile':
      if ( this. v <= 5 ) this.errorReservedID();
      //  fall through
    default:
      pendingExprHead = this.id();
      break SWITCH  ;
    }

  case 9:
    switch (id ) {
    case 'interface': case 'protected':
      if (this.tight) this.errorReservedID() ;
      //  fall through
    case 'transient':
      if (this.v <= 5) this.errorReservedID();
      //  fall through
    default:
      pendingExprHead = this.id();
      break SWITCH  ;
    }

  case 10:
    switch ( id ) {
    case 'instanceof':
      this.notId();
      //  fall through
    case 'implements':
      if ( this.v <= 5 || this.tight ) this.resv();
      //  fall through
    default:
      pendingExprHead = this.id(); break SWITCH ;
    }
  case 12:
    if ( this.v <= 5 && id === 'synchronized' ) this.errorReservedID();
    // fall through
  default:
    pendingExprHead = this.id();
  }

  if ( this.canBeStatement ) {
    this.canBeStatement = false;
    this.pendingExprHead = pendingExprHead;
    return null;
  }

  return pendingExprHead;
};
