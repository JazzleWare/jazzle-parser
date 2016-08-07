this._emitBody = function(blockOrExpr) {
  if ( blockOrExpr.type !== 'BlockStatement' ) {
    this.indent();
    this.newlineIndent();
    this.emit(blockOrExpr);
    this.unindent();
  }
  else
    this.emit(blockOrExpr);
};

this._emitBlock = function(list) {
   this.indent();
   var e = 0 ;
   while ( e < list.length ) {
      this.newlineIndent();
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
   this.emitContext = EMIT_CONTEXT_NONE;
   if ( !n.spread )
     return this._writeArray(n.elements);

   var list = n.elements, e = 0;
 
   this.write(this.special('concat') );
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
   this.write('{');
   this._emitBlock(n.body);
   this.newlineIndent();
   this.write('}');
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
   
this.emitters['IfStatement'] = function(n) {
   this.write('if (');
   this.emit(n.test);
   this.write(')');
   this._emitBody(n.consequent);

   if (n.alternate) {   
     this.newlineIndent();    
     this.write('else');
     this._emitBody (n.alternate);
   }
};
   
this.emitters['MemberExpression'] = function(n) {
  if ( isComplexExpr(n.object) )
    this._paren(n.object);  

  if ( n.computed ) {
    this.write('[');
    this.emit(n.property);
    this.write(']');
  }

  else {
    this.write('.');
    this.emit(n.property);

  }
};

this.emitters['NewExpression'] = function(n) {
};

this.emitters['Identifier'] = function(n) {
   this.emitContext = EMIT_CONTEXT_NONE;
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
 
this.emitters['WhileStatement'] = function(n) {
  this.write('while (');
  this.emit(n.test);
  this.emit(')');
  this._emitBody(n.body);

};      

this.emitters['Literal'] = function(n) {
  this.emitContext = EMIT_CONTEXT_NONE;
  switch( n.value ) {
    case true: return this.write('true');
    case null: return this.write('null');
    case false: return this.write('false');
    default: 
       if ( typeof n.value === typeof 0 )
         return this.write(n.value + "");

       return this._emitString(n.value);
  }
};

this._emitString = function(str) {
   var ch = 0, emittedStr = "", e = 0, simpleStart = 0;
   var quote = CHAR_SINGLE_QUOTE, quoteStr = '\'';
   this.write(quoteStr);
   while ( e < str.length ) {    
      ch = str.charCodeAt(e);
      e++;
      if ( ch >= CHAR_EXCLAMATION && ch <= CHAR_COMPLEMENT )
        continue;

      else {
        var esc = "";
        switch (ch) {
          case CHAR_TAB: esc = 't'; break;
          case CHAR_CARRIAGE_RETURN: esc = 'r'; break;
          case CHAR_LINE_FEED: esc = 'n'; break;
          case CHAR_VTAB: esc = 'v'; break;
          case quote: esc = quoteStr; break
          case CHAR_FORM_FEED: esc = 'f'; break;
          case CHAR_BACK_SLASH: esc = '\\'; break;
          default:
             esc = ch <= 0xff ? 'x'+hex2(ch) : 'u'+hex(ch) ;
        }
        emittedStr += str.substring(simpleStart,e) + '\\' + esc;
        simpleStart = e;
     }
  }
  this.write(emittedStr);
  if ( simpleStart < e )
    this.write(str.substring(simpleStart,e));
  this.write(quoteStr);
};
             
this.emitters['ExpressionStatement'] = function(n) {
   this.emitContext = EMIT_CONTEXT_STATEMENT;
   this.emit(n.expression);
   this.code += ';';
};
     
this.emitters['DoWhileStatement'] = function(n) {
   this.write( 'do ' );
   this._emitBody(n.body);
   if ( n.body.type !== 'BlockStatement' ) {
     this.newlineIndent();
     this.write('while ('); 
   }
   else
     this.write(' while (');

   this.emit(n.test);
   this.write(');');
};
      
this.emitters['LabeledStatement'] = function(n) {
   this.emit(n.label);
   this.code += ':';
   this.newlineIndent();
   this.emit(n.body);

};

this.emitters['BreakStatement'] = function(n) {
   this.write('break');
   if ( n.label !== null ) {
     this.disallowWrap();
     this.write(' ');
     this.emit(n.label);
     this.allowWrap();
   }
   this.code += ';';
};

this.emitters['ContinueStatement'] = function(n) {
   this.write('continue');
   if ( n.label !== null ) {
     this.disallowWrap();
     this.write(' ');
     this.emit(n.label);
     this.allowWrap();
   }
   this.code += ';';
};  

this.emitters['EmptyStatement'] = function(n) {
   this.write(';');

};

this.emitters['LogicalExpression'] = 
this.emitters['BinaryExpression'] = function(n) {
   var currentPrec = binPrec[n.operator], hasParen = false;
   
   if ( this.prec > currentPrec ||
        (this.prec === currentPrec && !this.isLeft && !isRassoc(currentPrec)))
     hasParen = !false;
       
   if ( hasParen )  this.write('(');

   var prec = this.prec;
   var isLeft = this.isLeft;
   this.prec = currentPrec;
   this.isLeft = !false;
   this.emit(n.left);
   this.isLeft = false;
   this.write(n.operator);
   this.emit(n.right);
   this.isLeft = isLeft;
   this.prec = prec;
   

   if ( hasParen ) this.write(')');

};

