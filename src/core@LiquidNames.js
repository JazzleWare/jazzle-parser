this.mustNotHaveReal = function(name) {
  var entry = this.findName(name);
  if (entry === null) {
    this.insert(name, newEntry(name, -1));
    return;
  }
  if (entry.nonce === -1)
    return;

  // if the entry is synthetic, i.e., it is not a "real" entry
  if (entry.realName !== name) {
    this.refresh(entry);
    this.insert(name, newEntry(name, -1));
  }
  else {
    // the name is already in our liquid name list; 
    // if it is still real (nonce is 0), rename it
    if (entry.nonce === 0)
      this.refresh(entry);
  }
};

this.addNewLiquidName = function(name) {
  var entry = this.findName(name), e = null;
  if (entry === null) {
    this.insert(name, e = newEntry(name, 0));
    this.nameList.push(e);
    return;
  }
  if (entry.nonce === -1) {
    entry.nonce = 0;
    this.refresh(entry);
    this.nameList.push(entry);
    return;
  }
  if (entry.realName !== name) {
    this.insert(name, e = newEntry(name, 0));
    this.refresh(entry);
    this.nameList.push(e);
    return;
  }
  ASSERT.call(this, false, 'name is in the list: "' + name + '"');
};

this.findName = function(name) {
  return getOwn(this.nameMap, name+'%');
};

this.insert = function(name, entry) { this.nameMap[name+'%'] = entry; };

this.hasName = function(name) {
  return hasOwn(this.nameMap, name+'%');
};

this.refresh = function(entry) { 
  var baseName = entry.realName,
      nonce = entry.nonce,
      name = "";
  while (true) {
    ++nonce;
    name = baseName + nonce;
    if (!this.hasName(name)) break;
  }
  entry.nonce = nonce;
  this.insert(name, entry);
};

function newEntry(realName, nonce) {
  return { realName: realName, nonce: nonce };
}

