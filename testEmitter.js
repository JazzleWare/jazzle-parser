var p = new Parser('if (false) 12; else 120');
var e = new Emitter();
var n = null;
n = (p .parseProgram());
e._emitBlock(n.body[0]);
console.log(e.code);

