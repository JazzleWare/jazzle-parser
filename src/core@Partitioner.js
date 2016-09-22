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
     this.max++;
     this.currentPartition = null;
   }
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

pushList['YieldExpression'] = function(n) {
   this.current().statements.push(n);
   this.close_current_active_partition();
};

pushList['ExpressionStatement'] = function(n) {
   var yc = y(n);
   var e = this.emitter.transformYield(n.expression, this, NOT_VAL);
   if (e !== NOEXPRESSION && !( e.type === 'Identifier' && e.synth ) )
     this.current().statements.push(e);
   else
     this.max--; // there has been a yield, or else the transformed expression wouldn't have been a NOEXPRESSION or a synth id
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
   var list = n.body;
   if ( list.type !== 'BlockStatement' )
     container.push(list);
   else {
     var e = 0;
     while (e < list.length) container.push(list[e++]);
   }
   this.partitions.push(container);
   this.max = container.max;
};
       
this.prettyString = function(emitter) {
   if (!emitter) emitter = new Emitter();
   var list = null, e = 0;
   if (this.type === CONTAINER_PARTITION) {
     list = this.partitions;
     emitter.newlineIndent();
     emitter.write('<container:'+(this.details?this.details.type:'main') +
                    ' [' + this.min + ' to ' + (this.max) +']>');
     emitter.indent();
     while (e < list.length) {
        list[e].prettyString(emitter);
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
       emitter.emit(list[0]);
    
     emitter.write('</seg>');
   }

   return emitter.code;
};
