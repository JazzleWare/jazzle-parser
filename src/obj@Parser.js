this.parseObjectExpression = function (context) {
  var startc = this.c - 1 ,
      startLoc = this.locOn(1),
      elem = null,
      list = [];

  var first__proto__ = null;

  do {
     this.next();
     this.first__proto__ = first__proto__;

     elem = this.parseMem(context, MEM_OBJ);
     if ( !first__proto__ && this.first__proto__ )
          first__proto__ =  this.first__proto__ ;

     if ( elem ) {
       list.push(elem);
     }
     else
        break ;

  } while ( this.lttype === ',' );

  elem = { properties: list, type: 'ObjectExpression', start: startc,
     end: this.c , loc: { start: startLoc, end: this.loc() }/* ,y:-1*/};

  if ( ! this.expectType_soft ('}') && this.err('obj.unfinished',{
    obj: elem, asig: firstUnassignable, ea: firstEA,
    firstElemWithYS: firstElemWithYS, u: unsatisfiedAssignment, ys: firstYS }) )
    return this.errorHandlerOutput;
     
  return elem;
};


