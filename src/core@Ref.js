this.total = function() {
  return this.indirect.total() + this.direct.total();
};

this.absorbRef = function(anotherRef) {
  ASSERT.call(this, this.unresolved,
    'a resolved reference must absorb through its decl');
  ASSERT.call(this, this.anotherRef.unresolved,
    'absorbing a reference that has been resolved is not a valid action');
  var fromScope = anotherRef.scope;
  if (fromScope.isIndirect()) {
    if (fromScope.isHoisted())
      this.indirect.fw += anotherRef.total();
    else {
      this.direct.fw += anotherRef.direct.fw;
      this.indirect.fw += anotherRef.indirect.fw;
    }
  }
};
