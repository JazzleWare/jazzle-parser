function Emitter(indenter) {
   this.code = "";
   this.currentIndentLevel = 0;
   this.currentIndentStr = "";
   this.indenter = indenter || "   ";
   this.synthStack = [];
   this.synth = false;
   this.indentStrCache = [""];
   this.currentLineLengthIncludingIndentation = 0;
   this.maxLineLength = 0;
   this.emitContext = EMIT_CONTEXT_NONE;
   this.prec = PREC_WITH_NO_OP;
   this.isLeft = false;
   this.wrapStack = [];
   this.codeStack = [];
   this.wrap = !false;

}

Emitter.prototype.emitters = {};

