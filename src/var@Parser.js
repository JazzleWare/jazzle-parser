this . parseVariableDeclaration = function(context) {
     if ( ! this.canBeStatement )
         this['not.stmt']('var');

     this.canBeStatement = false;

     var startc = this.c0, startLoc = this.locBegin(), kind = this.ltval;
     var elem = null;

     this.next () ;

     this.setDeclModeByName(kind);

     elem = this.parseVariableDeclarator(context);
     var y = this.y;
   
     if ( elem === null ) {
       if (kind !== 'let' ) 
         this['var.has.no.declarators'](startc,startLoc,kind);

       return null; 
     }

     var list = [elem];
     if ( !this.unsatisfiedAssignment ) // parseVariableDeclarator sets it when it finds an uninitialized BindingPattern
          while ( this.lttype === ',' ) {
            this.next();     
            elem = this.parseVariableDeclarator(context);
            if (!elem )
              this['var.has.an.empty.declarator'](startc,startLoc,kind);

            y += this.y;
            list.push(elem);
          }

     var lastItem = list[list.length-1];
     var endI = 0, endLoc = null;

     if ( !(context & CONTEXT_FOR) ) {
       endI = this.semiI() || lastItem.end;
       endLoc = this.semiLoc();
       if (  !endLoc ) {
          if ( this.newLineBeforeLookAhead ) endLoc =  lastItem.loc.end; 
          else  this['no.semi']('var',startc,startLoc,kind );
       }
     }
     else {
       endI = lastItem.end;
       endLoc = lastItem.loc.end;
     }

     this.foundStatement  = !false ;

     this.y = y;
     return { declarations: list, type: 'VariableDeclaration', start: startc, end: endI,
              loc: { start: startLoc, end: endLoc }, kind: kind, y: y };
};

this . parseVariableDeclarator = function(context) {
  if ( (context & CONTEXT_FOR) &&
       this.lttype === 'Identifier' &&
       this.ltval === 'in' )
      return null;

  var head = this.parsePattern(), init = null;
  if ( !head ) return null;
  
  var y = this.y;

  if ( this.lttype === 'op' && this.ltraw === '=' )  {
       this.next();
       init = this.parseNonSeqExpr(PREC_WITH_NO_OP,context);
       y += this.y;
  }
  else if ( head.type !== 'Identifier' ) { // our pattern is an arr or an obj?
       if (!( context & CONTEXT_FOR) )  // bail out in case it is not a 'for' loop's init
         this['var.decl.neither.of.in'](head) ;

       if( !this.unsatisfiedAssignment )
         this.unsatisfiedAssignment  =  head;     // an 'in' or 'of' will satisfy it
  }

  var initOrHead = init || head;

  this.y = y;
  return { type: 'VariableDeclarator', id: head, start: head.start, end: initOrHead.end,
           loc: { start: head.loc.start, end: initOrHead.loc.end }, init: init && core(init), y: y };
};

