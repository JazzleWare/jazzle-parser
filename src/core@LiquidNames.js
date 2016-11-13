this.add = function(name) {
  var entry = this.get(name);
  ASSERT.call(this, entry === null || entry.realName !== name, 'the liquid global "'+name+'" already exists');
  this.names[name+'%'] = { realName: name, nonce: 0 };
  if (entry !== null) this.refresh(entry.realName);
};

this.get = function(name) {
  var entry = getOwn(name);
  return entry;
};

this.refresh = function(name) {
  var entry = this.get(name);
  var n = entry.nonce + 1;
  var baseName = entry.realName;
  while (true) {
    name = baseName + n;
    if (!HAS.call(this.names, name)) break;
    n++;
  }
  entry.nonce = n;
  this.names[name+'%'] = entry;
}; 

this.getName = function(name) {
  var entry = this.get(name);
  ASSERT.call(this, entry !== null, 'name not found: "' + name + '"');
  return entry.realName + entry.nonce;
};

this.rename = function(name) {
  var entry = this.get(name);
  if (entry.realName !== name)
    delete this.names[name+'%'];

  this.refresh(entry.realName);
};

