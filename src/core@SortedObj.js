this.set = function(name, val) {
  if (!HAS.call(obj, name))
    this.keys.push(name);
  return obj[name] = val;
};

this.at = function(i) {
  return i < this.keys.length ? obj[this.keys[i]] : void 0;
};

this.get = function(name) {
  return obj[name]; 
};

this.remove = function(name) {
  if (!HAS.call(obj, name))
    return false;
  delete obj[name];

  var list = this.keys, i = 0;

  while (name !== list[i])
    i++;

  while (i < list.length-1) {
    list[i] = list[i+1];
    i++;
  }

  list.pop();
  return true;
};
