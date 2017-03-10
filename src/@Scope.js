function Scope(sParent, sType) {
  this.parent = sParent;
  this.type = sType;
  this.scs = this.isConcrete() ?
    this :
    this.parent.scs;
  
  this.defs = new SortedObj();
  this.refs = new SortedObj();

  this.allowed = this.calculateAllowedActions();
  this.mode = this.calculateScopeMode();
  if (this.isCtorComp() && !this.parent.hasHeritage())
    this.allowed &= ~SA_CALLSUP;

  this.labelTracker = new LabelTracker();
  this.allNames = this.parent ? 
    this.parent.allNames :
    new SortedObj();

  this.resolveCache = new SortedObj();
}
