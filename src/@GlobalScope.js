function GlobalScope() {
  Scope.call(this, null, ST_GLOBAL);  
}

GlobalScope.prototype = createObj(Scope.prototype);
