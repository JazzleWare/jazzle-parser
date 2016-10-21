this.parse = function(src, isModule ) {
  var newp = new Parser(src, isModule);
  return newp.parseProgram();
};

; this.Parser = Parser;  
; this.Scope = Scope;
; this.Emitter = Emitter;
; this.Partitioner = Partitioner;
  this.Decl = Decl;
  this.RefMode = RefMode;

