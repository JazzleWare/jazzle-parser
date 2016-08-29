var p = new Parser('function* l() { (yield) * (yield); ');
var e = new Emitter();
var n = null;
n = (p .parseProgram());

var i, a = [];
var l = n.body[0].body.body[0].expression ;
e.transformBinaryExpression(l, a);

i = 0;
while (i < a.length) {
  if (a[i].type === 'YieldExpression' ) {
    e.code += 'yield (';
    if (a[i].argument) e.emit(a[i].argument);
    else e.code += '<none>';
    e.code += ')';
  }
  else
     e.emit(a[i]);

  e.newlineIndent();

  i++;

}

e.emit(l);
console.log(e.code);
