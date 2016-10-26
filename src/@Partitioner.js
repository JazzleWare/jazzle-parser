function Partitioner(owner, details) {

   this.owner = owner;
   this.label = null;

   this.labelNames = null;

   this.act = null;
   this.ect = null;
   this.abt = null;
   this.ebt = null;

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
     this.partitions = null;
     this.type = 'SimpleContainer';
     this.statements = [];

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
}   
