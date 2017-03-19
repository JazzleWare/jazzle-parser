Hitmap.prototype.isValidName = function(name) {
  return this.isValidName_m(name+'%');
};

Hitmap.prototype.isValidName_m = function(mname) {
  return this.validNames === null ? true :
    this.validNames.has(mname);
};

Hitmap.prototype.set = function(name, value) {
  return this.set_m(name+'%', value);
};

Hitmap.prototype.set_m = function(mname, value) {
  ASSERT.call(this, this.isValidName_m(mname),
    'not among the valid names: <' + mname + '>');
  if (!this.names.has(mname))
    this.names.set(mname, {gets: 0, sets: 0, name: mname, value: null});

  var entry = this.names.get(mname);
  entry.sets++;
  entry.value = value;

  return entry;
};

Hitmap.prototype.getOrCreate = this.getoc = function(name) {
  return this.getOrCreate_m(name+'%');
};

Hitmap.prototype.getOrCreate_m = this.getoc_m = function(mname) {
  ASSERT.call(this, this.isValidName_m(mname),
    'not among the valid names: <' + mname + '>');
  if (!this.names.has(mname))
    this.set_m(mname).sets = 0;

  var entry = this.names.get(mname);
  entry.gets++;
  return entry;
};
