// #if V
this.reference = function(name, fromScope) {
  if (!fromScope) fromScope = this;
  var decl = this.findDeclInScope(name), ref = null;
  if (decl && !decl.scope.isFunc() && this.isFunc()) { // the decl is synthetic, and must be renamed
    decl.rename();
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
// #end
this.declare = function(name, declType) {
  return declare[declType].call(this, name);
};

// #if V
this.findRefInScope = function(name) {
  name += '%';
  return HAS.call(this.unresolvedNames, name) ?
            this.unresolvedNames[name] : null;
};
// #end

this.err = function(errType, errParams) {
   if (errType === 'exists.in.current') {
     var decl = errParams.newDecl,
         existingDecl = errParams.existingDecl;

     ASSERT.call(this, false, 
        'name "'+decl.name+'" is a "'+decl.type+
        '" and can not override the "'+existingDecl.type+
        '" that exists in the current scope');
   }
   else
     ASSERT.call(this, false, errType + '; PARAMS='+errParams);
};

var declare = {};

declare[VAR] = function(name) {
   var func = this.funcScope;
   // #if V
   var decl = new Decl(VAR, name, func, name);
   // #end
   var scope = this;
   scope.insertDecl(name
   // #if V
   , decl
   // #end
   );
   while (scope !== func) {
     scope = scope.parent;
     scope.insertDecl(name
     // #if V
     , decl
     // #end
     );
   }
   // #if V
   return decl;
   // #end
};

declare[LET] = function(name) {
   // #if V
   var decl = new Decl(LET, name, this, name);
   this.insertDecl(name, decl);
   return decl;
   // #else
   this.insertDecl(name);
   // #end
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
       this.err('exists.in.current',{
           newDecl:decl, existingDecl:existingDecl});
  }

  if (this !== func) {
    this.insertDecl0(true, name, decl);
    if (decl.type !== VAR && !decl.scope.isFunc()) {
      decl.rename();
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
  this.insertDecl0(name);
};

this.insertDecl0 = function(isOwn, name, decl) {
  name += '%';
  this.definedNames[name] = decl;
  if (isOwn)
    if (HAS.call(this.unresolvedNames, name)) {
      decl.refMode = this.unresolvedNames[name];
      this.unresolvedNames[name] = null;
    }
    else decl.refMode = new RefMode();
};

this.findDeclInScope = function(name) {
  name += '%';
  return HAS.call(this.definedNames, name) ? 
     this.definedNames[name] :
     // #if V 
     null
     // #else
     DECL_MODE_NONE
     // #end
     ;
};

this.finish = function() {
  // #if V
  var parent = this.parent;
  if (!parent) return;

  // hand the current scope's unresolved references to the parent scope
  for (var name in this.unresolvedNames) {
    if (!HAS.call(this.unresolvedNames, name)) continue;
    var n = this.unresolvedNames[name];
    if (n === null) continue;
    parent.reference(name.substring(0,name.length-1), this);
  }

  if (!this.isLoop()) return;

  for (var name in this.definedNames) {
    if (!HAS.call(this.definedNames, name)) continue;
    var n = this.definedNames[name];
    if (!n.needsScopeVar()) continue;
    this.addChildLexicalDeclaration(n);
  }
  // #end
};
    
// #if V
this.insertRef = function(name, ref) {
  this.unresolvedNames[name+'%'] = ref;
};

this.newSynthName = function(baseName) {
  var num = 0, func = this.funcScope;
  var name = baseName;
  for (;;num++, name = baseName + "" + num) {
     if (name === this.catchVar) continue;
     if (func.findDeclInScope(name)) continue; // must not be in the surrounding func scope's defined names, 
     if (func.findRefInScope(name)) continue; // must not be in the surrounding func scope's referenced names;
     if (!this.isFunc()) { // furthermore, if we're not allocating in a func scope,
       if (this.findRefInScope(name)) continue; // it must not have been referenced in the current scope
       
       // this one requires a little more clarification; while a func scope's defined names are "real" names (in the sense
       // that an entry like 'n' in the func scope's definedNames maps to a variable of the exact same name 'n'), it is not so
       // for lexical scopes; this gives us the possibility to choose synthesized name with the exact same name as the variable
       // itself. For example, if we want to find a synthesized approximate name for a name like 'n2' defined inside
       // a lexical scope, and it has satisfied all previous conditions (i.e., it's neither defined nor referenced in the 
       // surrounding func scope, and it has not been referenced in the scope we are synthesizing the name in), then the synthesized
       // name can be the name itself, in this case 'n2'.

       // if the current "suffixed" name (i.e., the baseName appended with num)
       // exists in the scope's declarations,
       if (this.findDeclInScope(name)) 
         // it must not actually be a suffixed name (i.e., it must be the base name,
         // which has not been appended with a 'num' yet); this the case only when num is 0, obviously.
         if (name !== baseName) continue; // alternatively, num !== 0 
     }
     break;
  }
  return name;
};

this.makeScopeObj = function() {
  if (this.scopeObjVar !== null) return;
  var scopeName = this.newSynthName('scope');
  this.scopeObjVar = this.declare(scopeName, LET);
  this.wrappedDeclList = [];
  this.wrappedDeclNames = {};
};   

this.allocateTemp = function() {
  var temp = "";
  if (this.tempStack.length) 
    temp = this.tempStack.pop();
  else {
    do {
      temp = this.funcScope.declSynth('temp');
    } while (temp === this.catchVar);
  }
  return temp;
};

this.releaseTemp = function(tempName) {
  this.tempStack.push(tempName);
};
 
this.declSynth = function(name) {
  ASSERT.call(this, this.isFunc());
  var synthName = this.newSynthName(name);
  this.declare(synthName, VAR);
  return synthName;
};
// #end

this.isLoop = function() { return this.type === SCOPE_TYPE_LEXICAL_LOOP; };
this.isLexical = function() { return this.type & SCOPE_TYPE_LEXICAL_SIMPLE; };
this.isFunc = function() { return this.type & SCOPE_TYPE_FUNCTION_EXPRESSION; };
this.isDeclaration = function() { return this.type === SCOPE_TYPE_FUNCTION_DECLARATION; };

// #if V
this.addChildLexicalDeclaration = function(decl) {
   ASSERT.call(this, this.isLoop(), 'only a loop scope can currently have a scope var');
   this.makeScopeObj();
   var funcScope = this.funcScope;
   funcScope.removeDecl(decl);
   this.wrappedDeclList.push(decl);
   this.wrappedDeclNames[decl.name+'%'] = decl;
   decl.synthName = decl.name;
};

this.removeDecl = function(decl) {
   delete this.definedNames[decl.synthName+'%'];
   return decl;
};
// #end
