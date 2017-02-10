// #if V
this.reference = function(name, fromScope) {
  if (!fromScope) fromScope = this;

  var decl = this.findDeclInScope(name), ref = null;
  if (decl) {
    ref = decl.refMode;
    if (this !== fromScope) {
      ref.updateExistingRefWith(name, fromScope);
      ref.lors = ref.lors.concat(fromScope.findRefInScope(name).lors);
      if (fromScope.isConcrete()) ref.lors.push(fromScope);

      // a catch name is never forward-accessed, even when referenced from within a function declaration 
      if (decl.type & DECL_MODE_CATCH_PARAMS) 
        if (ref.indirect) ref.indirect = ACCESS_EXISTING;
    }
    else ref.direct |= ACCESS_EXISTING;
  }
  else {
    ref = this.findRefInScope(name);
    if (!ref) {
      ref = new RefMode();
      this.insertRef(name, ref);
    }
    if (this !== fromScope) {
      ref.updateForwardRefWith(name, fromScope);
      ref.lors = ref.lors.concat(fromScope.findRefInScope(name).lors);
      if (fromScope.isConcrete()) ref.lors.push(fromScope);
    }
    else
      ref.direct |= ACCESS_FORWARD;
  }
};
// #end

this.declare = function(name, declType) {
  return declare[declType].call(this, name, declType);
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

this.hoistIdToScope = function(id, targetScope /* #if V */, decl /* #end */ ) { 
   var scope = this;
   /* #if V */ var isFresh = targetScope.findDeclInScope(id.name) === null; /* #end */
   while (true) {
     ASSERT.call(this, scope !== null, 'reached the head of scope chain while hoisting name "'+id+'"'); 
     if ( !scope.insertDecl(id /* #if V */, decl /* #end */ ) )
       break;

     if (scope === targetScope)
       break;

     scope = scope.parent;
   }
   // #if V
   if (isFresh) targetScope.nameList.push(decl);
   // #end
};
   
var declare = {};

declare[DECL_MODE_FUNCTION_PARAMS] = declare[DECL_MODE_FUNC_NAME] =
declare[DECL_MODE_VAR] = function(id, declType) {
   var func = this.funcScope;
   // #if V
   var decl = new Decl(declType, id.name, func, id.name);
   // #end

   this.hoistIdToScope(id, func /* #if V */ , decl /* #end */ );

   // #if V
   return decl;
   // #end
};

declare[DECL_MODE_CATCH_PARAMS|DECL_MODE_LET] =
declare[DECL_MODE_LET] = function(id, declType) {
   // #if V
   if (declType & DECL_MODE_CATCH_PARAMS)
     this.catchVarIsSynth = true;

   var decl = new Decl(declType, id.name, this, id.name);
   this.insertDecl(id, decl);
   this.nameList.push(decl);
   return decl;
   // #else
   this.insertDecl(id);
   // #end
};

declare[DECL_MODE_CATCH_PARAMS] = function(id, declType) {
  var name = id.name + '%';
  // #if V
  this.catchVarIsSynth = false; 
  var catchVar = new Decl( DECL_MODE_CATCH_PARAMS, id.name, this, id.name);
  this.catchVarName = id.name;

  this.insertDecl(id, catchVar); 
  this.nameList.push(catchVar);
  // #else
  this.insertDecl(id);
  // #end
};
 
// returns false if the variable was not inserted
// in the current scope because of having
// the same name as a catch var in the scope
// (this implies the scope must be a catch scope for this to happen)
this.insertDecl = function(id /* #if V */, decl /* #end */) {

  var declType = /* #if V */ decl.type; /* #else */ this.declMode; /* #end */
  var existingDecl = this.findDeclInScope(id.name);
  var func = this.funcScope;

  if (existingDecl !== DECL_NOT_FOUND) {
    var existingType = existingDecl/* #if V */.type/* #end */;

    // if a var name in a catch scope has the same name as a catch var,
    // it will not get hoisted any further
    if ((declType & DECL_MODE_VAR) && (existingType & DECL_MODE_CATCH_PARAMS))
       return false;

    // if a var decl is overriding a var decl of the same name, no matter what scope we are in,
    // it's not a problem.
    if ((declType & DECL_MODE_VAR) && (existingType & DECL_MODE_VAR))
      return true; 
     
    this.err('exists.in.current', { id: id });
  }

  // #if V
  this.insertDecl0(true, id.name, decl);
  this.insertID(id);
  // #else
  this.insertDecl0(id);
  // #end

  return true;
};

this.insertID = function(id) {
  this.idNames[id.name+'%'] = id;
};

// #if V
// TODO: looks like `isFresh` is not necessary
this.insertDecl0 = function(isFresh, name, decl) {
  name += '%';
  this.definedNames[name] = decl;
  if (isFresh)
    if (HAS.call(this.unresolvedNames, name)) {
      decl.refMode = this.unresolvedNames[name];
      this.unresolvedNames[name] = null;
    }
    else decl.refMode = new RefMode();
};
// #end

this.findDeclInScope = function(name) {
  name += '%';
  return HAS.call(this.definedNames, name) ? 
     this.definedNames[name] : DECL_NOT_FOUND;
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
  // #end
};
    
// #if V
this.insertRef = function(name, ref) {
  this.unresolvedNames[name+'%'] = ref;
};

this.newSynthName = function(baseName) {
  var num = 0;
  var name = baseName;
  var ref = this.findDeclInScope(baseName).refMode;
  var targetScope = this.funcScope; 

  RENAME:
  for (;;num++, name = baseName + "" + num) {
     if (targetScope.findDeclByEmitNameInScope(name))
       continue; // must not be in the surrounding func scope's defined names, 
     if (targetScope.findRefByEmitNameInScope(name)) continue; // must not be in the surrounding func scope's referenced names;
     if (ref) {
       var list = ref.lors, i = 0;
       while (i < list.length) {
         var rs = list[i];
         if (rs.findDeclInScope(name))
           continue RENAME;
         i++;
       }
     }

     break;
  }
  return name;
};

this.makeScopeObj = function() {
  if (this.scopeObjVar !== null) return;
  var scopeName = this.newSynthName('scope');
  var scopeObjVar = new Decl(DECL_MODE_LET, scopeName, this, scopeName);
  this.insertDecl0(false, scopeName, scopeObjVar); // TODO: not necessary?
  this.funcScope.insertDecl0(false, scopeName, scopeObjVar);
  this.scopeObjVar = scopeObjVar;
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
  ASSERT.call(this, this.isConcrete());
  var synthName = this.newSynthName(name);
  this.definedEmitNames[synthName+'%'] =
    new Decl(DECL_MODE_VAR, synthName, this, synthName);

  return synthName;
};
// #end

this.isLoop = function() { return this.type & SCOPE_TYPE_LEXICAL_LOOP; };
this.isLexical = function() { return this.type & SCOPE_TYPE_LEXICAL_SIMPLE; };
this.isFunc = function() { return this.type & SCOPE_TYPE_FUNCTION_EXPRESSION; };
this.isDeclaration = function() { return this.type === SCOPE_TYPE_FUNCTION_DECLARATION; };
this.isCatch = function() { return (this.type & SCOPE_TYPE_CATCH) === SCOPE_TYPE_CATCH; };
this.isGlobal = function() { return this.type === SCOPE_TYPE_GLOBAL; };

// a scope is concrete if a 'var'-declaration gets hoisted to it
this.isConcrete = function() {
  return this.type === SCOPE_TYPE_SCRIPT ||
         this.type === SCOPE_TYPE_GLOBAL ||
         this.isFunc();
};

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

/* consider this contrived example:
   function a() {
     var v = null, v1 = null;
     while (false) {
       let v = 12; // synthName=v2
       function b() {
         try { throw 'e' }
         catch (v2) {
            console.log(v);
            // prints the value of v, i.e 12, because v's emit name is v2 -- and this behaviour is *not* what we want
            // this means for every name referenced in a catch scope, we have to ensure
            // emit name for that name does not clash with (i.e, is not the same as) the catch variable; if it is, though,
            // the catch variable must be renamed.
            // this might look like a simple rename-as-you-go scheme like the one we are currently using on non-catch scopes;
            // BUT it is not that simple, because:
            // a) the catch variable's name can not be determined until the very end of the catch scope, where all names that could
            // have caused a rename have been visited.
            // b) a 'let'-var's name is calculated taking the currently accessible catch-var names (along with their synth names)
            // into account; the problem is, those catch-vars might change their synth names due to the reasons detailed above;
            // even though this renaming is in turn done taking the currently accessible synth names
            // into account to prevent name clashes, unnecessary renames look to abound in the process.

            // one solution is to save the catch var when the catch scope begins, and add it to the list of the catch scope's defined
            // names only at the end of the scope

            // another solution is to keep track of every catch variable in function scope, and at the same time renaming
            // any synthesized name that clashes with a catch var name each time a catch var is added to the catch var list;
            // but this solution renames a synthesized name even when it is not in the same scope as the catch var,
            // like so:
            //   var v, v1;
            //   {
            //     let v = 12; // synthName=v2
            //     try {}
            //
            //     catch (v2) {} // renames previous v2 to something else 
            //   }
          }
       }
     }
   }
*/

this.setCatchVar = function(name) {
  ASSERT.call(this, this.isCatch(), 'only a catch scope can have a catch variable');
  ASSERT.call(this, this.catchVar === "", 'scope has already got a catch var: ' + this.catchVarName);
  this.catchVarName = name;
};

this.finishWithActuallyDeclaringTheCatchVar = function() {
  // catch var names of catch scopes with non-simple catch params are calculated in the emit phase
  if ( this.catchVarName === "" ) return;

  // TODO: this.insertDecl0(true, synthName, decl), maybe?
  var synthName = this.newSynthName(this.catchVarName);
  var decl = this.findDeclInScope(this.catchVarName);
  decl.synthName = synthName;
};

function getOrCreate(l, name) {
  var entry = l.findName(name);
  if (!entry)
    entry = l.addNewLiquidName(name);
   
  return entry;
};

this.getOrCreateLocalLiquidName = function(name) {
  var entry = null;
  if ( !this.funcScope.localLiquidNames )
    this.funcScope.localLiquidNames = new LiquidNames();
  
  return getOrCreate(this.funcScope.localLiquidNames, name);
};

// if a name is either referenced at func scope, directly or indirectly,
// or it is a func scope binding, real or synth, it must be passed to this method
this.updateLiquidNamesWith = function(name) {
  if (this.funcScope.globalLiquidNames)
    this.funcScope.globalLiquidNames.mustNotHaveReal(name);
  if (this.funcScope.localLiquidNames)
    this.funcScope.localLiquidNames.mustNotHaveReal(name);
};

this.getOrCreateGlobalLiquidName = function(name) {
  if (!this.funcScope.globalLiquidNames)
    this.funcScope.globalLiquidNames = new LiquidNames();

  return getOrCreate(this.funcScope.globalLiquidNames, name);
};  

this.synthesizeNames = function() {
  var list = null, e = 0;
  // synthesize everything -- even the real names;
  // because in the presence of references that cross function boundaries,
  // the function's name list is of little actual help.
  // one solution is to have every reference keep track of the scope it was not resolved in; 
  // the informarion can then be used while calculating the synthetic name for the reference (in case the reference resolves to
  // a decl that must be synthesized), or when the reference has resolved to a real (i.e., func-scope)
  // name declaration; in the former case, the name has to be chosen taking the names in the tracking scopes into account;
  // the latter case, though, is something the opposite -- the tracking scopes must rename the decls in their name lists
  // so as to avoid possible clashes with the reference's name, recursively applying the rename semantics, i.e., renaming their entries  // keeping the scopes those entries are tracking into account.
  // the solution is potentially heavy, and complex.
  //
  // another solution is to defer the name synthesization until the very end of the very last scope; when there, the top-most
  // scope will be synthesized first, followed by its descendant scopes,
  // followed by theirs, and so on, until all scopes are synthesized; this way, every reference's emit name is already known,
  // as they have already been synthesized in a parent of the current scope; any variable that possibly clashes with that reference's
  // name will have to be renamed regardless of whether it is a variable that has to be synthesized nevertheless, or of whether it is a  // real name.
  // this solution is obviously unfaithful to the source's names, potentially at least, but it is way more simple,
  // way more straightforward, and, arguably, way more lighter, and it is the solution currently used.
  list = this.nameList;
  e = 0;
  while (e < list.length)
    this.synthesizeDecl(list[e++]);

  list = this.children;
  if (list.length) {
    e = 0;
    while (e < list.length)
      list[e++].synthesizeNames();
  }
};

this.createMappingForUnresolvedNames = function() {
  ASSERT.call(this, !this.referencedEmitNames, 'this scope has already got a referencedemitNames');
  this.referencedEmitNames = {};

  for (var name in this.unresolvedNames ) {
    if (!HAS.call(this.unresolvedNames, name) )
      continue;
    if (this.unresolvedNames[name] === null) 
      continue;

    var resolvedRef = this.definedNames[name]; // will look it up the prototype chain, which is in this case the scope chain
    this.updateLiquidNamesWith(resolvedRef.synthName);
    this.referencedEmitNames[resolvedRef.synthName+'%'] = resolvedRef;
  }
};

this.findRefByEmitNameInScope = function(name) {
  if (!this.referencedEmitNames)
    this.createMappingForUnresolvedNames();
  name += '%';
  return HAS.call(this.referencedEmitNames, name) ?
    this.referencedEmitNames[name] : null;
};

this.synthesizeDecl = function(decl) {
  ASSERT.call(this, this === decl.scope, 'a scope can only synthesize its own declarations');
  var synthName = this.newSynthName(decl.name);
  decl.synthName = synthName;
  this.funcScope.insertEmitName(synthName, decl);
  this.updateLiquidNamesWith(synthName);
};

this.insertEmitName = function(name, decl) {
  this.definedEmitNames[name+'%'] = decl;
}; 

this.findDeclByEmitNameInScope = function(name) {
  name += '%';
  return HAS.call(this.definedEmitNames, name) ? 
    this.definedEmitNames[name] : null;
};
// #end

