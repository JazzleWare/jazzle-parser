module.exports.loc = function() { return { line: this.li, column: this.col }; };
module.exports.locBegin = function() { return  { line: this.li0, column: this.col0 }; };
module.exports.locOn = function(l) { return { line: this.li, column: this.col - l }; };


