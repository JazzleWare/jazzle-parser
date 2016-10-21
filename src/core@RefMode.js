this.updateExistingRefWith = function(name, fromScope) {

  // TODO: check whether the scope has a direct eval, because it can make things like this happen:
  // var a = []; while (a.length<12) { let e = a.length; a.push(function(){ return eval("e++") }); }
  // when there is a direct eval in a (possibly loop) scope, the transformation for closure-let must be applied for every let
  // declaration the scope might contain, even if none of them has been expressly accessed from inside a function
  if (!fromScope.isFunc()) {
    var ref = fromScope.unresolvedNames[name+'%'];
    if (ref.indirect) this.indirect |= ACCESS_EXISTING;
    if (ref.direct) this.direct |= ACCESS_EXISTING;
  }
  else {
    // let e = 12; var l = function() { return e--; };
    if (!fromScope.isDeclaration) this.indirect |= ACCESS_EXISTING;

    // let e = 12; function l()  { return e--; } 
    else this.indirect |= ACCESS_FORWARD;
  }
};

this.updateForwardRefWith = function(name, fromScope) {
   var ref = fromScope.unresolvedNames[name+'%'];
   if (fromScope.isFunc()) {
     this.indirect |= ref.direct;
     this.indirect |= ref.indirect;
   }
   else {
     this.indirect |= ref.indirect;
     this.direct |= ref.direct;
   }   
};

