this.parseImport = function() {
  if (!this.canBeStatement)
    this.err('not.stmt','import');

  this.canBeStatement = false;

  var startc = this.c0,
      startLoc = this.locBegin(),
      hasList = false;

  this.next();

  var list = [], local = null;
  if ( this.lttype === 'Identifier' ) {
    local = this.validateID(null);
    list.push({
      type: 'ImportDefaultSpecifier',
      start: local.start,
      loc: local.loc,
      end: local.end,
      local: local
    });
  }

  if (this.lttype === ',') {
    if (local === null)
      this.err('import.no.elem.yet.comma',startc,startLoc);

    this.next();
  } 
  var spStartc = 0, spStartLoc = null;
  
  switch (this.lttype) {   
  case 'op':
    if (this.ltraw !== '*')
      this.err('import.namespace.specifier.not.*',startc, startLoc);
    else {
      spStartc = this.c - 1;
      spStartLoc = this.locOn(1);
  
      this.next();
      if (!this.expectID_soft('as'))
        this.err('import.namespace.specifier.no.as',startc, startLoc, spStartc, spStartLoc);
      if (this.lttype !== 'Identifier')
        this.err('import.namespace.specifier.local.not.id',startc,startLoc,spStartc, spStartLoc );
 
      local = this.validateID(null);
      list.push({
        type: 'ImportNamespaceSpecifier',
        start: spStartc,
        loc: { start: spStartLoc, end: local.loc.end },
        end: local.end,
        local: local
      });
    }
    break;
  
  case '{':
     hasList = !false;
     this.next();
     while ( this.lttype === 'Identifier' ) {
        local = this.id();
        var im = local; 
        if ( this.lttype === 'Identifier' ) {
           if ( this.ltval !== 'as' && 
                this.err('import.specifier.no.as',startc,startLoc,local) )
             return this.errorHandlerOutput ;
  
           this.next();
           if ( this.lttype !== 'Identifier' &&
                this.err('import.specifier.local.not.id',startc,startLoc,local) )
             return this.errorHandlerOutput ;
  
           local = this.validateID(null);
        }
        else this.validateID(local.name);
  
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
  
     if ( !this.expectType_soft('}') && 
           this.err('import.specifier.list.unfinished',startc,startLoc,list) )
       return this.errorHandlerOutput  ;
  
     break ;
   }
   if ( list.length || hasList ) {
      if ( !this.expectID_soft('from') &&
            this.err('import.from',startc,startLoc,list) )
        return this.errorHandlerOutput;
   }

   if ( !(this.lttype === 'Literal' &&
        typeof this.ltval === STRING_TYPE ) && this.err('import.source.is.not.str') )
     return this.errorHandlerOutput;

   var src = this.numstr();
   var endI = this.semiI() || src.end, 
       semiLoc = this.semiLoc();

   if ( !semiLoc && !this.newLineBeforeLookAhead &&
        this.err('no.semi','import',{s:startc,l:startLoc,list:list,endI:endI,src:src }) )
     return this.errorHandlerOutput;
   
   this.foundStatement = !false;
   return { type: 'ImportDeclaration',
           start: startc,
           loc: { start: startLoc, end: semiLoc || src.loc.end  },
            end:  endI , specifiers: list,
           source: src };
}; 
