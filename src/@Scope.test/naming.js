var scopeFunc = new Scope(null, 1);
var scopeLoop = new Scope(scopeFunc,4|0);
var scopeFuncInLoop = new Scope(scopeLoop, 1);
scopeFuncInLoop.reference('l');
scopeLoop.define('l',2);
scopeLoop.reference('e');
scopeFuncInLoop.closeScope();
scopeLoop.closeScope();
scopeFunc.reference('scope');
console.log(scopeFunc.defined);

