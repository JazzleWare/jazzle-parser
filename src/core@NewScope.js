this.reference = function(name, fromScope) {
  if (!fromScope) fromScope = this;
  var decl = this.findDeclInScope(name), ref = null;
  if (decl && !decl.funcDecl() && this.isFunc()) { // the decl is synthetic, and must be renamed
    var synthName = decl.scope.newSynthName(decl.name);
    decl.synthName = synthName;
    this.insertDecl0(false, synthName, decl);
    decl = null;
    // TODO: the name should be deleted altogether (i.e., `delete this.definedNames[name+'%']`),
    // but looks like setting it to null will do
    this.definedNames[name+'%'] = null;
  }
  if (decl) {
    ref = decl.refMode;
    if (this !== fromScope) ref.updateExistingRefWith(name, fromScope);
    else ref.direct |= ACCESS_EXISTING;
  }
  else {
    ref = this.findRefInScope(name);
    if (!ref) {
      ref = new RefMode();
      this.insertRef(name, ref);
    }
    if (this !== fromScope) ref.updateForwardRefWith(name, fromScope);
    else ref.direct |= ACCESS_FORWARD;
  }
};

this.declare = function(name, declType) {
  return declare[declType].call(this, name);
};

this.findRefInScope = function(name) {
  name += '%';
  return HAS.call(this.unresolvedNames, name) ?
            this.unresolvedNames[name] : null;
};

var declare = {};

declare[VAR] = function(name) {
   var func = this.funcScope;
   var decl = new Decl(VAR, name, func, name);
   var scope = this;
   scope.insertDecl(name, decl);
   while (scope !== func) {
     scope = scope.parent;
     scope.insertDecl(name, decl);
   }
};

declare[LET] = function(name) {
   var decl = new Decl(LET, name, this, name);
   this.insertDecl(name, decl);
};

this.insertDecl = function(name, decl) {
  var existingDecl = this.findDeclInScope(name);
  var func = this.funcScope;
  if (existingDecl !== null) {
    if (decl.type === VAR && existingDecl.type === VAR) // if a var decl is overriding a var decl of the same name,
      return; // no matter what scope we are in, it's not a problem.
     
    if ( 
         ( // but
           this === func && // if we are in func scope
           existingDecl.scope === func // and what we are trying to override is real (i.e., not synthesized)
         ) ||
         this !== func // or we are in a lexical scope, trying to override a let with a var or vice versa, 
       ) // then raise an error
       ASSERT.call(this, false, 
        'name "'+decl.name+'" is a "'+decl.type+
        '" and can not override the "'+existingDecl.type+'" that exists in the current scope');
  }
  if (this !== func) {
    this.insertDecl0(true, name, decl);
    if (decl.type !== VAR && !decl.scope.isFunc()) {
      var synthName = decl.scope.newSynthName(name);
      decl.synthName = synthName;
      func.insertDecl0(false, synthName, decl);
    }
  }
  else {
    this.insertDecl0(true, name, decl);
    if (existingDecl !== null) { // if there is a synthesized declaration of the same name, rename it
      var synthName = existingDecl.scope.newSynthName(name);
      existingDecl.synthName = synthName;
      this.insertDecl0(false, synthName, existingDecl);
    } 
  }
};

this.insertDecl0 = function(isOwn, name, decl) {
  name += '%';
  this.definedNames[name] = decl;
  if ( isOwn && HAS.call(this.unresolvedNames, name)) {
    decl.refMode = this.unresolvedNames[name];
    this.unresolvedNames[name] = null;
  }
};

this.findDeclInScope = function(name) {
  name += '%';
  return HAS.call(this.definedNames, name) ? 
     this.definedNames[name] : null;
};

this.finish = function() {
  var parent = this.parent;
  if (!parent) return;
  for (var name in this.unresolvedNames) {
    if (!HAS.call(this.unresolvedNames, name)) continue;
    var ref = this.unresolvedNames[name];
    if (ref === null) continue;
    parent.reference(name.substring(0,name.length-1), this);
  }
};
    
this.insertRef = function(name, ref) {
  this.unresolvedNames[name+'%'] = ref;
};

this.newSynthName = function(baseName) {
  var num = 0, func = this.funcScope;
  var name = baseName + '%';
  for (;;num++, name = baseName + "" + num + '%') {
     if (HAS.call(func.definedNames, name)) continue; // must not be in the surrounding func scope's defined names, 
     if (HAS.call(func.unresolvedNames, name)) continue; // must not be in the surrounding func scope's referenced names;
     if (!this.isFunc()) { // furthermore, if we're not allocating in a func scope,
       if (HAS.call(this.unresolvedNames, name)) continue; // it must not have been referenced in the current scope
       
       // this one requires a little more clarification; while a func scope's defined names are "real" names (in the sense
       // that an entry like 'n' in the func scope's definedNames maps to a variable of the exact same name 'n'), it is not so
       // for lexical scopes; this gives us the possibility to choose synthesized name with the exact same name as the variable
       // itself. For example, if we want to find a synthesized approximate name for a name like 'n2' defined inside
       // a lexical scope, and it has satisfied all previous conditions (i.e., it's neither defined nor referenced in the 
       // surrounding func scope, and it has not been referenced in the scope we are synthesizing the name in), then the synthesized
       // name can be the name itself, in this case 'n2'.
       if (HAS.call(this.definedNames, name)) // if the current suffixed name exists in the scope's declarations,
         // it must not actually be a suffixed name (i.e., it must be the base name, which has not been appended with a 'num' yet) 
         if (name !== baseName+'%') continue; // or, num !== 0 
     }
     break;
  }
  return num ? baseName + "" + num : baseName;
};

this.isFunc = function() { return this === this.funcScope; };     
