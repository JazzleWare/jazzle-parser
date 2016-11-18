this._emitBlock = function(list) {
   var e = 0 ;
   while ( e < list.length ) this.n().e(list[e++]);
};
 
this._emitElse = function(blockOrExpr) {
  if ( blockOrExpr.type === 'ExpressionStatement' ) 
    this.i().n().e(blockOrExpr).u();
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
  else {
    this.space();
    this.emit(blockOrExpr);
  }
};

this._paren = function(n) {
  this.w('(').e(n, PREC_WITH_NO_OP, EMIT_VAL).w(')');
};

this._emitCallArgs = function(list) {
  var e = 0;
  while ( e < list.length ) {
     if ( e ) this.write(', ');
     this._emitNonSeqExpr(list[e], PREC_WITH_NO_OP );
     e++; 
  }
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

this._emitNonSeqExpr = function(n, prec, flags) {
  if ( n.type === 'SequenceExpression' || isImplicitSeq(n) )
    this._paren(n);
  else
    this.emit(n, prec, flags);
};

this.emitters['ArrayExpression'] = function(n) {
   ASSERT.call(this, false, n.type);
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
   this.w('if (').e(n.test).w(')');
   this._emitBody(n.consequent);

   if (n.alternate) {   
     this.n().w('else ');
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

this._emitNonComplexExpr = function(n, prec, flags) {
    if ( isComplexExpr(n) )
      return this._paren(n);

    this.emit(n, prec, flags);
};

this.emitters['MemberExpression'] = function(n) {
  this._emitNonComplexExpr (n.object);

  if ( n.computed )
    this.w('[').e(n.property, PREC_WITH_NO_OP, EMIT_VAL).w(']');

  else
    this.w('.').e(n.property);
};

this.emitters['NewExpression'] = function(n) {
   this.write('new ');
   this._emitNonComplexExpr (n.callee, PREC_WITH_NO_OP, EMIT_NEW_HEAD);
   this.write('(');
   this._emitCallArgs(n.arguments);
   this.write(')');
};

this.emitNameString = function(name) {
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

this.emitters['Identifier'] = function(n) { return this.emitNameString(n.name); };

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
             
this.emitters['ExpressionStatement'] = function(n) {
   if (n.expression.type === 'AssignmentExpression' )
     this.emit(
        this._transformAssignment(n.expression, NOT_VAL), PREC_WITH_NO_OP, EMIT_STMT_HEAD
     );
   else {
     this.emit(n.expression, PREC_WITH_NO_OP, EMIT_STMT_HEAD);
     this.write(';');
   }
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

this.emitBreakWithLabelName = function(labelName) {
  this.w('break'+(this.currentContainer?"":' [--simple--]'));
  var targetName = labelName;
  
  if (targetName === "") {
    var cc = this.currentContainer;
    if (cc && cc.abt !== cc.ebt)
      targetName = cc.ebt.synthLabel.name;
  }

  if (targetName !== "")
    this.setwrap(false).s().emitNameString(targetName);

  this.w(';');
};
  
this.resolveContainerLabel = function(labelName) {
  labelName += '%';
  if (HAS.call(this.labelNames, labelName))
    return this.labelNames[labelName];

  return null;
};

this.emitters['BreakStatement'] = function(n) {
  var label = n.label, i = -1;
  if (!this.currentContainer)
    return this.emitBreakWithLabelName(label ? label.name : "");

  var target = null, entry = label ? this.resolveContainerLabel(label.name) : null;
  this.write('break');
  if (entry) {
    target = entry.target;
    i = entry.i;
    this.write(' [target=' + target.type + ' i='+i+'] ' + label.name + '(real label)');
  }
  else if (!label) {
    target = this.currentContainer.ebt;
    this.write( ' [target=' + (target?target.type:'<null>'));
    if (this.currentContainer.abt !== target) {
      i = this.resolveContainerLabel(this.currentContainer.ebt.getLabelName()).i;
      this.write(' i=' + i + '] ' + this.currentContainer.ebt.getLabelName() + '(synth label)');
    }
    else this.write(' i=<not-needed>]');
  }
  else 
    this.write(' [target=<not-yield-container> i=<not-needed>] ' + label.name);

  this.write(';');

//if (!this.currentContainer)
//  return this.emitBreakWithName(label ? label.name : "");

//var targetObj = label ? 
//  this.resolveContainerLabel(label.name) : 
//  this.currentContainer.ebt.synthLabel;

//// we are not breaking out of a yield container
//if (!target)
//  return this.emitBreakWithName(label ? label.name : "" );

//var curParentFinally = this.currentContainer.parentFinally();
//var targetParentFinally = target.parentFinally();

//// we are actually breaking out of a yield container,
//// but we are not going to get trapped by a finally while breaking;
//// the following means: the finally around the current break is the finally
//// around our target, which means there is no finally between the break and its target
//if (curParentFinally === targetParentFinally)
//  return this.emitBreakWithName(label ? label.name : "" );

//var nextParentFinally = curParentFinally.parentFinally();
//while ( nextParentFinally !== targetParentFinally) {
    
};

this.emitters['ContinueStatement'] = function(n) {
   this.write('continue');
   if ( n.label !== null ) {
     this.wrap = false;
     this.space();
     this.emit(n.label);
   }
   else if (!this.inExptectedContinueTarget()) {
     this.write(' ['+this.currentContainer.ect.synthLabel.synthName+']');
   }
   this.write(';');
};  

this.emitters['EmptyStatement'] = function(n) {
   this.write(';');

};

this.emitters['LogicalExpression'] = 
this.emitters['BinaryExpression'] = function(n, prec, flags) {
   var currentPrec = binPrec[n.operator], hasParen = false;
   
   hasParen = prec > currentPrec ||
               (prec === currentPrec && 
                !(flags & EMIT_LEFT)  && !isRassoc(currentPrec));
       
   if ( hasParen ) {
      this.write('(');
   }

   this._emitNonSeqExpr(n.left, currentPrec, flags|EMIT_LEFT|EMIT_VAL);
   this.write(' ' + n.operator + ' ');
   this._emitNonSeqExpr(n.right, currentPrec, EMIT_VAL);

   if ( hasParen ) this.write(')');

};

this._transformAssignment = function(assig, vMode) {
   var b = [];
   assig = this.transformYield(assig, b, vMode);
   if (vMode || assig.type === 'AssignmentExpression') b. push(assig);

   if (vMode && b.length === 1)
     return b[0];

   return { type: vMode ? 'SequenceExpression' : 'SequenceStatement', expressions: b }
};
   
this.emitters['SequenceStatement'] = function(n) {
  var list = n.expressions, e = 0;
  while (e < list.length) {
     if (e > 0) this.newlineIndent();
     this.emit(list[e++], PREC_WITH_NO_OP, EMIT_VAL);
     this.write(';');
  }
};

this.emitters['AssignmentExpression'] = function(n, prec, flags) {
   var hasParen = prec !== PREC_WITH_NO_OP;
   if (hasParen) this.write('(');
   switch (n.left.type) {
      case 'Identifier': 
      case 'MemberExpression':
      case 'SynthesizedExpr':
         if (y(n) === 0) {
           this.emit(n.left);
           this.write(' ' + n.operator + ' ');
           this._emitNonSeqExpr(n.right, PREC_WITH_NO_OP, flags & EMIT_VAL);
           break ;
         }
      default:
         this.emit( this._transformAssignment(n, flags & EMIT_VAL), PREC_WITH_NO_OP, flags & EMIT_VAL);
   }
   if (hasParen) this.write(')');
};

this.emitters['Program'] = function(n) {
   this._emitBlock(n.body);

};

this.emitters['CallExpression'] = function(n, prec, flags) {
   var hasParen = flags & EMIT_NEW_HEAD;
   if (hasParen) this.write('(');
   this._emitNonComplexExpr (n.callee, PREC_WITH_NO_OP, 0);
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

this.emitters['SequenceExpression'] = function(n, prec, flags) {
  var hasParen = false, list = n.expressions, e = 0;

  if (hasParen) this.write('(');

  while ( e < list.length ) {
     if (e) this.write(', ');
     this._emitNonSeqExpr(list[e], PREC_WITH_NO_OP, e ? 0 : flags);
     e++ ;
  }

  if (hasParen) this.write(')');
};
       
this.emitters['UpdateExpression'] = function(n) {
    if ( n.prefix ) { 
      if ( this.code.charAt(this.code.length-1) === 
           n.operator.charAt(0) )
        this.space();

      this.write(n.operator);
    }

    this._emitNonComplexExpr(n.argument);

    if (!n.prefix) {
      this.wrap = false;
      this.write(n.operator);
    }
};

this.emitters['UnaryExpression'] = function(n, prec, flags) {
    var hasParen = prec > PREC_U;
    if (hasParen) this.write('(');
    if ( this.code.charAt(this.code.length-1) === n.operator)
      this.space();

    this.write(n.operator);
    this.emit(n.argument, PREC_U, EMIT_VAL);
    if (hasParen) this.write(')');
};
 
this.emitters['WithStatement'] = function(n) {
  this.write('with (');
  this.emit(n.object, PREC_WITH_NO_OP, 0);
  this.write(') ');
  this._emitBody(n.body);

};

this.emitters['ConditionalExpression'] = function(n, prec, flags) {
   var hasParen = (prec !== PREC_WITH_NO_OP);
   if (hasParen) this.write('(');
   this._emitNonSeqExpr(n.test);
   this.write('?');
   this._emitNonSeqExpr(n.consequent, PREC_WITH_NO_OP);
   this.write(':');
   this._emitNonSeqExpr(n.alternate, PREC_WITH_NO_OP);

   if (hasParen) this.write(')');
};
  
this.emitters['ThisExpression'] = function(n) {
    if ( this.scopeFlags & EMITTER_SCOPE_FLAG_ARROW )
      return this._emitArrowSpecial('this');

    this.write('this');
};

this._emitAssignment = function(assig, isStatement) {
    ASSERT.call(this, false, "_emitAssignment"); 
};

this.emitters['YieldExpression'] = function(n) {
  this.wm('y','=','1',';');
  if (n.argument !== null) {
    this.n().wm('yv','=');
    this._emitNonSeqExpr(n.argument);
    this.write(';');
  }
  var next = this.currentContainer.next();
  this.n().wm('nex','=',next?next.min:-12,';');
  this.n().wm('return','','_y','(');
  if (n.argument !== null) this.w('yv');
  this.wm(')',';');
}; 
      
this.emitters['NoExpression'] = function(n) { return; };

this.emitters['SynthesizedExpr'] = function(n) {
  this.write(n.contents);
};

this._emitGenerator = function(n) {
  var labels = this.labels;
  this.labels = {};
  this.write('function*');
  if (n.id !== null) this.write(' ' + n.id.name);
  this.write('(<args>) {');
  this.indent();
  this.newlineIndent();
  this.emit( new Partitioner(null, this).push(n.body) );
  this.unindent();
  this.newlineIndent();
  this.write('}');
  this.labels = labels;
};

this.addLabel = function(name) {
   this.labelNames[name+'%'] = this.unresolvedLabel ||
       ( this.unresolvedLabel = { target:null, i: ++this.labelID } );
};

this.removeLabel = function(name) {
   this.labelNames[name+'%'] = null;
};

this.emitters['FunctionDeclaration'] = function(n) {
  if (n.generator)
    return this._emitGenerator(n);
  
  else 
     ASSERT.call(this, false);
};

this.emitBreak = function(n) {
  this.write('break');
  if (n.label !== null)
    this.write(' '+n.label.name);
  else if (!this.inExptectedBreakTarget())
    this.write(' ['+this.currentContainer.ebt.synthLabel.synthName+']');
  this.write(';');
};

this.emitReturn = function(n) {
  this.write('return');
  if (n.argument) {
    this.write(' ');
    this.emit(n.argument);
  }
  this.write(';');
};

this.emitContinue = function(n) {
  this.write('continue');
  if (n.label !== null)
    this.write(' '+n.label.name);
  else if (!this.inExptectedContinueTarget())
    this.write(' ['+this.currentContainer.ect.synthLabel.synthName+']');
  this.write(';');
};

this.emitYield = function(n) {
   this.write('yield');
   if (n.argument) {
     this.write(' ');
     this.emit(n.argument);
   }
   this.write(';');
};

this.inExptectedBreakTarget = function() {
   return this.currentContainer === null ||
          this.currentContainer.abt === this.currentContainer.ebt;
};

this.inExptectedContinueTarget = function() {
   return this.currentContainer === null ||
          this.currentContainer.act === this.currentContainer.ect;
};

this.fixupContainerLabels = function(target) {
  if (this.unresolvedLabel) {
    this.unresolvedLabel.target = target;
    this.unresolvedLabel = null
  }
};

this.emitContainerStatement = function(n) {

  switch (n.type) {
     case 'ReturnStatement': return this.emitReturn(n);
     case 'YieldExpression': return this.emitYield(n);
     default: return this.emit(n);
  }
};

this.addSynthLabel = function(n) {
  if (n.synthLabel)
    return this.addLabel(n.synthLabel.synthName);
};

this.removeSynthLabel = function(n) {
  if (n.synthLabel)
    return this.removeLabel(n.synthLabel.synthName);
};

this.writeLabels = function(n) {
  var label = n.label;
  if (label === null)
    return false;
  
  label = label.head;

  while (label !== null) {
    this.write(label.name+': ');
    label = label.next;
  }

  return true;
};

function describeContainer(container) {
   var next = container.next();
   var str = "";
   if (container.isSimple()) {
     str = 'seg';
     if (container === container.owner.test)
       str += ':test';

     ASSERT.call(this, container.min === container.max);
     str += ' ['+container.min+']'+' next='+(next?next.min:'[none]');
     return str;
   }
   return 'container:' + container.type +
          ' [' + container.min + ' to ' + (container.max-1) + ']' +
          ' label=' + ( container.synthLabel ? container.synthLabel.synthName : '[none]' )+
          ' next='+(next?next.min:'[none]');
}

function listLabels(container) {
  var str = "";
  var label = container.label;
  while (label) {
    if (str.length !== 0 ) str += ',';
    str += label.name;
    label = label.next;
  }
  return "<labels>"+str+"</labels>";
}

this.emitters['MainContainer'] = function(n) {
  var cc = this.currentContainer;
  this.currentContainer = n;
  var containerStr = describeContainer(n);
  if (n.hasFinally) containerStr += ' hasFinally';
  this.write( '<'+containerStr+'>' );
  this.indent();
  var list = n.partitions, e = 0;
  while (e < list.length) {
    this.newlineIndent();
    this.emit(list[e]);
    e++ ;
  }
  this.unindent();
  this.newlineIndent(); 
  this.write('</'+containerStr+'>');
  this.currentContainer = cc;
};
 
this.emitters['IfContainer'] = function(n) {
  this.fixupContainerLabels(n);
  var cc = this.currentContainer;
  this.currentContainer = n;

  if (this.writeLabels(n))
    this.newlineIndent();

  this.if_state_leq(n.max-1);
  this.write(' // main if');
  var list = n.partitions, e = 0;
  while (true) {
    var current = list[e++];
    if (current === n.test) 
      break;
    this.newlineIndent();
    this.emit(current);
  }
  this.newlineIndent();
  this.if_state_eq(n.test.min);
    this.newlineIndent();
    this.write('if (');
    this.emit(n.test.partitions[0]);
    this.write(') /* test */');
    var next = n.consequent;
    this.set_state(next.min);
    this.newlineIndent();
    this.write('else ');
    next = n.alternate || n.next(); 
    this.set_state(next?next.min:-12);
  this.end_block();
    
  this.newlineIndent();
  if (n.consequent.hasMany()) this.if_state_leq(n.consequent.max-1);
     this.write(' // consequent');
     this.newlineIndent();
     this.emit(n.consequent);
  if (n.consequent.hasMany()) this.end_block();
  
  if ( n.alternate ) {
    this.newlineIndent();
    this.write('else ');
    if (n.alternate.hasMany()) {
      this.write('{');
      this.indent();
      this.newlineIndent();
    }
    this.emit(n.alternate);
    if (n.alternate.hasMany()) {
      this.unindent(); 
      this.newlineIndent();
      this.write('}');
    }
  }
  this.end_block();
};

this.emitters['WhileContainer'] = function(n) {
  this.addSynthLabel(n);
  this.fixupContainerLabels(n);
  var cc = this.currentContainer;
  this.currentContainer = n;

  this.if_state_leq(n.max-1); this.newlineIndent();
  this.while_nocond();

  var current = null;
  var list = n.partitions, e = 0;
  while (e < list.length) {
    current = list[e++];
    if (current === n.test)
       break;
    this.newlineIndent();
    this.emit(current);
  }
  this.newlineIndent();
  this.if_state_eq(n.test.min);
    this.newlineIndent();
    this.write('if');
    this.write('(');
    this.emit(n.test.partitions[0]);
    this.write(')'); this.space();
    this.set_state(n.test.next().min);
    this.newlineIndent();
    this.w('else').s().w('{').s();
      var next = n.next();
      this.set_state(next?next.min:-12);
      this.space();
      this.write('break;');
      this.space();
    this.write('}');
  this.end_block();

  while (e < list.length-1) {
    this.newlineIndent();
    this.emit(list[e++]);
  }

  this.removeSynthLabel(n);
  this.newlineIndent();
  this.if_state_eq(list[e].min);
  this.newlineIndent();
  this.set_state(n.min);
  this.end_block();
 
  this.end_block(); this.end_block(); this.currentContainer = cc;
};

// TODO: pack non-test, non-synth SimpleContainers together in a switch (if fit)
this.emitters['SimpleContainer'] = function(n) {
  // TODO: won't work exactly, even though it works correctly, with things like
  // `a: (yield) * (yield)` ; it has no side-effects, but should be nevertheless corrected 
  this.fixupContainerLabels(n);  
  
  var cc = this.currentContainer;
  this.currentContainer = n;

  this.if_state_eq(n.min);

  var next = n.next();
  var list = n.partitions;
  var e = 0;
  
  while (e < list.length-1)
    this.n().emit(list[e++]); 

  var last = list[e];
  this.n().emit(last);
  if (last.type !== 'YieldExpression')
    this.n().wm('state','=', next?next.min:-12,';');

  this.end_block();
  this.currentContainer = cc;
}; 
 
this.emitters['LabeledContainer'] = function(n) {
  var name = n.label.name;
  this.addLabel(name);
//this.write(n.label.name + ':');
//this.write('// head=' + n.label.head.name);
//this.newlineIndent();
  var statement = n.partitions[0];

//if (statement.type === 'LabeledContainer') {
//  statement.label.head = n.label.head;
//  n.label.next = statement.label;
//}
//else
//  statement.label = n.label.head;

  this.emit(statement);
  this.removeLabel(name);
};

this.emitters['BlockContainer'] = function(n) {
  this.fixupContainerLabels(n);
  var list = n.partitions, e = 0;
  this.write('{ // start');
  this.indent();
  this.newlineIndent();
  this.write(listLabels(n));
  while (e < list.length) {
     this.newlineIndent();
     this.emit(list[e++]);
  }
  this.unindent();
  this.newlineIndent();
  this.write('} // finish');
};

this.emitters['TryContainer'] = function(n) {
  this.fixupContainerLabels(n);
  var cc = this.currentContainer;
  this.currentContainer = n;

  this.if_state_leq(n.max-1); this.newlineIndent();
  this.while_nocond(); this.newlineIndent();
  this.w('try').s().w('{');
  this.indent(); this.newlineIndent(); 
  if (n.block.hasMany()) { this.if_state_leq(n.block.max-1); this.newlineIndent(); }
        this.emit(n.block);
  if (n.block.hasMany()) this.end_block();
     if (n.handler) {
       this.newlineIndent();
       this.w('else').s();
       if (n.handler.hasMany()) { this.if_state_leq(n.handler.max-1); this.newlineIndent(); }
         this.emit(n.handler);
       if (n.handler.hasMany()) this.end_block();
     }
  this.unindent(); this.newlineIndent();
  this.write('}');

  this.newlineIndent();

  var c = n.handler;
  var catchVar = 'err';
  this.w('catch').s().w('(').w(catchVar).w(')').s().w('{');
  this.indent();
  if (c) {
    this.n().if_state_leq(n.block.max-1);
    this.n().w(c.catchVar).s().w('=').s().w(catchVar).w(';');
    this.n().set_state(c.min);
    this.n().wm('y','=','1',';');
    this.n().w('continue').w(';');
    this.end_block();
    this.u().n();
  }
  else this.unindent();
  this.w('}');

  if (n.finalizer) {
    this.n().w('finally').sw('{').i();
      this.n().wm('if',' ','(','y','==','0',')','{').i();
        var fin = n.finalizer;
        this.n().wm('if',' ','(',
                    'state','<',fin.min+"",'||',
                    'state','>',fin.max-1,')',' ');
        this.set_state(fin.min);

        var list = fin.partitions, e = 0;
        while (e < list.length - 1)
          this.n().e(list[e++]);

        var rt = list[e];
        this.n().if_state_eq(rt.min);
          this.n().wm('if',' ','(','rt','==','1',')',' ','{');
          this.set_state('done');
          this.wm('return','','rv',';', '}');

          this.n().wm('if',' ','(','rt','==','-1',')',' ','{');
          this.set_state('done');
          this.wm('throw','','rv',';','}');

          var next = fin.next(); this.n().set_state(next?next.min:-12);
        this.end_block();
      this.u().n().w('}');
     this.u().n().w('}');             
  }
  this.end_block();
  this.end_block();
};
  
this.emitters['SwitchContainer'] = function(n) {
  this.fixupContainerLabels(n);
  var containerStr = describeContainer(n);
  this.write('<'+containerStr+'>');
  var cc = this.currentContainer;
  this.currentContainer = n;
  this.indent();
  this.newlineIndent();
  this.write(listLabels(n));
  var list = n.partitions, e = 0;
  while (e < list.length) {
    this.newlineIndent(); 
    this.emit(list[e++]);
  }
  this.unindent();
  this.currentContainer = cc;
  this.newlineIndent();
  this.write('</'+containerStr+'>');
};

this.emitters['CustomContainer'] = function(n) {
  var list = n.partitions, e = 0;
  while (e < list.length) {
    if (e>0) this.newlineIndent();
    this.emit(list[e++]);
  }
};

