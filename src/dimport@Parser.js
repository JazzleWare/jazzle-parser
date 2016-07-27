this.parseImport = function() {
  this.assert( this.canBeStatement );
  this.canBeStatement = false;

  var startc = this.c0, startLoc = this.locBegin();
  var hasList = false;
  this.next();
  var list = [], local = null;
  if ( this.lttype === 'Identifier' ) {
    local = this.validateID(null);
    list.push({ type: 'ImportDefaultSpecifier',
               start: local.start,
               loc: local.loc,
                end: local.end,
               local: local });
  }

  if ( this.lttype === ',' ) {
    this.assert(local !== null);
    this.next();
  }

  var spStartc = 0, spStartLoc = null;

  switch ( this.lttype ) {   
     case 'op':
       this.assert( this.ltraw === '*' );
       spStartc = this.c - 1;
       spStartLoc = this.locOn(1);
       this.next();
       this.expectID('as');
       this.assert(this.lttype === 'Identifier');
       local = this.validateID(null);
       list.push({ type: 'ImportNamespaceSpecifier',
                  start: spStartc,
                  loc: { start: spStartLoc, end: local.loc.end },
                   end: local.end,
                  local: local  }) ;
       break;

    case '{':
       hasList = !false;
       this.next();
       while ( this.lttype === 'Identifier' ) {
          local = this.id();
          var im = local; 
          if ( this.lttype === 'Identifier' ) {
             this.assert( this.ltval === 'as' );
             this.next();
             this.assert( this.lttype === 'Identifier' );
             local = this.validateID(null);
          }
          else this.validateID(local);

          list.push({ type: 'ImportSpecifier',
                     start: im.start,
                     loc: { start: im.loc.start, end: local.loc.end },
                      end: local.end, imported: im,
                    local: local }) ;

          if ( this.lttype === ',' )
             this.next();
          else
             break ;                                  
       }

       this.expectType('}');
       break ;
   }
    
   if ( list.length || hasList )
     this.expectID('from');

   this.assert(this.lttype === 'Literal' &&
        typeof this.ltval === STRING_TYPE );

   var src = this.numstr();
   var endI = this.semiI() || src.end, endLoc = this.semiLoc() || src.loc.end;
   
   this.foundStatement = !false;
   return { type: 'ImportDeclaration',
           start: startc,
           loc: { start: startLoc, end: endLoc  },
            end:  endI , specifiers: list,
           source: src };
}; 
