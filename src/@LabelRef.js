function LabelRef(baseName) {
   this.synthName = "";
   this.baseName = baseName;
}

LabelRef.real = function() {
   return new LabelRef("");
};

LabelRef.synth = function(baseName) {
   return new LabelRef(baseName);
};

