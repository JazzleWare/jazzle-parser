function ParserScope(ownerParser, parent, type) {
   Scope.call(
     this, parent, type
   );

   this.idNames = {};
   this.declMode = DECL_MODE_NONE;
   this.isInComplexArgs = false;
   this.parser = ownerParser;
   this.strict = this.parser.tight;
   
   this.synth = false;
}

