function synth_id_node(name) {
   return { type: 'Identifier', name: '%' + name };
}

function synth_expr_node(str) {
   return { type: 'SynthesizedExpr', contents: str };
}

function synth_expr_set_node(arr, isStatement ) {
   if (isStatement)
     return { type: 'SynthesizedExprSet', expressions: arr };

   return { type: 'SequenceExpression', expressions: arr };
}

function assig_node(left, right) {
   return { type: 'AssignmentExpression',  operator: '=', right: right, left: left };
}

function cond_node(e, c, a) {
   return { type: 'ConditionalExpression', 
            test: e,
            consequent: c,
            alternate: a };
}

function findYield(n) {
   var type = n.type;
   if (type === 'YieldExpression')
     return n;

   Emitter.prototype.assert(has.call(yieldFinders, type),
               'no yield finder: ' + type );
 
/* if (n.yieldLocation)
     return n.yieldLocation; */

   return yieldFinders[type].call(n);
}

var yieldFinders = {};
var y = yieldFinders;

var BINARY_EXPR_NAMES = ['left', 'right'];
y['LogicalExpression'] = 
y['AssignmentExpression'] = 
y['BinaryExpression'] =
y['AssignmentPattern'] = function() {
   return findYieldInNames(this, BINARY_EXPR_NAMES);
};

y['ArrayPattern'] = 
y['ArrayExpression'] = function() { 
   return findYieldInList(this, this.elements, 0);
};

function findYieldInList(n, list, idx) {
   var e = idx, yieldExpr = null;
   while (e < list.length) {
      yieldExpr = findYield(list[e]);
      if (yieldExpr) {
        n.yieldLocation = { loc: e, expr: yieldExpr };
        return yieldExpr;
      }
      e++ ;
   }
  
   return null;
}

y['ObjectExpression'] =
y['ObjectPattern'] = function() {
   return findYieldInList(this, this.properties);
};

y['SequenceExpression'] = function() {
   return findYieldInList(this, this.expression);
};

var CONDITIONAL_EXPR_NAMES = ['test', 'consequent', 'alternate'];
y['ConditionalExpression'] = function() {
   return findYieldInNames(this, CONDITIONAL_EXPR_NAMES); 
};

y['Property'] = function() {
   var yieldExpr = null;
   if (this.computed) {
     if (yieldExpr = findYield(this.key)) {
       this.yieldLocation = { loc: 'k', expr: yieldExpr };
       return yieldExpr;
     }
  }

  if (yieldExpr = findYield(this.value)) {
    this.yieldLocation = { loc: 'v', expr: yieldExpr };
    return yieldExpr;
  }

  return null;
};

y['MethodDefinition'] = y['Property'];
     
var VOID_0 = synth_expr_node('void 0');     
   
y['Identifier'] =
y['ThisExpression'] = 
y['Literal'] = function() { return null; };

y['MemberExpression'] = function() {
  var yieldExpr = findYield(this.object);
  if (yieldExpr) {
    this.yieldLocation = { loc: 'object', expr: yieldExpr };
  }
  
  else if (this.computed) {
    if (yieldExpr = findYield(this.property))
      this.yieldLocation = { loc: 'property', expr: yieldExpr };
  }

  return yieldExpr;
};

y['CallExpression'] = function() {
   var yieldExpr = findYield(this.callee);                         
   if (yieldExpr) {                                                
     this.yieldLocation = { loc: callee, expr: yieldExpr };        
     return yieldExpr;                                             
   }                                                               
                                                                   
   return findYieldInList(this, this.arguments);                   
};

y[ 'ClassExpression'] =
y[ 'ClassDeclaration'] = function() {
   var yieldExpr = findYield(this.superClass);
   if (yieldExpr) {
     this.yieldLocation = { loc: 'superClass', expr: yieldExpr };
     return yieldExpr;
   }

   return findYieldInList(this, this.body.body );
};   

function id_is_synth(n) {
   this.assert(id.type === 'Identifier');
   return n.name.charCodeAt() === CHAR_MODULO;
}

function findYieldInNames(n, list) {
   var y = null;
   var e = 0;
   while (e < list.length) {
      if (y=findYield(n[list[e]])) {
        n.yieldLocation = list[e];
        break;
      }

      e++ ;
   }

   return y;
}

this.transformBinaryExpression = function(n, b) {
   var left = n.left;
   var leftTemp = "";

   if (left.type === 'YieldExpression') {
     b.push(left);
     n.left = synth_id_node('sent');
   }
   else if (left.type === 'BinaryExpression')
     leftTemp = this.transformBinaryExpression(left, b);

   if ( findYield(n.right) ) {
     if ( leftTemp === "" )
       leftTemp = this.scope.allocateTemp();

     var id = synth_id_node(leftTemp);
     b.push( assig_node( id, n.left) );
     n.left = id;
   }

   var right = n.right;
   var rightTemp = "";

   if (right.type === 'YieldExpression') {
     b.push(right);
     n.right = synth_id_node('sent');
   }
   else if (right.type === 'BinaryExpression')
     rightTemp = this.transformBinaryExpression(right, b);

   if ( leftTemp !== "" && rightTemp !== "" )
     this.scope.releaseTemp(rightTemp);

   return leftTemp;
};

   
          
