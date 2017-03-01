function Scope(sParent, sType) {
  this.parent = sParent;
  this.type = sType;
  this.scs = this.isConcrete() ?
    this :
    this.parent.scs;
  
  this.defs = this.parent ?
    SortedObj.from(this.parent.defs) :
    new SortedObj();

  this.refs = new SortedObj();
  this.allowed = this.calculateAllowedActions();
  this.mode = this.calculateScopeMode();
  this.labelTracker = new LabelTracker();
  this.allNames = this.parent ? 
    this.parent.allNames :
    new SortedObj();
}
