_class.parseExport = function() {
   this.assert( this.canBeStatement );
   this.canBeStatement = false;

   var startc = this.c0, startLoc = this.locBegin();
   this.next();

   var list = [], local = null, src = null ;
   var endI = 0;
   var ex = null;

   switch ( this.lttype ) {
      case 'op':
         this.assert(this.ltraw === '*' );
         this.next();
         this.expectID('from');
         this.assert(this.lttype === 'Literal' &&
              typeof this.ltval === STRING_TYPE );
         src = this.numstr();
         
         endI = this.semiI();
         this.foundStatement = !false;
         
         return  { type: 'ExportAllDeclaration',
                    start: startc,
                    loc: { start: startLoc, end: this.semiLoc() || src.loc.end },
                     end: endI || src.end,
                    source: src };

       case '{':
         this.next();
         var firstReserved = null;

         while ( this.lttype === 'Identifier' ) {
            local = this.id();
            if ( !firstReserved ) {
              this.throwReserved = false;
              this.validateID(local);
              if ( this.throwReserved )
                firstReserved = local;
              else
                this.throwReserved = !false;
            }
            ex = local;
            if ( this.lttype === 'Identifier' ) {
              this.assert( this.ltval === 'as' );
              this.next();
              this.assert( this.lttype === 'Identifier' );
              ex = this.id();
            }
            list.push({ type: 'ExportSpecifier',
                       start: local.start,
                       loc: { start: local.loc.start, end: ex.loc.end }, 
                        end: ex.end, exported: ex,
                       local: local }) ;

            if ( this.lttype === ',' )
              this.next();
            else
              break;
         }

         endI = this.c;
         var li = this.li, col = this.col;
   
         this.expectType( '}' );

         if ( this.lttype === 'Identifier' ) {
           this.assert( this.ltval === 'from' );
           this.next();
           this.assert( this.lttype === 'Literal' &&
                  typeof this.ltval ===  STRING_TYPE );
           src = this.numstr();
           endI = src.end;
         }
         else
            this.assert(!firstReserved);

         endI = this.semiI() || endI;

         this.foundStatement = !false;
         return { type: 'ExportNamedDeclaration',
                 start: startc,
                 loc: { start: startLoc, end: this.semiLoc() || ( src && src.loc.end ) ||
                                              { line: li, column: col } },
                  end: endI, declaration: null,
                   specifiers: list,
                  source: src };

   }

   var context = CONTEXT_NONE;

   if ( this.lttype === 'Identifier' && 
        this.ltval === 'default' ) { context = CONTEXT_DEFAULT; this.next(); }
  
   if ( this.lttype === 'Identifier' ) {
       switch ( this.ltval ) {
          case 'let':
          case 'const':
             this.assert(context !== CONTEXT_DEFAULT );
             this.canBeStatement = !false;
             ex = this.parseVariableDeclaration(CONTEXT_NONE);
             break;
               
          case 'class':
             this.canBeStatement = !false;
             ex = this.parseClass(context);
             break;
  
          case 'var':
             this.canBeStatement = !false;
             ex = this.parseVariableDeclaration(CONTEXT_NONE ) ;
             break ;

          case 'function':
             this.canBeStatement = !false;
             ex = this.parseFunc( context, WHOLE_FUNCTION, ANY_ARG_LEN );
             break ;
        }
   }

   if ( context !== CONTEXT_DEFAULT ) {

     this.assert(ex);
     endI = this.semiI();
     
     this.foundStatement = !false;
     return { type: 'ExportNamedDeclaration',
            start: startc,
            loc: { start: startLoc, end: ex.loc.end },
             end: ex.end , declaration: ex,
              specifiers: list ,
             source: null };
   }

   var endLoc = null;
   if ( ex === null ) {
        ex = this.parseNonSeqExpr(PREC_WITH_NO_OP, CONTEXT_NONE );
        endI = this.semiI();
        endLoc = this.semiLoc();
   }

   this.foundStatement = !false;
   return { type: 'ExportDefaultDeclaration',    
           start: startc,
           loc: { start: startLoc, end: endLoc || ex.loc.end },
            end: endI || ex.end, declaration: core( ex ) };
}; 
