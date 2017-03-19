Parser.prototype.loc = function() { return { line: this.li, column: this.col }; };
Parser.prototype.locBegin = function() { return  { line: this.li0, column: this.col0 }; };
Parser.prototype.locOn = function(l) { return { line: this.li, column: this.col - l }; };


