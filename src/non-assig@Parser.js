this.parseExpr = function (context) {
  this.y = 0;
  var head = this.parseNonSeqExpr(PREC_WITH_NO_OP,context );

  var lastExpr;
  if ( this.lttype === ',' ) {
    context &= CONTEXT_FOR;
    var y = 0;
    var e = [core(head)] ;
    do {
      this.next() ;
      this.y = 0;
      lastExpr = this.parseNonSeqExpr(PREC_WITH_NO_OP,context);
      y += this.y;
      e.push(core(lastExpr));
    } while (this.lttype === ',' ) ;

    this.y = y;
    return  { type: 'SequenceExpression', expressions: e, start: head.start, end: lastExpr.end,
              loc: { start : head.loc.start, end : lastExpr.loc.end}, y: y };
  }

  return head ;
};

this .parseCond = function(cond,context ) {
    var y = this.y;
    this.next();
    this.y = 0;
    var seq = this. parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE ) ;
    y += this.y;
    if ( !this.expectType_soft (':') )
      this['cond.colon']();

    this.y = 0;
    var alt = this. parseNonSeqExpr(PREC_WITH_NO_OP, context ) ;
    y += this.y;
    this.y = y;
    return { type: 'ConditionalExpression', test: core(cond), start: cond.start , end: alt.end ,
             loc: { start: cond.loc.start, end: alt.loc.end }, consequent: core(seq), alternate: core(alt), y: y };
};

this .parseUnaryExpression = function(context ) {
  var u = null, startLoc = null, startc = 0;
  if ( this.isVDT ) {
    this.isVDT = false;
    u = this.ltval;
    startLoc = this.locBegin();
    startc = this.c0;
  }
  else {
    u = this.ltraw;
    startLoc = this.locOn(1);
    startc = this.c - 1;
  }

  this.next();
  this.y = 0;
  var arg = this. parseNonSeqExpr(PREC_U,context|CONTEXT_UNASSIGNABLE_CONTAINER );

  return { type: 'UnaryExpression', operator: u, start: startc, end: arg.end,
           loc: { start: startLoc, end: arg.loc.end }, prefix: !false, argument: core(arg), y: this.y };
};

this .parseUpdateExpression = function(arg, context) {
    var c = 0,
        loc = null,
        u = this.ltraw;

    if ( arg === null ) {
       c  = this.c-2;
       loc = this.locOn(2);
       this.next() ;
       this.y = 0;
       arg = this. parseExprHead(context|CONTEXT_UNASSIGNABLE_CONTAINER );
       this.assert(arg); // TODO: this must have error handling

       if ( !this.ensureSimpAssig_soft (core(arg)) )
         this['incdec.pre.not.simple.assig'](c,loc,arg);

       return { type: 'UpdateExpression', argument: core(arg), start: c, operator: u,
                prefix: !false, end: arg.end, loc: { start: loc, end: arg.loc.end }, y: this.y };
    }

    if ( !this.ensureSimpAssig_soft(core(arg)) )
       this['incdec.post.not.simple.assig'](arg);

    c  = this.c;
    loc = { start: arg.loc.start, end: { line: this.li, column: this.col } };
    this.next() ;
    return { type: 'UpdateExpression', argument: core(arg), start: arg.start, operator: u,
             prefix: false, end: c, loc: loc, y: this.y };

};

this .parseO = function(context ) {

    switch ( this. lttype ) {

      case 'op': return !false;
      case '--': return !false;
      case '-': this.prec = PREC_ADD_MIN; return !false;
      case '/':
           if ( this.src.charCodeAt(this.c) === CHAR_EQUALITY_SIGN ) {
             this.c++ ;
             this.prec = PREC_OP_ASSIG;
             this.ltraw = '/=';
             this.col++; 
           }
           else
              this.prec = PREC_MUL ; 

           return !false;

      case 'Identifier': switch ( this. ltval ) {
         case 'instanceof':
           this.prec = PREC_COMP  ;
           this.ltraw = this.ltval ;
           return !false;

         case 'of':
         case 'in':
            if ( context & CONTEXT_FOR ) break ;
            this.prec = PREC_COMP ;
            this.ltraw = this.ltval;
            return !false;
     }
     break;

     case '?': this .prec = PREC_COND  ; return !false;
   }

   return false ;
};

this.parseNonSeqExpr = function (prec, context  ) {
    var firstUnassignable = null, firstParen = null;

    this.y = 0;
    var head = this. parseExprHead(context);
    var y = this.y;

    if ( head === null ) {
         switch ( this.lttype ) {
           case 'u':
           case '-':
              head = this. parseUnaryExpression(context & CONTEXT_FOR );
              y += this.y;
              break ;

           case '--':
              head = this. parseUpdateExpression(null, context&CONTEXT_FOR );
              y += this.y;
              break ;

           case 'yield':
              if (prec !== PREC_WITH_NO_OP) // make sure there is no other expression before it 
                return this['yield.as.an.id']();

              return this.parseYield(context); // everything that comes belongs to it
   
           default:
              if (!(context & CONTEXT_NULLABLE) )
                return this['nexpr.null.head']();
               
              return null;
         }
    }
    else if ( prec === PREC_WITH_NO_OP ) {
      firstParen = head. type === PAREN ? head.expr : this.firstParen ;      
      firstUnassignable = this.firstUnassignable;
    }   

    var op = false;
    while ( !false ) {
       op = this. parseO( context );
       if ( op && isAssignment(this.prec) ) {
         this.firstUnassignable = firstUnassignable;
         if ( prec === PREC_WITH_NO_OP )
            head =  this. parseAssignment(head, context );
         
         else
            this['assig.not.first']();

         break ;
       }
       else {
         if ( this.unsatisfiedArg ) 
           this['arrow.paren.no.arrow'](); 

         if ( this.firstEA )
            if( !(context & CONTEXT_ELEM_OR_PARAM) || op )
              this['assig.to.eval.or.arguments']();

         if ( this.unsatisfiedAssignment ) {
            if ( !(prec===PREC_WITH_NO_OP && (context & CONTEXT_ELEM_OR_PARAM ) ) )
              this['assignable.unsatisfied']();

            else break ;
         }
         if ( !op ) break;
       }

       if ( isMMorAA(this.prec) ) {
         if ( this. newLineBeforeLookAhead )
           break ;
         head = this. parseUpdateExpression(head, context & CONTEXT_FOR ) ;
         y = this.y;
         continue;
       }
       if ( isQuestion(this.prec) ) {
          if ( prec === PREC_WITH_NO_OP ) {
            head = this. parseCond(head, context&CONTEXT_FOR );
          }
          y = this.y;
          break ;
       }

       if ( this. prec < prec ) break ;
       if ( this. prec  === prec && !isRassoc(prec) ) break ;

       var o = this.ltraw;
       var currentPrec = this. prec;
       this.next();
       this.y = 0;
       var right = this.parseNonSeqExpr(currentPrec, (context & CONTEXT_FOR)|CONTEXT_UNASSIGNABLE_CONTAINER );
       y += this.y;
       head = { type: !isBin(currentPrec )  ? 'LogicalExpression' :   'BinaryExpression',
                operator: o,
                start: head.start,
                end: right.end,
                loc: {
                   start: head.loc.start,
                   end: right.loc.end
                },
                left: core(head),
                right: core(right),
                y: y
              };
       this.y = y;
    }
  
    if ( prec === PREC_WITH_NO_OP ) {
      this.firstParen = firstParen ;
      this.firstUnassignable = firstUnassignable;
    }

    this.y = y;
    return head;
};


