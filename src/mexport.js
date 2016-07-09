_exports.parse = function(src, isModule ) {
  var newp = new Parser(src, isModule);
  return newp.parseProgram();
};

_exports.Parser = 
Parser;  
