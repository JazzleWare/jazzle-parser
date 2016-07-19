
_class .ensureSimpAssig = function(head) {
  switch(head.type) {
    case 'Identifier':
       this.assert( !( this.tight && arguments_or_eval(head.name) )  );

    case 'MemberExpression':
       return;

    default:
       this.assert(false);
  }
};

// an arr-pat is always to the left of an assig;
_class .toAssig = function(head) {

  var i = 0;
  var firstEA = null;
  var list = null;

  this.firstEA = null;

  switch(head.type) {
     case 'Identifier':
        if (this.tight && arguments_or_eval(head.name))
          this.firstEA = head;
     case 'MemberExpression':
        return;

     case 'ObjectExpression':
        this.assert(head !== this.firstUnassignable )  ;

        list = head.properties;

        while ( i < list.length ) {
           this.toAssig(list[i].value);
           if ( !firstEA && this.firstEA )
                 firstEA =  this.firstEA ;
           list[i].type = 'AssignmentProperty';
           i++;
        }
        head.type = 'ObjectPattern';
        this.firstEA = firstEA ;
        return;

     case 'ArrayExpression':
        this.assert(head !== this.firstUnassignable )  ;

        list = head.elements;
        while ( i < list.length ) {
          if ( list[i] ) {
             this.toAssig(list[i]);
             if ( !firstEA && this.firstEA )
                   firstEA =  this.firstEA ;

             if ( list[i].type === 'SpreadElement' ) {
                i++;
                break ;
             }
          }
          i++;
        }
        this.assert( i === list.length );
        head.type = 'ArrayPattern';
        this.firstEA = firstEA ;
        return;

     case 'AssignmentExpression':
       this.assert(head !== this.firstUnassignable ) ;
       this.assert(head.operator === '='  ) ;
       head.type = 'AssignmentPattern';
       delete head.operator;
       if ( head === this.firstEAContainer )
          this.firstEA = this.defaultEA ;

       return;

     case 'SpreadElement':
       this.toAssig(head.argument);
       head.type = 'RestElement';
       return;
   
     case 'AssignmentPattern': // this would be the case in the event of converting an obj prop in the form of "name = val" rather than "name: val"
       return;

     default:
        this.assert(false ) ;
  }
};

_class .parseAssignment = function(head, context ) {
    var o = this.ltraw;
    var firstEA = null ;
    if ( o === '=' ) {
       if ( this.firstEA ) {
            this.defaultEA = this.firstEA;
            this.firstEA = null;
       }

       this.toAssig(core(head));
       firstEA = this.firstEA;
    }
    else if ( o === '=>' )
      return this.parseArrowFunctionExpression (head, context & CONTEXT_FOR );
    else this.ensureSimpAssig(core(head));

    if ( this.unsatisfiedAssignment ) {
      this.assert( o === '=' ) ;
      this.unsatisfiedAssignment = false ;
    }

    if ( firstEA ) 
       this.assert( context & CONTEXT_ELEM_OR_PARAM );
    

    var prec = this.prec;
    this.next();

    this.firstEA = null;
    var right = this. parseNonSeqExpr(PREC_WITH_NO_OP, context & CONTEXT_FOR ) ;
    this.firstEA = firstEA;
    var n = { type: 'AssignmentExpression', operator: o, start: head.start, end: right.end,
             left: core(head), right: core(right), loc: { start: head.loc.start, end: right.loc.end }};

    if ( firstEA )
      this.firstEAContainer = n;

    return n;
};


