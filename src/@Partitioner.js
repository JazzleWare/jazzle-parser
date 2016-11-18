function Partitioner(owner, details) { // TODO: break it up into smaller and more streamlined pieces

   this.owner = owner;
   this.label = null;

   this.labelNames = null;

   this.act = null;
   this.ect = null;
   this.abt = null;
   this.ebt = null;

   this.mainContainer = null;
   this.hasFinally = false;

   if (this.owner === null) {
     this.emitter = details;
     this.details = null;
     this.idx = -1;
   }
   else {
     this.emitter = this.owner.emitter;
     this.details = details;
     this.idx = this.owner.partitions.length;
   }
     
   if (owner !== null && details === null) {
     this.type = 'SimpleContainer';
     this.statements = this.partitions = [];

     this.ect = this.owner.ect;
     this.act = this.owner.act;
     this.abt = this.owner.abt;
     this.ebt = this.owner.ebt;
   }
   else if (owner === null) {
     this.partitions = [];
     this.statements = null;
     this.type = 'MainContainer';
     this.labelNames = {}
   }
   else switch (details.type) {
     case 'WhileStatement':
     case 'SwitchStatement':
     case 'DoWhileStatement':
     case 'ForOfStatement':
     case 'BlockStatement':
     case 'ForInStatement':
     case 'TryStatement':
     case 'ForStatement':
     case 'IfStatement':
     case 'CatchClause':
     case 'ElseClause':
     case 'CaseClause':
     case 'LabeledStatement':
     case 'CustomContainer':
        this.partitions = [];
        this.statements = null;
        this.type = details.type.replace(/(?:Clause|Statement)$/, "Container");
        this.labelNames = this.owner.labelNames;

        this.act = this.owner.act;
        this.ect = this.owner.ect;
        this.abt = this.owner.abt;
        this.ebt = this.owner.ebt;

        break;

     default:
        ASSERT.call(this, false, "not a container partition: " + details.type);
   }

   this.currentPartition = null;

   this.min = this.owner ? this.owner.max : 0;
   this.max = this.min;

   this.synthLabel = null;

   switch (this.type) {
     case 'ForOfContainer':
     case 'ForContainer':
     case 'ForInContainer':
     case 'DoWhileContainer':
     case 'WhileContainer':
       this.act = this.ect = this.abt = this.ebt = this;
       break;

     case 'SwitchContainer':
       this.ebt = this;
     case 'TryContainer':
       this.abt = this.act = this;
       break;
   }      

   if (this.owner === null) // main container
     this.mainContainer = this;

   else
     this.mainContainer = this.owner.mainContainer;

   this.customNext = null;

   this.depth = this.owner ? this.owner.depth+1 : 0;

   this.currentSurroundingFinally = this.owner && this.owner.currentSurroundingFinally;

   // TODO: find a cleaner alternative
   if (this.owner && this.owner.type === 'LabeledContainer') {
     if (this.type === 'LabeledContainer') {
       this.label = {
          name: "", // don't use the name in this.details, as using the this.detail thing is going to be deprecated a few commits later, hopefully
          head: this.owner.label.head,
          next: null };
       this.owner.label.next = this.label;
     }
     else this.label = this.owner.label;
   }

   this.escapeEntries = null;
}

