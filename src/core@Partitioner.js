this.push = function(n) {
   ASSERT.call(this, this.type === CONTAINER_PARTITION);

   if ( y(n) !== 0 && HAS.call(pushList, n.type) )
     pushList[n.type].call( this, n );
   else
     this.current().statements.push(n);
}; 

this.close_current_active_partition = function() {
   ASSERT.call(this, this.type === CONTAINER_PARTITION);
   if ( this.currentPartition === null )
     return;

   ASSERT.call(this, this.currentPartition.type === SIMPLE_PARTITION);
   if (this.currentPartition.statements.length !== 0) {
     this.currentPartition = null;
   }
};

this.current = function() { // TODO: substitute it with add_to_current_partition
   ASSERT.call(this, this.type === CONTAINER_PARTITION);
   if (this.currentPartition !== null)
     return this.currentPartition;

   var n = new Partitioner(this, null);
   this.max++; 
   this.partitions.push(n);

   this.currentPartition = n;
   return n;
};

var pushList = {};
  
this.prettyString = function(emitter) {
   if (!emitter) emitter = new Emitter();
    
   var list = null, e = 0;
   if (this.type === CONTAINER_PARTITION) {
     list = this.partitions;
     emitter.newlineIndent();
     emitter.write('<container:'+(this.details?this === this.owner.alternate ? 'else' :this.details.type:'main') +
                    ' [' + this.min + ' to ' + (this.max-1) +']>');
     emitter.indent();
     while (e < list.length) {
         if ( list[e]===START_BLOCK ) {
           emitter.newlineIndent();
           emitter.write('<B>') ;
           emitter.indent();
         }
         else if ( list[e]===FINISH_BLOCK ) {
           emitter.unindent();
           emitter.newlineIndent();
           emitter.write('</B>');
         }
         else list[e].prettyString(emitter);
         e++ ;
     }
     emitter.unindent();
     emitter.newlineIndent();
     emitter.write('</container>');
   }
   else {
     ASSERT.call(this, this.min === this.max);
     list = this.statements;
     emitter.newlineIndent();
     emitter.write('<seg'+(this === this.owner.test ? ':test' : '') +
                   ' [' + this.min + ']>');
     if ( list.length>1 ) {
        emitter.indent();     
        while (e < list.length) {
          emitter.newlineIndent();
          emitter.emit(list[e]);
          e++ ;
        }
        emitter.unindent();
        emitter.newlineIndent();
     }
     else
        emitter.emit (list[0]);
    
     emitter.write('</seg>');
   }
   
   return emitter.code;
};

this.enterScope = function() {
  this.partitions.push(START_BLOCK);
};

this.exitScope = function() {
  this.partitions.push(FINISH_BLOCK);
};

pushList['BlockStatement'] = function(n) {
   var list = n.body, e = 0;
   while (e < list.length) {
      if (e === 0) this.enterScope();
      this.push(list[e]);
      if (e === list.length-1) this.exitScope();
      e++ ;
   }
};

pushList['ExpressionStatement'] = function(n) {
   var yc = y(n);
   var e = this.emitter.transformYield(n.expression, this, NOT_VAL);
   if (e !== NOEXPRESSION && !( e.type === 'Identifier' && e.synth ) )
     this.current().statements.push(e);
};

pushList['WhileStatement'] = function(n) {
   this.close_current_active_partition();
   var container = new Partitioner(this, n);
   var test = this.emitter.transformYield(n.test, container, IS_VAL);
   container.close_current_active_partition();
   var test_seg = container.current();
   test_seg.statements.push(test);
   container.close_current_active_partition();
   container.test = test_seg;
   container.push(n.body);

   this.partitions.push(container);
   this.max = container.max;
};
       
pushList['IfStatement'] = function(n) {
   this.close_current_active_partition();
   var container = new Partitioner(this, n);
   var test = this.emitter.transformYield(n.test, container, IS_VAL);
   container.close_current_active_partition();
   var test_seg = container.current();
   test_seg.statements.push(test);
   container.close_current_active_partition();
   container.test = test_seg;
   container.push(n.consequent);
   if (n.alternate !== null) {
       container.close_current_active_partition();
       var elseContainer = new Partitioner(container, { type: 'BlockStatement' }); // TODO: eliminate { type: 'BlockStatement' }
       elseContainer.push(n.alternate);
       container.alternate = elseContainer;
       container.partitions.push(elseContainer);
       container.max = elseContainer.max;
   }
   this.partitions.push(container);
   this.max = container.max;
};  

pushList['YieldExpression'] = function(n) {
   this.current().statements.push(n);
   this.close_current_active_partition();
};

   
