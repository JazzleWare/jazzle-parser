this.push = function(n) {
   ASSERT.call(this, !this.isSimple());
   if ( ( y(n) !== 0 || n.type === 'LabeledStatement' ) && HAS.call(pushList, n.type) )
     pushList[n.type].call( this, n );
   else
     this.current().addStmt(n);

   return this;
}; 

this.close_current_active_partition = function() {
   ASSERT.call(this, !this.isSimple());
   if ( this.currentPartition === null )
     return;

   ASSERT.call(this, this.currentPartition.isSimple());
   if (this.currentPartition.statements.length !== 0) {
     this.currentPartition = null;
   }
};

this.current = function() { // TODO: substitute it with add_to_current_partition
   ASSERT.call(this, !this.isSimple());
   if (this.currentPartition !== null)
     return this.currentPartition;

   var n = new Partitioner(this, null);
   this.max++; 
   this.partitions.push(n);

   this.currentPartition = n;
   return n;
};

this.isSimple = function() {
  return this.type === 'SimpleContainer';
};

this.addStmt = function(n) {
  this.scanStmt(n);
  this.statements.push(n);
};

this.scanStmt = function(n) {
  if (HAS.call(scanList, n.type)) {
    scanList[n.type].call(this, n);
  }
};

this.isContainer = function() {
  return !this.isSimple();
};

var pushList = {};
var scanList = {};
  
this.prettyString = function(emitter) {
   if (!emitter) emitter = new Emitter();
    
   var list = null, e = 0;
   if (this.isContainer()) {
     list = this.partitions;
     emitter.newlineIndent();
     emitter.write('<container:'+ this.type +
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

this.out = function() {   
  if ( this.owner === null ) return null;
  if ( this.idx < this.owner.partitions.length - 1 )
    return this.owner.partitions[this.idx+1];

  return this.owner.out();
};

this.loop = function() {
  if ( this.owner === null ) return null;
  if ( this.idx < this.owner.partitions.length - 1 )
    return this.owner.partitions[this.idx+1];

  return this.owner.partitions[0];
};

this.addLabel = function(name, labelRef) {
  if (!labelRef) labelRef = LabelRef.real();

  var existingLabel = this.findLabel(name);
  if (existingLabel) {
    existingLabel.synthName = this.synthLabelName(existingLabel.baseName);
    this.addLabel(existingLabel.synthName, existingLabel);
  }
  this.labelNames[name+'%'] = labelRef;
};

this.removeLabel = function(name) {
  this.labelNames[name+'%'] = null;
};

this.synthLabelName = function(baseName) {
  baseName = baseName || "label";
  var num = 0;
  var name = baseName;
  while (this.findLabel(name)) {
    num++;  
    name = baseName + "" + num;
  }
  return name;
};

this.useSynthLabel = function() {
   this.synthLabel = LabelRef.synth(this.type);
   this.synthLabel.synthName = this.synthLabelName(this.synthLabel.baseName);
   this.addLabel(this.synthLabel.synthName, this.synthLabel);
};

this.removeContainerLabel = function() {
   if (this.synthLabel !== null)
     this.removeLabel(this.synthLabel.synthName);
}; 
  
this.findLabel = function(name) {
   name += '%';
   return HAS.call(this.labelNames, name) ?
       this.labelNames[name] : null;
};

this.verifyBreakTarget = function() {
  if (this.abt !== this.ebt) this.ebt.useSynthLabel();
};

this.verifyContinueTarget = function() {
  if (this.act !== this.ect) this.ect.useSynthLabel();
};

this.scanArray = function(list) {
   var e = 0;
   while (e < list.length) this.scanStmt(list[e++]);
};

this.isLoop = function() {
   switch (this.type) {
     case 'ForInContainer':
     case 'ForOfContainer':
     case 'ForContainer': 
     case 'DoWhileContainer':
     case 'WhileContainer':
        return true;
     
     default:
        return false;
   }
};

this.addSynthContinueLoopPartition = function() {
   ASSERT.call(this, this.isLoop());
   this.partitions.push(new Partition(this, null));
};
    
pushList['BlockStatement'] = function(n) {
   var list = n.body, e = 0;
   var container = new Partitioner(this, n);
   while (e < list.length) {
      container.push(list[e]);
      e++ ;
   }
   this.max = container.max;
   this.partitions.push(container);
};

scanList['BlockStatement'] = function(n) {
  this.scanArray(n.body);
};

scanList['TryStatement'] = function(n) {
  this.scanArray(n.block.body);
  if (n.handler) this.scanArray(n.handler.body);
  if (n.finalizer) this.scanArray(n.finalizer.body);
};

scanList['SwitchStatement'] = function(n) {
  var abt = this.abt, ebt = this.ebt;
  this.abt = this.ebt = n;
  var list = n.cases, e = 0;
  while (e < list.length)
     this.scanArray(list[e++].consequent);
  
  this.abt = abt; this.ebt = ebt;
};

scanList['IfStatement'] = function(n) {
  this.scanStmt(n.consequent);
  if (n.alternate) this.scanStmt(n.alternate);
};

scanList['ForOfStatement'] =
scanList['ForInStatement'] =
scanList['ForStatement'] =
scanList['DoWhileStatement'] =
scanList['WhileStatement'] = function(n) {
   var abt = this.abt, ebt = this.ebt;
   this.abt = this.ebt = n;
   var act = this.act, ect = this.ect; 
   this.act = this.ect = n;

   this.scanStmt(n.body); 

   this.abt = abt; this.ebt = ebt;
   this.act = act; this.ect = ect;   
};

scanList['BreakStatement'] = function(n) { this.verifyBreakTarget(); };
scanList['ContinueStatement'] = function(n) { this.verifyContinueTarget(); };

function synth_do_while(cond, body) {
   return { type: 'DoWhileStatement', test: cond, body: BLOCK(body) };
};

pushList['ExpressionStatement'] = function(n) {
   var yc = y(n);
   var e = this.emitter.transformYield(n.expression, this, NOT_VAL);
   if (e !== NOEXPRESSION && !( e.type === 'Identifier' && e.synth ) )
     this.current().addStmt(e);
};

pushList['WhileStatement'] = function(n) {
   this.close_current_active_partition();
   var container = new Partitioner(this, n);
   var test = this.emitter.transformYield(n.test, container, IS_VAL);
   container.close_current_active_partition();
   var test_seg = container.current();
   test_seg.addStmt(test);
   container.close_current_active_partition();
   container.test = test_seg;
   container.push(n.body);
   container.removeContainerLabel();

   this.partitions.push(container);
   this.max = container.max;
};
       
pushList['IfStatement'] = function(n) {
   this.close_current_active_partition();
   var container = new Partitioner(this, n);
   var test = this.emitter.transformYield(n.test, container, IS_VAL);
   container.close_current_active_partition();
   var test_seg = container.current();
   test_seg.addStmt(test);
   container.close_current_active_partition();
   container.test = test_seg;
   container.push(n.consequent);
   if (n.alternate !== null) {
       container.close_current_active_partition();
       var elseContainer = new Partitioner(container, { type: 'ElseClause' }); // TODO: eliminate { type: 'BlockStatement' }
       elseContainer.push(n.alternate);
       container.alternate = elseContainer;
       container.partitions.push(elseContainer);
       container.max = elseContainer.max;
   }
   this.partitions.push(container);
   this.max = container.max;
};  

pushList['YieldExpression'] = function(n) {
   this.current().addStmt(n);
   this.close_current_active_partition();
};

pushList['ForStatement'] = function(n) {
  this.close_current_active_partition();
  var container = new Partitioner(this, n);
  var e = this.transformYield(n.init, container, NOT_VAL);
  container.close_current_active_partition();
  var seg = container.current();
  seg.addStmt(e);
  container.close_current_active_partition();
  container.init = seg;

  e = this.transformYield(n.test);
  container.close_current_active_partition();
  seg = container.current();
  seg.push(e);
  container.close_current_active_partition();
  container.test = e;

  container.push(n.body);
  var uContainer = new Partitioner(container, { type: 'CustomContainer' });
  uContainer.push(n.update);

  container.next = n.update;
  container.max = uContainer.max;

  this.partitions.push(container);
  this.max = container.max;
};
     
pushList['TryStatement'] = function(n) {
   this.close_current_active_partition();
   var container = new Partitioner(this, n);

   var tryContainer = new Partitioner(container, {type:'CustomContainer'});
   tryContainer.push(n.block);
   container.block = tryContainer;
   container.partitions.push(tryContainer);
   container.max = tryContainer.max;

   if (n.handler) {
      var catchContainer = new Partitioner(container, {type:'CustomContainer'});
      if (n.handler.param.type !== 'Identifier') {
         var temp = synth_id_node(this.emitter.scope.allocateTemp());
         tryContainer.errorVar = temp;
         catchContainer.push({
            type: 'AssignmentExpression',
            y: y(n.handler.param),
            left: n.handler.param,
            right: temp
         });
         this.emitter.scope.releaseTemp(temp.name);
         // n.handler.param = temp;
      }
      catchContainer.push(n.handler.body);
      container.handler = catchContainer;
      container.max = catchContainer.max; 
   }  
   else
      n.handler = null;

   if (n.finalizer) {
      var finallyContainer = new Partitioner(container, {type:'CustomContainer'});
      finallyContainer.push(n.finalizer);
      container.finalizer = finallyContainer;
      container. partitions.push(finallyContainer);
      container.max = finallyContainer.max;
   }
   else
      n.finalizer = null;

   this.partitions.push(container);
   this.max = container.max;
};      

pushList['LabeledStatement'] = function(n) {
   this.addLabel(n.label.name);
   if (y(n) > 0) {
     this.close_current_active_partition();
     var container = new Partitioner(this, n);
     var name = n.label.name + '%';
     container.label = { name: n.label.name, head: null, next: null };
     container.label.head = container.label;
     container.push(n.body);
     this.partitions.push(container);
     this.max = container.max;
   }
   else
      this.current().addStmt(n);
   this.removeLabel(n.label.name);
};

pushList['SwitchStatement'] = function(n) {
   this.close_current_active_partition();
   var switchContainer = new Partitioner(this, n);
   var switchBody = this.emitter.transformSwitch(n), e = 0;
   while (e < switchBody.length)
     switchContainer.push(switchBody[e++]);

   this.partitions.push(switchContainer);
   this.max = switchContainer.max;
};
   
