function ParserScope(ownerParser, parent, type) {
   Scope.call(
     this, parent, type
   );

   this.paramNames = null;
   this.declMode = DECL_MODE_NONE;
   this.isInComplexArgs = false;
   this.parser = ownerParser;
   this.strict = this.parser.tight;

   if (this.isFunc())
     this.paramNames = {};

   this.synth = false;
}

