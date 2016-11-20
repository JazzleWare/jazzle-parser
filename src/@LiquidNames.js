function LiquidNames(nameArray) {
  this.nameMap = {};
  this.nameList = [];
  if (nameArray) {
    var e = 0;
    while (e < nameArray.length)
      this.addNewLiquidName(nameArray[e++]);
  }
}

