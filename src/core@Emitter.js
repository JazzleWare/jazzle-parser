this.write = function(lexeme) {
   if ( this.wrap ) {
       var lineLengthIncludingIndentation = 
          this.currentLineLengthIncludingIndentation +
          lexeme.length;
       
       if ( this.maxLineLength &&
            lineLengthIncludingIndentation > this.maxLineLength )
         this.indentForWrap();

       this.currentLineLengthIncludingIndentation += lexeme.length; 
   } 
   else this.wrap = true;

   this.code += lexeme;
   return this;
};

this.space = function() { this.code += ' '; return this; };

this.enterSynth = function() {
   this.synthStack.push(this.synth);
   this.synth = !false;
};

this.exitSynth = function() {
   ASSERT.call(this, this.synthStack.length>=1);
   this.synth = this.pop(); 
};

this.indent = function() {
   this.currentIndentLevel++;
   if ( this.currentIndentLevel >= this.indentStrCache.length )
     this.indentStrCache.push(this.currentIndentStr + this.indenter);

   this.currentIndentStr = this.indentStrCache[this.currentIndentLevel];
   this.currentLineLengthIncludingIndentation = this.currentIndentStr.length;
};

this.unindent = function() {
   ASSERT.call(this, this.currentIndentLevel > 0);
   this.currentIndentStr = this.indentStrCache[--this.currentIndentLevel];
   this.currentLineLengthIncludingIndentation = this.currentIndentStr.length;
};

this.newlineNoIndent = function() {
  this.code += '\n';
  this.currentLineLengthIcludingIndentation = 0;
};

this.newlineIndent = function() {
  this.code += '\n' + this.currentIndentStr;

  this.currentLineLengthIncludingIndentation = this.currentIndentStr.length;
};

this.indentForWrap = function() {
   if ( this.currentLineLengthIncludingIndentation === 
        this.currentIndentStr.length )
     return;

   var wrapIndenter = this.currentIndentStr + " ";
   this.currentLineLengthIncludingIndentation = wrapIndenter.length ;
   this.code += '\n' + wrapIndenter ;

};

function isLoop(n) {
   var t = n.type;

   switch (t) {
      case 'ForOfStatement':
      case 'ForInStatement':
      case 'ForStatement':
      case 'DoWhileStatement':
      case 'WhileStatement':
         return true;

      default:
         return false;
   }
}
     
this.emit = function(n, prec, flags) {
  if ( !n )
    return;

  var abt = null, act = null, loop = isLoop(n);
  if (this.currentContainer) {
    if (loop) {
      abt = this.currentContainer.abt;
      this.currentContainer.abt = this.currentContainer.ebt;
      act = this.currentContainer.act;
      this.currentContainer.act = this.currentContainer.ect;
    }
    else if (n.type === 'SwitchStatement') {
      abt = this.currentContainer.abt;
      this.currentContainer.abt = this.currentContainer.ebt;
    }
  }
  if (arguments.length < 2) prec = PREC_WITH_NO_OP;
  if (arguments.length < 3) flags = 0;

  ASSERT.call(this, HAS.call(this.emitters, n.type),
      'No emitter for ' + n.type );
  var emitter = this.emitters[n.type];
  var r = emitter.call(this, n, prec, flags);
  
  if (this.currentContainer) {
    if (loop) {
      this.currentContainer.abt = abt;
      this.currentContainer.act = act;
    }
    else if (n.type === 'SwitchStatement')
      this.currentContainer.abt = abt;
  }
};

this.startCode = function() {
  this.codeStack.push(this.code);
  this.code = "";
};

this.endCode = function() {
  var c = this.code;
  this.code = this.codeStack.pop();
  return c;
};

this.i = function() { this.indent(); return this; };
this.s = function() { this.space(); return this; };
this.n = function() { this.newlineIndent(); return this; };
this.w = function(lexeme) { this.write(lexeme); return this; };
this.sw = function(lexeme) { this.space(); return this.w(lexeme); };
this.u = function() { this.unindent(); return this; };
this.wm = function() {
   var l = arguments.length, e = 0, n = "";
   while (e < l) {
      n = arguments[e++];
      if (n === ' ') this.space();
      else if (n === '') { this.wrap = false; this.space(); }
      else this.write(n);
   }
  
   return this;
};
this.e = function(n, prec, flags) { this.emit(n, prec, flags); return this; };
this.setwrap = function(wrap) {
  this.wrap = wrap;
  return this;
};

