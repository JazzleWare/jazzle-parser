this.push = function(stmt) {
   ASSERT.call(this, this.type === CONTAINER_PARTITION);

   var yStmt = y(stmt), p = this.current();

   if (stmt.type === 'YieldExpression') {
      p.statements.push(stmt);
      return this.close_current_active_partition();
   }     
   if (yStmt === 0)
     return p.statements.push(stmt);

   if (stmt.type !== 'ExpressionStatement') {
     ASSERT.call(this, HAS.call(pushList, stmt.type));
     var container = this.push_container(stmt);
     return pushList[stmt.type].call(container, stmt);
   }
 
   var e = this.emitter.transformYield(stmt.expression, this, NOT_VAL);
   if (e !== NOEXPRESSION) {
     stmt.expression = e;
     return this.current().statements.push(stmt);
   }
}; 

this.close_current_active_partition = function() {
   ASSERT.call(this, this.type === CONTAINER_PARTITION);
   this.currentPartition = null;
};

this.current = function() {
   ASSERT.call(this, this.type === CONTAINER_PARTITION);
   if (this.currentPartition !== null)
     return this.currentPartition;

   var n = new Partitioner(this, null);
   this.partitions.push(n);

   this.currentPartition = n;
   return n;
};

var pushList = {};

this.push_container = function(stmt) {
   var container = new Partitioner(this, stmt);
   this.partitions.push(container);
   return container;
}; 

pushList['WhileStatement'] = function(stmt) {
   var test = this.emitter.transformYield(stmt.test, this, IS_VAL);
   this.close_current_active_partition();
   var current = this.current();
   current.push(test);
   this.test = current;
   this.close_current_active_partition();
   var b = stmt.body;
   if (b.type !== 'BlockExpression')
     return this.push(b); 

   var e = 0;
   while (e < b.length) this.push(b[e++]);
};

