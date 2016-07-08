
_class .ensureSimpAssig = function(head) {
  switch(head.type) {
    case 'Identifier':
    case 'MemberExpression':
       return;

    default:
       _assert(false);
  }
};

// an arr-pat is always to the left of an assig;
_class .toAssig = function(head) {

  var i = 0;
  var list = null;

  switch(head.type) {
     case 'Identifier':
     case 'MemberExpression':
        return;

     case 'ObjectExpression':
        _assert(head !== this.firstUnassignable )  ;
        list = head.properties;
        while ( i < list.length ) {
           this.toAssig(list[i].value);
           list[i].type = 'AssignmentProperty';
           i++;
        }
        head.type = 'ObjectPattern';
        return;

     case 'ArrayExpression':
        _assert(head !== this.firstUnassignable )  ;
        list = head.elements;
        while ( i < list.length ) {
          if ( list[i] ) {
             this.toAssig(list[i]);
             if ( list[i].type === 'SpreadElement' ) {
                i++;
                break ;
             }
          }
          i++;
        }
        _assert( i === list.length );
        head.type = 'ArrayPattern';
        return;

     case 'AssignmentExpression':
       _assert(head !== this.firstUnassignable ) ;
       _assert(head.operator === '='  ) ;
       head.type = 'AssignmentPattern';
       delete head.operator;
       return;

     case 'SpreadElement':
       this.toAssig(head.argument);
       head.type = 'RestElement';
       return;
   
     case 'AssignmentPattern': // this would be the case in the event of converting an obj prop in the form of "name = val" rather than "name: val"
       return;

     default:
        _assert(false ) ;
  }
};

_class .parseAssignment = function(head, context ) {
    var o = this.ltraw;
    if ( o === '=' ) this.toAssig(core(head));
    else if ( o === '=>' )
      return this.parseArrowFunctionExpression (head, context);
    else this.ensureSimpAssig(core(head));

    if ( this.unsatisfiedAssignment ) {
      _assert( this.prec === PREC_SIMP_ASSIG ) ;
      this.unsatisfiedAssignment = false ;
    }

    var prec = this.prec;
    this.next();

    var right = this. parseNonSeqExpr(PREC_WITH_NO_OP, context ) ;
    return { type: 'AssignmentExpression', operator: o, start: head.start, end: right.end,
             left: core(head), right: core(right), loc: { start: head.loc.start, end: right.loc.end }};
};


