
this.evalArgumentsError = function(l) {
  return this.err('err.assig.not', l || this.firstEA ) ;
};

this.notSimpleError = function(l) {
  return this.err('err.assig.simple.not', l);
};

this.notAssignableError = function(l) {
  return this.err('err.assig.not', l || this.firstUnassignable );
};

this.parenUnassigableError = this.notAssignableError;

this.restNotLastError = this.notAssignableError;

this .ensureSimpAssig = function(head) {
  switch(head.type) {
    case 'Identifier':
       if ( this.tight && arguments_or_eval(head.name) )
         this.err('assig.to.eval.or.arguments',{tn:head});

    case 'MemberExpression':
       return;

    default:
       return this.err('assig.not.simple',{tn:head});
  }
};

this .ensureSimpAssig_soft = function(head) {
  switch(head.type) {
    case 'Identifier':
       if ( this.tight && arguments_or_eval(head.name) )
         this.err('assig.to.eval.or.arguments',{tn:head});

    case 'MemberExpression':
       return true ;

    default:
       return false ;
  }
};

this.ensureSpreadToRestArgument_soft = function(head) {
  return head.type !== 'AssignmentExpression';
};

// an arr-pat is always to the left of an assig;
this .toAssig = function(head) {

  var i = 0;
  var list = null;

  switch(head.type) {
     case 'Identifier':
     case 'MemberExpression':
        return;

     case 'ObjectExpression':

        list = head.properties;

        while ( i < list.length ) {
           this.toAssig(list[i].value);
           list[i].type = 'AssignmentProperty';
           i++;
        }
        head.type = 'ObjectPattern';
        return;

     case 'ArrayExpression':

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

        head.type = 'ArrayPattern';
        return;

     case 'AssignmentExpression':
       if (head.operator !== '=' && this.notAssignableError()  )
         return this.errorHandlerOutput ;

       head.type = 'AssignmentPattern';
       delete head.operator;

       return;

     case 'SpreadElement':
       if (!this.ensureSpreadToRestArgument_soft(head.argument))
         this.err('rest.assig.non.id.arg', head);

       this.toAssig(head.argument);
       head.type = 'RestElement';
       return;
   
     case 'AssignmentPattern': // this would be the case in the event of converting an obj prop in the form of "name = val" rather than "name: val"
       this.toAssig(head.left);
       return;

     default:
        if ( this.notAssignableError(head) )
          return this.errorHandlerOutput;
  }
};

this .parseAssignment = function(head, context ) {
    var o = this.ltraw;
    var firstEA = null ;

    if ( o === '=' ) {
       this.toAssig(core(head));
    }
    else if ( o === '=>' )
      return this.parseArrowFunctionExpression (head, context & CONTEXT_FOR );
    else this.ensureSimpAssig(core(head));

    if ( this.unsatisfiedAssignment ) {
       if ( o !== '=' && this.err('err.prop.init', this.unsatisfiedAssignment ) )
          return this.errorHandlerOutput ;

    }

    var prec = this.prec;
    this.next();

    var right = this. parseNonSeqExpr(PREC_WITH_NO_OP, context & CONTEXT_FOR ) ;
    var n = { type: 'AssignmentExpression', operator: o, start: head.start, end: right.end,
             left: core(head), right: core(right), loc: { start: head.loc.start, end: right.loc.end }/* ,y:-1*/};

    return n;
};


