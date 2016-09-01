var p = new Parser('function* l() { (yield) * (yield); } ');
var e = new Emitter();
var n = null;
n = (p .parseProgram());

var i, a = [];
var l = n.body[0].body.body[0].expression ;
l = e.transformYield(l, a, false );

i = 0;
while (i < a.length) {
  e.emit(a[i]);
  e.newlineIndent();
  i++;
}

e.emit(l);
console.log(e.code);
