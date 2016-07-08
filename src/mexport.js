_exports.parse = function(src) {
  var newp = new Parser(src);
  return newp.parseProgram();
};

_exports.Parser = 
Parser;  
