this.y = function(n) {
  return this.inGen ? y(n) : 0;
};

this.allocTemp = function() {
  var id = synth_id(this.currentScope.allocateTemp());
  return id;
};

this.releaseTemp = this.rl = function(id) {
  this.currentScope.releaseTemp(id.name);
};

var transform = {};

this.transform = this.tr = function(n, list, isVal) {
  var ntype = n.type;
  switch (ntype) {
    case 'Identifier':
    case 'Literal':
    case 'This':
    case 'Super':
    case 'ArrIterGet':
    case 'ObjIterGet':
      return n;
    default:
      return transform[n.type].call(this, n, list, isVal);
  }
};

this.rlit = function(id) { isTemp(id) && this.rl(id); };

this.trad = function(n, list, isVal) {
  var tr = this.tr(n, list, isVal);
  push_checked(tr, list);
};

this.save = function(n, list) {
  var temp = this.allocTemp();
  push_checked(synth_assig(temp, n), list);
  return temp;
};

var transformAssig = {};
transform['SyntheticAssignment'] =
transform['AssignmentExpression'] = function(n, list, isVal) {
  if (n.type !== 'SyntheticAssignment') {
    var rightTemp = n.left.type !== 'Identifier' ? this.allocTemp() : null;
    this.evalLeft(n.left, n.right, list);
    rightTemp && this.rl(rightTemp);
  }

  return transformAssig[n.left.type].call(this, n, list, isVal);
};

// TODO: things like `[a[yield]] = 12` are currently transformed as:
// `t1 = a; yield; t2 = sent; t = arrIter(12); t1[t2] = t.get()`
// from an optimal perspective, this should rather be:
// `t1 = a; yield; t = arrIter(12); t1[sent] = t.get()`
// generally speaking, an 'occupySent' should exist, and should be used by any expression
// that makes use of sent; each call to this hypothetical 'occupySent' will then return 'sent',
// saving the current expression that is using 'sent' in a temp, and further replacing that expression with
// the temp it is saved in.
var evalLeft = {};
this.evalLeft = function(left, right, list) {
  return evalLeft[left.type].call(this, left, right, list);
};

evalLeft['Identifier'] = function(left, right, list) {
  return;
};

transformAssig['Identifier'] = function(n, list, isVal) {
  n.right = this.tr(n.right, list, true);
  return n;
};

evalLeft['MemberExpression'] = function(left, right, list) {
  left.object = this.tr(left.object, list, true);
  if (right === null || this.y(right))
    left.object = this.save(left.object, list);
  if (left.computed) {
    left.property = this.tr(left.property, list, true);
    if (right === null || this.y(right))
      left.property = this.save(left.property, list);
  }
};

transformAssig['MemberExpression'] = function(n, list, isVal) {
  var left = n.left;
  // this.evalLeft(left, n.right, list);
  // var t = {}, n = 12; t[n] = (t = {}, n = 12, t[n] = n), you know
  this.rlit(left.property);
  this.rlit(left.object);
  n.right = this.tr(n.right, list, true);
  return n;
};

var assigPattern = {};
this.assigPattern = function(left, right, list) {
  return assigPattern[left.type].call(this, left, right, list);
};

this.evalProp = function(elem, list) {
  if (elem.computed) {
    elem.key = this.tr(elem.key, list, true);
    elem.key = this.save(elem.key, list);
  }
  this.evalLeft(elem.value, null, list);
};
 
evalLeft['ObjectPattern'] = function(left, right, list) {
  var elems = left.properties, e = 0;
  while (e < elems.length)
    this.evalProp(elems[e++], list);
};
 
assigPattern['ObjectPattern'] = function(left, right, list) {
  var elems = left.properties, e = 0;
  while (e < elems.length) {
    var elem = elems[e];
    this.trad(
      synth_assig_explicit(elem.value,
        synth_call_objIter_get(right, getExprKey(elem))
      ), list, false
    );
    e++;
  }
};

transformAssig['ObjectPattern'] = function(n, list, isVal) {
  // var iterVal = this.allocTemp();
  // this.evalLeft(n.left, /* TODO: unnecessary */n.right, list);
  // this.rl(iterVal);
  n.right = this.tr(n.right, list, true);
  var iter = this.save(wrapObjIter(n.right), list);
  this.assigPattern(n.left, iter, list);
  this.rl(iter);
  return isVal ? iterVal(iter) : NOEXPR;
};

evalLeft['ArrayPattern'] = function(left, right, list) {
  var elems = left.elements, e = 0;
  while (e < elems.length)
    this.evalLeft(elems[e++], null, list);
};

assigPattern['ArrayPattern'] = function(left, right, list) {
  var elems = left.elements, e = 0;
  while (e < elems.length) {
    this.trad(
      synth_assig_explicit(elems[e],
        synth_call_arrIter_get(right)
      ), list, false
    );
    e++;
  }
};

transformAssig['ArrayPattern'] = function(n, list, isVal) {
  // var iterVal = this.allocTemp();
  // this.evalLeft(n.left, /* TODO: unnecessary */n.right, list);
  // this.rl(iterVal);
  n.right = this.tr(n.right, list, true);
  var iter = this.save(wrapArrIter(n.right), list);
  this.assigPattern(n.left, iter, list);
  this.rl(iter);
  return isVal ? iterVal(iter) : NOEXPR;
}; 

evalLeft['AssignmentPattern'] = function(left, right, list) {
  return this.evalLeft(left.left, right, list);
};

transformAssig['AssignmentPattern'] = function(n, list, isVal) {
  var temp = this.allocTemp();
  var l = [], left = n.left;
  this.trad(left.right, l, true);
  return this.transform(
    synth_assig_explicit(left.left,
      synth_cond(
        wrapInUnornull( 
          synth_assig_explicit(temp,
            n.right // not transformed -- it's merely a synth call in the form of either #t.get() or #t.get('<string>')
          )
        ),
        synth_seq(l),
        temp
      )
    ), list, isVal
  );
};

transform['YieldExpression'] = function(n, list, isVal) {
  if (n.argument)
    n.argument = this.tr(n.argument, list, true);
  push_checked(n, list);
  return isVal ? sentVal() : NOEXPR;
}

