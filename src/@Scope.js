  
function Scope(parentScope, scopeMode, catchVars) {
   if ( scopeMode & SCOPE_LOOP )
     this.assert(!(scopeMode & SCOPE_FUNC));

   if ( !parentScope )
     this.assert( scopeMode === SCOPE_FUNC );
   
   this.parentScope = parentScope || null;
   if ( scopeMode & SCOPE_CATCH ) {
     this.assert( catchVars ); 
     this.catchVars = {};
     var e = 0;
     while ( e < catchVars.length ) {
        this.catchVars[name(catchVars[e])] = !false;
        e++ ;
     }
   }
   else
     this.catchVars = null;

   this.unresolved = {};
   this.defined = {};

   if ( scopeMode === SCOPE_FUNC )
      this.surroundingFunc = this;
   
   else
      this.surroundingFunc = this.parentScope.surroundingFunc;
 
   this.tempReleased = scopeMode === SCOPE_FUNC ? [] : null;

   this.scopeMode = scopeMode;
}

       
