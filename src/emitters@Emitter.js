this._emitBlock = function(list) {
   var e = 0 ;
   while ( e < list.length ) {
      this.newlineIndent();
      this.emit(list[e]);
      e++;
   }
};
 
this._emitElse = function(blockOrExpr) {
  if ( blockOrExpr.type === 'ExpressionStatement' ) {
    this.indent();
    this.newlineIndent();
    this.emit(blockOrExpr);
    this.unindent();
  }
  else
    this.emit(blockOrExpr);
};
 
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

this._paren = function(n) {
  this.write('(');
  this._emitExpr(n, PREC_WITH_NO_OP);
  this.write(')');
};

this._emitCallArgs = function(list) {
  var e = 0;
  while ( e < list.length ) {
     if ( e ) this.write(', ');
     this._emitNonSeqExpr(list[e], PREC_WITH_NO_OP );
     e++; 
  }
};

this._writeArray = function(list, start) {   
   this.write('[');
   var e = start;
   while ( e < list.length ) {
      if ( list[e] !== null && list[e].type === 'SpreadElement' )
        break;

      if ( e !== start )
        this.write(', ');

      if ( list[e] === null )
        this.write('null');
 
      else
        this._emitNonSeqExpr(list[e], PREC_WITH_NO_OP );
 
      e++;
   }
   this.write(']');
};
     
this._emitExpr = function(n, prec) { // TODO: prec is not necessary
  var currentPrec = this.prec;
  this.prec = prec;
  this.emit(n);
  this.prec =  currentPrec ;

};

function isImplicitSeq(n) {
   if ( n.type === 'AssignmentExpression' ) {
     n = n.left;
     switch (n.type) {
        case 'ArrayPattern':
           return n.elements.length !== 0;
  
        case 'ObjectPattern':
           return n. properties.length !== 0;
     }
   }

   return false;
}

this._emitNonSeqExpr = function(n, prec) {
  var currentPrec = this.prec;
  this.prec = prec;
  if ( n.type === 'SequenceExpression' || isImplicitSeq(n) )
    this._paren(n);
  else
    this.emit(n);
  this.prec = currentPrec;
};

this.emitters['ArrayExpression'] = function(n) {
   this.emitContext = EMIT_CONTEXT_NONE;
   if ( !n.spread )
     return this._writeArray(n.elements, 0);

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
   this.indent();
   this._emitBlock(n.body);
   this.unindent();
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
          (ch <= CHAR_9 && ch >= CHAR_0) ||
          (ch === CHAR_$);
}
   
this.emitters['IfStatement'] = function(n) {
   this.write('if (');
   this.emit(n.test);
   this.write(')');
   this._emitBody(n.consequent);

   if (n.alternate) {   
     this.newlineIndent();    
     this.write('else ');
     this._emitElse (n.alternate);
   }
};
   
function isComplexExpr(n) {

  switch ( n.type ) {

    case 'UnaryExpression':
    case 'AssignmentExpression':
    case 'SequenceExpression': 
    case 'UpdateExpression':
    case 'ConditionalExpression':
    case 'BinaryExpression':
    case 'LogicalExpression':    
       return !false;

    default:
       return false;
  }
}

this._emitNonComplexExpr = function(n) {
    if ( isComplexExpr(n) )
      return this._paren(n);

    this.emit(n);
};

this.emitters['MemberExpression'] = function(n) {
  this._emitNonComplexExpr (n.object);

  if ( n.computed ) {
    this.write('[');
    this._emitExpr(n.property, PREC_WITH_NO_OP);
    this.write(']');
  }

  else {
    this.write('.');
    this.emit(n.property);

  }
};

this.emitters['NewExpression'] = function(n) {
   this.write('new ');
   this.emitContext = EMIT_CONTEXT_NEW;
   this._emitNonComplexExpr (n.callee);
   this.write('(');
   this._emitCallArgs(n.arguments);
   this.write(')');
};

this.emitters['Identifier'] = function(n) {
   this.emitContext = EMIT_CONTEXT_NONE;
   var name = n.name;
   var e = 0;
   if ( name.length && name.charCodeAt(0) === CHAR_MODULO )
     e++ ;
     
   var nameString = "";
   var simplePortionStart = e;
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
  this.write(')');
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
      if ( ch <= CHAR_EXCLAMATION || ch >= CHAR_COMPLEMENT ) {
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
        simpleStart = e + 1 ;
     }
     
     e++;
  }
  this.write(emittedStr);
  if ( simpleStart < e )
    this.write(str.substring(simpleStart,e));
  this.write(quoteStr);
};
             
var ASSIGN_STATEMENT = !false;
this.emitters['ExpressionStatement'] = function(n) {
   this.emitContext = EMIT_CONTEXT_STATEMENT;
   if (n.expression.type === 'AssignmentExpression' )
     return this._emitAssignment(n.expression, ASSIGN_STATEMENT);

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
     this.restoreWrap();
   }
   this.code += ';';
};

this.emitters['ContinueStatement'] = function(n) {
   this.write('continue');
   if ( n.label !== null ) {
     this.disallowWrap();
     this.write(' ');
     this.emit(n.label);
     this.restoreWrap();
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
       
   if ( hasParen ) {
      this.write('(');
      this.emitContext = EMIT_CONTEXT_NONE;
   }

   var prec = this.prec;
   var isLeft = this.isLeft;
   this.prec = currentPrec;
   this.isLeft = !false;
   this.emit(n.left);
   this.isLeft = false;
   this.disallowWrap();
   this.write(' ' + n.operator + ' ');
   this.restoreWrap();
   this.emit(n.right);
   this.isLeft = isLeft;
   this.prec = prec;
   

   if ( hasParen ) this.write(')');

};

this._emitAssignment = function(assig, isStatement) {
  return this.assigEmitters[assig.left.type].call(
           this, assig, isStatement );

};
   
this.emitters['AssignmentExpression'] = function(n) {
   return this._emitAssignment(n, !ASSIGN_STATEMENT);

};

this.emitters['Program'] = function(n) {
   this._emitBlock(n.body);

};

this.emitters['CallExpression'] = function(n) {
   var hasParen = false;
   if ( this.emitContext & EMIT_CONTEXT_NEW ) {
     this.emitContext = EMIT_CONTEXT_NONE;
     hasParen = !false; 
   }

   if (hasParen) this.write('(');

   this._emitNonComplexExpr (n.callee);
   this.write('('); 
   this._emitCallArgs(n.arguments);
   this.write(')');

   if (hasParen) this.write(')');
};
   
this.emitters['SwitchStatement'] = function(n) {
   this.write( 'switch (');
   this.emit(n.discriminant);
   this.write(') {');
   var list = n.cases, e = 0;
   while ( e < list.length ) {
     var elem = list[e];
     this.newlineIndent();
     if ( elem.test ) {
       this.write('case ');
       this.emit(elem.test);
       this.write(':');
     }
     else
       this.write('default:');

     this.indent();
     this._emitBlock(elem.consequent); 
     this.unindent();
     e++ ;

   }

   this.newlineIndent();
   this.write('}');
};

this.emitters['ThrowStatement'] = function(n) {

   this.write('throw ');
   this.disallowWrap();
   this.emit(n.argument);
   this.restoreWrap();
   this.code += ';';

};

this.emitters['ReturnStatement'] = function(n) {
   this.write('return');

   if ( this.argument !== null ) {
      this.disallowWrap();
      this.write(' ');
      this.emit(n.argument);
      this.restoreWrap();
   }

   this.code += ';';
};

this.emitters['SequenceExpression'] = function(n) {
  var hasParen = false, list = n.expressions, e = 0;

  if ( this.prec !== PREC_WITH_NO_OP )   
    hasParen = !false;

  if (hasParen) this.write('(');

  while ( e < list.length ) {
     if (e) this.write(', ');
     this._emitNonSeqExpr(list[e], PREC_WITH_NO_OP);
     e++ ;
  }

  if (hasParen) this.write(')');
};
       
this.emitters['UpdateExpression'] = function(n) {
    if ( n.prefix ) { 
      if ( this.code.charAt(this.code.length-1) === 
           n.operator.charAt(0) )
        this.write(' ');

      this.write(n.operator);
    }

    if ( isComplexExpr(n.argument) )
      this._paren(n.argument);
    else
      this.emit(n.argument);

    if (!n.prefix) {
      this.disallowWrap();
      this.write(n.operator);
      this.restoreWrap();
    }
};

this.emitters['UnaryExpression'] = function(n) {
    var hasParen = this.prec > PREC_U;

    if (hasParen) this.write('(');
    if ( this.code.charAt(this.code.length-1) === n.operator)
      this.write(' ');

    this.write(n.operator);
    var prevPrec = this.prec;
    this.prec = PREC_U;
    this.emit(n.argument);
    this.prec = prevPrec;

    if (hasParen) this.write(')');
};
 
this.emitters['WithStatement'] = function(n) {
  this.write('with (');
  this._emitExpr(n.object);
  this.write(') ');
  this._emitBody(n.body);

};

this.emitters['ConditionalExpression'] = function(n) {
   var hasParen = (this.prec !== PREC_WITH_NO_OP)

   if (hasParen) this.write('(');

   var prevPrec = this.prec;
   this.prec = PREC_COND;
   this._emitNonSeqExpr(n.test);
   this.write('?');
   this._emitNonSeqExpr(n.consequent, PREC_WITH_NO_OP);
   this.write(':');
   this._emitNonSeqExpr(n.alternate, PREC_WITH_NO_OP);
   this.prec = prevPrec;

   if (hasParen) this.write(')');
};
  
this.emitters['ThisExpression'] = function(n) {
    if ( this.scopeFlags & EMITTER_SCOPE_FLAG_ARROW )
      return this._emitArrowSpecial('this');

    this.write('this');
};

this._emitSimpAssig = function(assig, isStatement) {
  var hasParen = this.prec !== PREC_WITH_NO_OP;
  
  if (hasParen) this.write('(');
  this.emit(assig.left);
  this.write(assig.operator);

  this._emitNonSeqExpr(assig.right, PREC_WITH_NO_OP);

  if (hasParen) this.write(')');
  if (isStatement) this.code += ';';
};

function isSimpAssigHead(head) {
  switch (head.type) {
    case 'Identifier':
    case 'MemberExpression':
       return !false;
   
    default:
       return head.type === 'SynthesizedExpr' ;
  }
}

function containerLen(container) {

   switch (container.type) { 
     case 'ArrayPattern':
        return container.elements.length;
   
     case 'ObjectPattern':
        return container.properties.length;
  
     default:
        return -1;

   }
}
         
this._emitAssignment = function(assig, isStatement) {
    if (isSimpAssigHead(assig.left))
      return this._emitSimpAssig(assig, isStatement);

    var hasParen = false;
    var len = containerLen(assig.left);
    
    if (len > 0) {
      hasParen = !isStatement && this.prec !== PREC_WITH_NO_OP;
      if (hasParen) this.write('(');
      var temp = this.scope.allocateTemp();

      this.write(temp);
      this.write('=');
    }
    this._emitNonSeqExpr(assig.right, PREC_WITH_NO_OP);
    if (isStatement)
      this.write(';');

    if (len > 0) {
      if (!isStatement)
        this.write(',');
      this.assigEmitters[assig.left.type].call(
         this, assig.left, temp, isStatement);

      if (!isStatement)
        this.write(temp);

      this.scope.releaseTemp(temp);
    }

    if (hasParen) this.write(')');
};

this.assigEmitters = {};

this.assigEmitters['ArrayPattern'] = function(head, name, isStatement) {
   var list = head.elements;
   if (list.length===0)
     return;

   var e = 0;
   while (e < list.length) {
      this._emitArrayAssigElem(list[e], e, name, isStatement);
      e++ ;
   }
};

this._emitArrayAssigElem = function(elem, idx, name, isStatement) {
   var left = elem, right = null;
   if (elem.type === 'AssignmentPattern') {
     left = elem.left;
     right = elem.right;
   }

   var simp = isSimpAssigHead(left);
   var temp = "";   

   if ( isStatement)
     this.newlineIndent();

   if (simp)
     this.emit(left);
   else {
     temp = this.scope.allocateTemp();
     this.write(temp);
   }
   this.write('=');
   this.writeMulti(name, '.length>', idx+"", ' ? ', name, '[', idx+"", '] : ');
   this._emitNonSeqExprOrVoid0(right);

   this.ea(isStatement);

   if (simp)
     return;

   this.assigEmitters[left.type].call(this, left, temp, isStatement);

   this.scope.releaseTemp(temp);
};

this._emitNonSeqExprOrVoid0 = function(n, prec) {
   if (n === null)
     return this.write('void 0');

   return this._emitNonSeqExpr(n, prec);
};

this.ea = function(isStatement) {
  if (!isStatement)
    return this.write(',');

  this.write(';');
};
  
this.assigEmitters['ObjectPattern'] = function(head, name, isStatement) {
  var list = head.properties;
  if (list.length === 0)
    return;

  var e = 0;
  while (e < list.length) {
    this._emitObjAssigElem(list[e], name, isStatement);
    e++ ;
  }
};

this.emitters['YieldExpression'] = function(n) {
  this.write('yield');
  if (n.argument !== null) {
    this.disallowWrap();
    this.write(' '); 
    this.emit(n.argument);
    this.restoreWrap()
  }
}; 
      
this._emitObjAssigElem = function(prop, name, isStatement) {
   var v = prop.value, k = prop.key;             
   var left = v, right = null;

   if (v.type === 'AssignmentPattern') {
     left = v.left;
     right = v.right;
   }

   if (isStatement)
     this.newlineIndent();

   var propTemp = "";

   if (prop.computed) {
     propTemp = this.scope.allocateTemp();
     this.write(propTemp);
     this.write('=');
     this._emitNonSeqExpr(k, PREC_WITH_NO_OP);
     this.ea(isStatement);
   }

   var simp = isSimpAssigHead(left);
   var temp = "";

   if (simp)
     this.emit(left);
   else {
     temp = this.scope.allocateTemp();
     this.write(temp);
   }

   this.write('=');
   if (prop.computed) {
     this.write(propTemp);
     this.write('+""');
   }
   else switch(k.type) {
      case 'Identifier':
         this._emitString(k.name);
         break;
      case 'Literal':
         this._emitString(k.value+"");
   }

   this.writeMulti(' in ', name);

   this.write('?');
   this.write(name);
   this.write('[');
   
   if (prop.computed) {
     this.write(propTemp);
     this.write('+""');
   }
   else switch(k.type) {
      case 'Identifier':
         this._emitString(k.name);
         break;
      case 'Literal':
         this._emitString(k.value+"");
   }

   this.write('] :' );

   this._emitNonSeqExprOrVoid0(right, PREC_WITH_NO_OP );
   this.ea(isStatement);

   if (simp)
     return;

   this.assigEmitters[left.type].call(this, left, temp, isStatement);

   if (prop.computed)
     this.scope.releaseTemp(propTemp);

   this.scope.releaseTemp(temp);
};
   
this.emitters['NoExpression'] = function(n) { return; };
this.emitters['SynthesizedExpr'] = function(n) {
  this.write(n.contents);
};

this.emitters['StartBlock'] = function(n) {};
this.emitters['FinishBlock'] = function(n) {};
