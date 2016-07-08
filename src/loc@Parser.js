_class.loc = function() { return { line: this.li, column: this.col }; };
_class.locBegin = function() { return  { line: this.li0, column: this.col0 }; };
_class.locOn = function(l) { return { line: this.li, column: this.col - l }; };


