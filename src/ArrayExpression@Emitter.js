this._emitBody = function(blockOrExpr) {
  if ( blockOrExpr.type !== 'BlockStatement' ) {
    this.indent();
    this.emit(blockOrExpr);
    this.unindent();
  }
  else
    this.emit(blockOrExpr);
};

this._emitBlock = function(block) {
   this.indent();
   var list = n.body, e = 0 ;
   while ( e < list.length ) {
      this.emit(list[e]);
      e++;
   }
   this.unindent();
};
 
this._writeArray = function(list, i) {   
   this.write('[');
   while ( i < list.length ) {
      if ( list[i].type === 'SpreadElement' )
        break;

      this.emit(list[i]);
      i++;
   }
   this.write(']');
};
     
this.emitters['ArrayExpression'] = function(n) {
   if ( !n.spread )
     return this._writeArray(n.elements);

   var list = n.elements, e = 0;
 
   this.write(this.specials.concat);
   this.write('(');
   while ( e < list.length ) {
      if ( e ) this.write(', ');
      if ( list[e].type === 'SpreadElement' ) {
        this.emit(list[e].argument);
        e++ ;
      }
      else
        e = this._writeArray(list, e);
   }
   this.write(')');
};
    
this.emitters['BlockStatement'] = function(n) {
   this.writeLine('{');
   this._emitBlock(n.body);
   this.writeLine('}');
};

this.emitters['ForStatement'] = function(n) {
   this.write('for (');
   if ( n.init ) this.emit(n.init);
   this.write(';');
   if ( n.test ) this.emit(n.test);
   this.write(';');
   if ( n.update ) this.emit(n.update);
   this.write(')');
   this._emitBody(n.body);
};

function isSimpleCh(ch) {
   return (ch >= CHAR_A && ch <= CHAR_Z) ||
          (ch >= CHAR_a && ch <= CHAR_z) ||
          (ch === CHAR_UNDERLINE)        ||
          (ch <= CHAR_0 && ch >= CHAR_9) ||
          (ch === CHAR_$);
}

this.emitters['Identifier'] = function(n) {
   var name = n.name;
   var e = 0;
   var nameString = "";
   var simplePortionStart = 0;
   while ( e < name.length ) {
      var ch = name.charCodeAt(e);
      if ( isSimpleCh(ch) ) e++; 
      else {
         nameString += name.substring(simplePortionStart,e);
         e++;
         nameString += '\\u' + hex(ch);
         simplePortionStart = e;
      }
   }
   if ( e > simplePortionStart )
     nameString += name.substring(simplePortionStart,e);

   this.write(nameString);
};

function hasDanglingElse(n) {
  if (  n.alternate === null ||
        n.consequent.type !== 'IfStatement' )
    return false;

  var ifBody = n.consequent;
  if ( ifBody.alternate === null )
    return !false;

  if ( ifBody.alternate.type !== 'IfStatement' )
    return false;

  return hasDanglingElse(ifBody.alternate);
}
    
this.emitters['IfStatement'] = function(n) {
   this.write('if (');
   this.emit(n.test);
   this.write(')');
   if ( hasDanglingElse(n) ) {
     this.writeLine('{');
     this._emitBody(n.consequent);
     this.writeLine('}');
   }
   else this._emitBody(n.consequent);

   if (n.alternate) {       
     this.write('else');
     this._emitBody (n.alternate);
   }
};
   
this.emitters['MemberExpression'] = function(n) {
}
      
