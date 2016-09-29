this.write = function(line) {
   if ( this.wrap ) {
       var lineLengthIncludingIndentation = 
          this.currentLineLengthIncludingIndentation +
          line.length;
       
       if ( this.maxLineLength &&
            lineLengthIncludingIndentation > this.maxLineLength )
         this.indentForWrap();

       this.currentLineLengthIncludingIndentation += line.length; 
   } 

   this.code += line;

};

this.enterSynth = function() {
   this.synthStack.push(this.synth);
   this.synth = !false;
};

this.exitSynth = function() {
   this.assert(this.synthStack.length>=1);
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
   this.assert(this.currentIndentLevel > 0);
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

this.assert = function(cond, message) {
  if (!cond) throw new Error(message);

};

var has = Object.hasOwnProperty;

this.emit = function(n, prec, flags) {
  if ( !n )
    return;

  if (arguments.length < 2) prec = PREC_WITH_NO_OP;
  if (arguments.length < 3) flags = 0;

  this.assert(has.call(this.emitters, n.type),
      'No emitter for ' + n.type );
  var emitter = this.emitters[n.type];
  return emitter.call(this, n, prec, flags);
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

this.disallowWrap = function() {
   this.wrapStack.push(this.wrap);
   this.wrap = false;
};

this.restoreWrap = function() {
   this.wrap = this.wrapStack.pop();

};

this.writeMulti = function() {
  var e = 0;
  while (e < arguments.length) 
    this.write(arguments[e++]);
};

