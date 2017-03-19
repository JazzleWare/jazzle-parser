GlobalScope.prototype.moduleScope = function() {
  return new Scope(this, ST_MODULE);
};

GlobalScope.prototype.scriptScope = function() {
  return new Scope(this, ST_SCRIPT);
};
