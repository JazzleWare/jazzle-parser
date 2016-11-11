this . parseVariableDeclaration = function(context) {
     if ( ! this.canBeStatement &&
            this.err('not.stmt','var',context) )
       return this.errorHandlerOutput;

     this.canBeStatement = false;

     var startc = this.c0, startLoc = this.locBegin(), kind = this.ltval;
     var elem = null;

     this.next () ;

     var lexical = kind !== 'var';
     var isInArgList = false, inComplexArgs = 0, argNames = null;

     // #if V
     this.setDeclModeByName(kind);
     // #else
     if ( lexical ) {
       isInArgList = this.isInArgList;
       this.isInArgList = true;
       inComplexArgs = this.inComplexArgs ;
       this.inComplexArgs = ICA_LEXICAL;
       argNames = this.argNames;
       this.argNames = {};
     }
     // #end
     elem = this.parseVariableDeclarator(context);
     if ( elem === null ) {
       if (kind !== 'let' && 
           this.err('var.has.no.declarators',startc,startLoc,kind,elem,context,isInArgsList,inComplexArgs,argNames  ) )
         return this.errorHandlerOutput;
       // #if !V
       if ( lexical ) {
         this.isInArgsList = isInArgList;
         this.inComplexArgs = inComplexArgs;
         this.argNames = argNames;
       }
       // #end
       return null; 
     }

     var list = [elem];
     
     if (lexical) {
        if (!(this.scopeFlags & SCOPE_BLOCK))
          this.err('let.decl.not.in.block');
     }

     var isConst = kind === 'const';
     if ( isConst  && elem.init === null ) {
       this.assert(context & CONTEXT_FOR);
       this.unsatisfiedAssignment = elem;
     }

     if (!this.unsatisfiedAssignment) // parseVariableDeclarator sets it when it finds an uninitialized BindingPattern
          while ( this.lttype === ',' ) {
            this.next();     
            elem = this.parseVariableDeclarator(context);
            if (!elem &&
                 this.err('var.has.an.empty.declarator',startc,startLoc,kind,list,context,isInArgList,inComplexArgs,argNames ) )
              return this.erroHandlerOutput ;

            if (isConst) this.assert(elem.init !== null);
            list.push(elem);
          }
     // #if !V
     if ( lexical ) {
       this.isInArgsList = isInArgList;
       this.inComplexArgs = inComplexArgs;
       this.argNames = argNames;
     }
     // #end
     var lastItem = list[list.length-1];
     var endI = 0, endLoc = null;

     if ( !(context & CONTEXT_FOR) ) {
       endI = this.semiI() || lastItem.end;
       endLoc = this.semiLoc();
       if (  !endLoc ) {
          if ( this.newLineBeforeLookAhead ) endLoc =  lastItem.loc.end; 
          else if ( this.err('no.semi','var', [startc,startLoc,kind,list,endI] ) )
             return this.errorHandlerOutput;
       }
     }
     else {
       endI = lastItem.end;
       endLoc = lastItem.loc.end;
     }

     this.foundStatement  = !false ;

     return { declarations: list, type: 'VariableDeclaration', start: startc, end: endI,
              loc: { start: startLoc, end: endLoc }, kind: kind /* ,y:-1*/};
};

this . parseVariableDeclarator = function(context) {
  if ( (context & CONTEXT_FOR) &&
       this.lttype === 'Identifier' &&
       this.ltval === 'in' )
      return null;

  var head = this.parsePattern(), init = null;
  if ( !head ) return null;

  if ( this.lttype === 'op' && this.ltraw === '=' )  {
       this.next();
       init = this.parseNonSeqExpr(PREC_WITH_NO_OP,context);
  }
  else if ( head.type !== 'Identifier' ) { // our pattern is an arr or an obj?
       if (!( context & CONTEXT_FOR) )  // bail out in case it is not a 'for' loop's init
         this.err('var.decl.neither.of.in',head,init,context) ;

       if( !this.unsatisfiedAssignment )
         this.unsatisfiedAssignment  =  head;     // an 'in' or 'of' will satisfy it
  }

  var initOrHead = init || head;
  return { type: 'VariableDeclarator', id: head, start: head.start, end: initOrHead.end,
           loc: { start: head.loc.start, end: initOrHead.loc.end }, init: init && core(init)/* ,y:-1*/ };
};

