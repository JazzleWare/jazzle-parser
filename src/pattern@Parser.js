
this.parsePattern = function() {
  switch ( this.lttype ) {
    case 'Identifier' :
       var id = this.validateID(null);
       this.declare(id);
       if (this.tight && arguments_or_eval(id.name))
         this.err('bind.arguments.or.eval');

       return id;

    case '[':
       return this.parseArrayPattern();
    case '{':
       return this.parseObjectPattern();

    default:
       return null;
  }
};

this. parseArrayPattern = function() {
  var startc = this.c - 1,
      startLoc = this.locOn(1),
      elem = null,
      list = [];

  this.enterComplex();

  this.next();
  while ( true ) {
      elem = this.parsePattern();
      if ( elem ) {
         if ( this.lttype === 'op' && this.ltraw === '=' )
           elem = this.parseAssig(elem);
      }
      else {
         if ( this.lttype === '...' ) {
           list.push(this.parseRestElement());
           break ;
         }  
      }
    
      if ( this.lttype === ',' ) {
         list.push(elem);
         this.next();
      }       
      else  {
         if ( elem ) list.push(elem);
         break ;
      }
  } 

  elem = { type: 'ArrayPattern', loc: { start: startLoc, end: this.loc() },
           start: startc, end: this.c, elements : list/* ,y:-1*/};

  if ( !this. expectType_soft ( ']' ) &&
        this.err('pat.array.is.unfinished',elem) )
    return this.errorHandlerOutput ;

  return elem;
};

this.parseObjectPattern  = function() {

    var sh = false;
    var startc = this.c-1;
    var startLoc = this.locOn(1);
    var list = [];
    var val = null;
    var name = null;

    this.enterComplex();
    
    LOOP:
    do {
      sh = false;
      this.next ()   ;
      switch ( this.lttype ) {
         case 'Identifier':
            name = this.memberID();
            if ( this.lttype === ':' ) {
              this.next();
              val = this.parsePattern()
            }
            else {
              this.validateID(name.name);
              sh = true;
              val = name;
              this.declare(name);
            }
            break ;

         case '[':
            name = this.memberExpr();
            if (!this.expectType_soft(':'))
              this.err('obj.pattern.no.:');

            val = this.parsePattern();
            break ;

         case 'Literal':
            name = this.numstr();
            if (!this.expectType_soft(':'))
              this.err('obj.pattern.no.:');

            val = this.parsePattern();
            break ;

         default:
            break LOOP;
      }

      // TODO: this is a subtle case that was only lately noticed;
      // parsePattern must have a way to throw when the pattern is not supposed to be null 
      if (val === null)
        this.err('obj.prop.is.null');

      if ( this.lttype === 'op' && this.ltraw === '=' )
        val = this.parseAssig(val);

      list.push({ type: 'Property', start: name.start, key: core(name), end: val.end,
                  loc: { start: name.loc.start, end: val.loc.end },
                 kind: 'init', computed: name.type === PAREN, value: val,
               method: false, shorthand: sh/* ,y:-1*/ });

    } while ( this.lttype === ',' );

    var n = { type: 'ObjectPattern',
             loc: { start: startLoc, end: this.loc() },
             start: startc,
              end: this.c,
              properties: list/* ,y:-1*/ };

    if ( ! this.expectType_soft ('}') && this.err('pat.obj.is.unfinished',n) )
      return this.errorHandlerOutput ;

    return n;
};

this .parseAssig = function (head) {
    this.next() ;
    var e = this.parseNonSeqExpr( PREC_WITH_NO_OP, CTX_NONE );
    return { type: 'AssignmentPattern', start: head.start, left: head, end: e.end,
           right: core(e), loc: { start: head.loc.start, end: e.loc.end } /* ,y:-1*/};
};


this.parseRestElement = function() {
   var startc = this.c-1-2,
       startLoc = this.locOn(1+2);

   this.next ();
   var e = this.parsePattern();

   if (!e) {
      if (this.err('rest.has.no.arg',starc, startLoc))
       return this.errorHandlerOutput ;
   }
   else if ( e.type !== 'Identifier' ) {
      if (this.err('rest.arg.not.id', startc, startLoc, e) )
        return this.errorHandlerOutput;
   }

   return { type: 'RestElement', loc: { start: startLoc, end: e.loc.end }, start: startc, end: e.end,argument: e };
};


