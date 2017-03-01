this.absorbRef = function(otherRef) {
  ASSERT.call(this, otherRef.unresolved,
    'a resolved reference must not be absorbed by a declref');

  var fromScope = otherRef.scope;
  var cur = this.ref;
  
  if (fromScope.isIndirect()) {
    if (fromScope.isHoisted())
      cur.indirect.fw += ref.total();
    else
      cur.indirect.ex += ref.total()
  } else {
    cur.indirect.ex += ref.indirect.total();
    cur.direct.ex += ref.direct.total();
  }

  return cur;
};
