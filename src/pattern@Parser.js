
this.parsePattern = function() {
  this.y = 0; 
  switch ( this.lttype ) {
    case 'Identifier' :
       var id = this.validateID(null);
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
     this.inComplexArgs = !false;
  }

  var y = 0;

  this.next();
  while ( !false ) {
      elem = this.parsePattern();
      if ( elem ) {
         y += this.y;
         if ( this.lttype === 'op' && this.ltraw === '=' ) {
           elem = this.parseAssig(elem);
           y += this.y; 
         }
      }
      else {
         if ( this.lttype === '...' ) {
           list.push(this.parseRestElement());
           y += this.y;
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
           start: startc, end: this.c, elements : list, y: y };

  this.y = y;

  if ( !this. expectType_soft ( ']' ) )
     this['pat.array.is.unfinished'](elem);

  return elem;
};

this.parseObjectPattern  = function() {

    var sh = false;
    var startc = this.c-1;
    var startLoc = this.locOn(1);
    var list = [];
    var val = null;
    var name = null;

    var yObj = 0, yProp = 0;
    if ( this.isInArgList ) {
         this.inComplexArgs = !false;
    }

    LOOP:
    do {
      sh = false;
      yProp = 0;
      this.next ()   ;
      switch ( this.lttype ) {
         case 'Identifier':
            name = this.memberID();
            if ( this.lttype === ':' ) {
              this.next();
              val = this.parsePattern()
              yProp += this.y;
            }
            else { sh = !false; val = name; }
            break ;

         case '[':
            name = this.memberExpr();
            yProp = this.y;
            this.expectType(':');
            val = this.parsePattern();
            yProp += this.y;
            break ;

         case 'Literal':
            name = this.numstr();
            this.expectType(':');
            val = this.parsePattern();
            yProp += this.y;
            break ;

         default:
            break LOOP;
      }
      if ( this.lttype === 'op' && this.ltraw === '=' ) {
        val = this.parseAssig(val);
        yProp += this.y;
      }

      yObj += yProp;
      list.push({ type: 'Property', start: name.start, key: core(name), end: val.end,
                  loc: { start: name.loc.start, end: val.loc.end },
                 kind: 'init', computed: name.type === PAREN, value: val,
               method: false, shorthand: sh, y: yProp });

    } while ( this.lttype === ',' );

    var n = { type: 'ObjectPattern',
             loc: { start: startLoc, end: this.loc() },
             start: startc,
              end: this.c,
              properties: list, y: yObj };

    this.y = yObj;
    if ( ! this.expectType_soft ('}') ) this['pat.obj.is.unfinished'](n);

    return n;
};

this .parseAssig = function (head) {
    this.next() ;
    var y = this.y;
    var e = this.parseNonSeqExpr( PREC_WITH_NO_OP, CONTEXT_NONE );
    return { type: 'AssignmentPattern', start: head.start, left: head, end: e.end,
           right: core(e), loc: { start: head.loc.start, end: e.loc.end }, y: y + this.y };
};


this.parseRestElement = function() {
   var startc = this.c-1-2,
       startLoc = this.locOn(1+2);

   this.next ();
   var e = this.parsePattern();
   if (!e ) this['rest.has.no.arg'](starc, startLoc);

   return { type: 'RestElement', loc: { start: startLoc, end: e.loc.end }, start: startc, end: e.end,argument: e, y: this.y };
};


