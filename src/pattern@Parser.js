
this.parsePattern = function() {
  switch ( this.lttype ) {
    case 'Identifier' :
       var id = this.validateID(null);
       if (this.tight) this.assert(!arguments_or_eval(id.name));
       if ( this.isInArgList ) 
          this.addArg(id);
 
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

  if ( this.isInArgList ) {
     this.inComplexArgs = this.inComplexArgs || ICA_FUNCTION;
  }

  this.next();
  while ( !false ) {
      elem = this.parsePattern();
      if ( elem ) {
         if ( this.lttype === 'op' && this.ltraw === '=' ) elem = this.parseAssig(elem);
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
           start: startc, end: this.c, elements : list};

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

    if ( this.isInArgList ) {
         this.inComplexArgs = this.inComplexArgs || ICA_FUNCTION;
    }

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
            else { this.validateID(name.name); sh = !false; val = name; }
            break ;

         case '[':
            name = this.memberExpr();
            this.expectType(':');
            val = this.parsePattern();
            break ;

         case 'Literal':
            name = this.numstr();
            this.expectType(':');
            val = this.parsePattern();
            break ;

         default:
            break LOOP;
      }
      if ( this.lttype === 'op' && this.ltraw === '=' )
        val = this.parseAssig(val);

      list.push({ type: 'Property', start: name.start, key: core(name), end: val.end,
                  loc: { start: name.loc.start, end: val.loc.end },
                 kind: 'init', computed: name.type === PAREN, value: val,
               method: false, shorthand: sh });

    } while ( this.lttype === ',' );

    var n = { type: 'ObjectPattern',
             loc: { start: startLoc, end: this.loc() },
             start: startc,
              end: this.c,
              properties: list };

    if ( ! this.expectType_soft ('}') && this.err('pat.obj.is.unfinished',n) )
      return this.errorHandlerOutput ;

    return n;
};

this .parseAssig = function (head) {
    this.next() ;
    var e = this.parseNonSeqExpr( PREC_WITH_NO_OP, CONTEXT_NONE );
    return { type: 'AssignmentPattern', start: head.start, left: head, end: e.end,
           right: core(e), loc: { start: head.loc.start, end: e.loc.end } };
};


this.parseRestElement = function() {
   var startc = this.c-1-2,
       startLoc = this.locOn(1+2);

   this.next ();
   var e = this.parsePattern();
   if (!e && this.err('rest.has.no.arg',starc, startLoc) )
     return this.errorHandlerOutput ;

   return { type: 'RestElement', loc: { start: startLoc, end: e.loc.end }, start: startc, end: e.end,argument: e };
};


