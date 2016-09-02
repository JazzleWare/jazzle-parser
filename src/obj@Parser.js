this.parseObjectExpression = function (context) {
  var startc = this.c - 1 ,
      startLoc = this.locOn(1),
      elem = null,
      list = [];

  var firstUnassignable = null, firstParen = null, 
      unsatisfiedAssignment = this.unsatisfiedAssignment;

  var first__proto__ = null;
  var firstEA = null;

  var firstElemWithYS = null;
  var parenYS = null;

  var firstYS = this.firstYS;

  if ( context & CONTEXT_UNASSIGNABLE_CONTAINER ) 
    context = context & CONTEXT_PARAM;

  else
    context = context & CONTEXT_PARAM|CONTEXT_ELEM;

  var y = 0;

  do {
     this.next();
     this.unsatisfiedAssignment = null;
  
     this.first__proto__ = first__proto__;
     this.firstEA = null;
     this.firstElemWithYS = null;

     elem = this.parseProperty(null,context);

     if ( !first__proto__ && this.first__proto__ )
          first__proto__ =  this.first__proto__ ;

     if ( !firstEA && this.firstEA )
           firstEA =  this.firstEA ;

     if ( (context & CONTEXT_PARAM) && !firstElemWithYS && this.firstElemWithYS ) {
       parenYS = this.parenYS;
       firstElemWithYS = this.firstElemWithYS;
     }

     if ( elem ) {
       list.push(elem);
       y += this.y;

       if (!unsatisfiedAssignment && this.unsatisfiedAssignment ) {
           if (!( context & CONTEXT_ELEM)  ) this['assig.unsatisfied']() ;
           unsatisfiedAssignment =  this.unsatisfiedAssignment ;
       }
       
       if ( !firstParen && this.firstParen )
             firstParen =  this.firstParen ;

       if ( !firstUnassignable && this.firstUnassignable )
             firstUnassignable =  this.firstUnassignable ;

       if ( !firstYS && this.firstYS )
         firstYS = this.firstYS;

     }
     else
        break ;

  } while ( this.lttype === ',' );

  this.y = y;
  elem = { properties: list, type: 'ObjectExpression', start: startc,
     end: this.c , loc: { start: startLoc, end: this.loc() }, y: y };

  if ( ! this.expectType_soft ('}') )
    this['obj.unfinished'](elem);

  if ( firstUnassignable ) this.firstUnassignable = firstUnassignable;
  if ( firstParen ) this.firstParen = firstParen;
  if ( firstEA ) this.firstEA = firstEA;
  if ( firstElemWithYS ) {
     this.parenYS = parenYS;
     this.firstElemWithYS = firstElemWithYS;  
  }
     
  if ( unsatisfiedAssignment )
     this.unsatisfiedAssignment = unsatisfiedAssignment ;

  this.firstYS = firstYS;

  return elem;
};

this.parseProperty = function (name, context) {

  var __proto__ = false, first__proto__ = this.first__proto__ ;
  var val = null;
  
  var y = 0;
  SWITCH:
  if ( name === null ) switch ( this.lttype  ) {
      case 'op':
         return this.ltraw === '*' ? this.parseGen(OBJ_MEM) : null;

      case 'Identifier': switch ( this.ltval ) {
         case 'get':
            return this.parseSetGet(OBJ_MEM);
         case 'set':
            return this.parseSetGet(OBJ_MEM);

         case '__proto__':
            __proto__ = !false;

         default:
            name = this.memberID();
            break SWITCH;
      }
      case 'Literal':
            if ( this.ltval === '__proto__' )
               __proto__ = !false;
 
            name = this.numstr();
            break SWITCH;

      case '[':
            this.y = 0;
            name = this.memberExpr();
            y += this.y;
            break SWITCH;

      default: return null;
  }

  this.firstUnassignable = this.firstParen = null;

  switch (this.lttype) {
      case ':':
         if ( __proto__ && first__proto__ ) this['obj.proto.has.dup'](name, first__proto__ ) ;

         this.next();
         this.y = 0;
         val = this.parseNonSeqExpr ( PREC_WITH_NO_OP, context )  ;
         y += this.y;
         val = { type: 'Property', start: name.start, key: core(name), end: val.end,
                  kind: 'init', loc: { start: name.loc.start, end: val.loc.end }, computed: name.type === PAREN ,
                  method: false, shorthand: false, value: core(val), y: y };
         if ( __proto__ )
            this.first__proto__ = val;

         this.y = y;
         return val;

      case '(':
         return this.parseMeth(name, OBJ_MEM);

      default:
          if (name.type !== 'Identifier' ) this['obj.prop.assig.not.id'](name);

          if ( this.lttype === 'op' ) {
             if (this.ltraw !== '=' ) this['obj.prop.assig.not.assigop'](name);
             if (!(context & CONTEXT_ELEM) ) this['obj.prop.assig.not.allowed'](name);

             val = this.parseAssig(name);
             this.unsatisfiedAssignment = val;
          }
          else
             val = name;

          return { type: 'Property', key: name, start: val.start, end: val.end,
                    loc: val.loc, kind: 'init',  shorthand: !false, method: false,
                   value: val, computed: false, y: 0 };
  }

       return n   ;
};


