
_class .parseMeth = function(name, isObj) {
   var val = null; 

   if ( isObj ) {
     val = this.parseFunc(CONTEXT_NONE,ARGLIST_AND_BODY,ANY_ARG_LEN );
     return { type: 'Property', key: core(name), start: name.start, end: val.end,
              kind: 'init', computed: name.type === PAREN,
              loc: { start: name.loc.start, end : val.loc.end },
              method: !false, shorthand: false, value : val };
   }

   var kind = 'method' ;

   switch ( name.type ) {
     case 'Identifier':
         if ( name.name === 'constructor' )  kind  = 'constructor';
         break ;

     case 'Literal':
         if ( name.value === 'constructor' )  kind  = 'constructor';
         break ;
   }

   val = this.parseFunc(CONTEXT_NONE ,
      ARGLIST_AND_BODY|(kind !== 'constructor' ? METH_FUNCTION : CONSTRUCTOR_FUNCTION), ANY_ARG_LEN ); 

   return { type: 'MethodDefinition', key: core(name), start: name.start, end: val.end,
            kind: kind, computed: name.type === PAREN,
            loc: { start: name.loc.start, end: val.loc.end },
            value: val,    'static': false };
};

_class .parseGen = function(isObj ) {
  var startc = this.c - 1,
      startLoc = this.locOn(1);
  this.next();
  var name = null;

  switch ( this.lttype ) {
     case 'Identifier':
        this.assert(this.ltval !== 'constructor' ) ;
        name = this.memberID();
        break ;

     case '[':
        name = this.memberExpr();
        break ;

     case 'Literal' :
        this.assert(this.ltval !== 'constructor' ) ;
        name = this.numstr();
        break ;

     default:
        this.assert(false);
  }

  var val = null;

  if ( isObj ) {
     val  =  this.parseFunc ( CONTEXT_NONE, ARGLIST_AND_BODY_GEN, ANY_ARG_LEN );

     return { type: 'Property', key: core(name), start: startc, end: val.end,
              kind: 'init', computed: name.type === PAREN,
              loc: { start: startLoc , end : val.loc.end },
              method: !false, shorthand: false, value : val };
  }

  val = this.parseFunc(  CONTEXT_NONE , ARGLIST_AND_BODY_GEN|METH_FUNCTION, ANY_ARG_LEN )
  return { type: 'MethodDefinition', key: core(name), start: startc, end: val.end,
           kind: 'method', computed: name.type === PAREN,
           loc : { start: startLoc, end: val.loc.end },    'static': false, value: val };
};

_class . parseSetGet= function(isObj) {
  var startc = this.c0,
      startLoc = this.locBegin();

  var c = this.c, li = this.li, col = this.col;

  var kind = this.ltval;
  this.next();

  var strName = null;
  var name = null;

  switch ( this.lttype ) {
      case 'Identifier':
         if (!isObj) strName = this.ltval;
         name = this.memberID();
         break;
      case '[':
         name = this.memberExpr();
         break;
      case 'Literal':
         if (!isObj) strName = this.ltval;
         name = this.numstr();
         break ;
      default:  
           name = { type: 'Identifier', name: this.ltval, start: startc,  end: c,
                   loc: { start: startLoc, end: { line: li, column: col } } };

           return isObj ? this.parseProperty(name) : this.parseMeth(name, isObj) ;
  }

  var val = null;
  if ( isObj ) {
       val = this.parseFunc ( CONTEXT_NONE, ARGLIST_AND_BODY, kind === 'set' ? 1 : 0 ); 
       return { type: 'Property', key: core(name), start: startc, end: val.end,
             kind: kind, computed: name.type === PAREN,
             loc: { start: startLoc, end: val.loc.end }, method: false,
             shorthand: false, value : val };
  }
  
  val = this.parseFunc ( CONTEXT_NONE , ARGLIST_AND_BODY|METH_FUNCTION, kind === 'set' ? 1 : 0 )
  this.assert ( strName !== 'constructor' );

  return { type: 'MethodDefinition', key: core(name), start: startc, end: val.end,
           kind: kind, computed: name.type === PAREN,
           loc : { start: startLoc, end: val.loc.end }, 'static': false, value: val };
};


