this.toBlock = function() {
  ASSERT.call(this, this.isBody(),
    'only body scopes are convertible to blocks');
  ASSERT.call(this, this.children.length === 0,
    'only body scopes without children ' +
    'are converible to blocks');
  this.type |= ST_BLOCK;
  return this;
};
