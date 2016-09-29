function Partitioner(owner, details) {

   this.owner = owner;

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
   }
   else if (owner === null) {
     this.partitions = [];
     this.statements = null;
     this.type = 'MainContainer';
   }
   else switch (details.type) {
     case 'CatchClause':
     case 'WhileStatement':
     case 'SwitchStatement':
     case 'DoWhileStatement':
     case 'ForOfStatement':
     case 'ForInStatement':
     case 'TryStatement':
     case 'ForStatement':
     case 'IfStatement':
     case 'ElseClause':
     case 'CaseClause':
     case 'CustomContainer':
        this.partitions = [];
        this.statements = null;
        this.type = details.type.replace(/(?:Clause|Statement)$/, "Container");
        break;

     default:
        ASSERT.call(this, false, "not a container partition: " + details.type);
   }

   this.currentPartition = null;

   this.min = this.owner ? this.owner.max : 0;
   this.max = this.min;
}

