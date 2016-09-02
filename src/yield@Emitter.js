function synth_id_node(name) {
   return { type: 'Identifier', synth: !false, name: name };
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
   if (left.type === 'Identifier' && right.type === 'Identifier')
     if (left.synth && left.name === right.name )
       return left;
  
   return { type: 'AssignmentExpression',  operator: '=', right: right, left: left };
}

function cond_node(e, c, a) {
   return { type: 'ConditionalExpression', 
            test: e,
            consequent: c,
            alternate: a };
}

function findYield(n) {
  switch (n.type) {
    case 'Identifier':
    case 'Literal':
       return 0;

    default:
       if (n.y > 0)
         return n.y--;

       return 0;
  }  
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

var has = {}.hasOwnProperty;
var transformerList = {};

this.transformYield = function(n, b, isVal) {
  if ( has.call(transformerList, n.type) )
    return transformerList[n.type].call(this, n, b, isVal);
  
  return n;
};

function synth_not_node(n) {
  return { type: 'UnaryExpression', operator: '!', argument: n};

}

function synth_if_node(cond, body, alternate) {
  if (body.length > 1 || body[0].type === 'IfStatement' )
    body = { type: 'BlockStatement', body : body };
  else
    body = body[0];

  return { type: 'IfStatement', alternate: alternate || null, consequent: body, test: cond };
}
 
transformerList['BinaryExpression'] = function(n, b, isVal) {
   var leftTemp = "";

   n.left = this.transformYield(n.left, b, !false);

   if ( findYield(n.right) ) {
     leftTemp = this.scope.allocateTemp();

     var id = synth_id_node(leftTemp);
     var assig = assig_node( id, n.left);
     if (assig.type !== 'Identifier' || !assig.synth)
        b.push( assig );
     n.left = id;
   }

   n.right = this.transformYield(n.right, b, !false );

   if ( leftTemp !== "" )
     this.scope.releaseTemp(leftTemp);

   return n;
};

var NOEXPRESSION = { type: 'NoExpression' };
  
transformerList['LogicalExpression'] = function(n, b, isVal) {
   var temp = "";
   n.left = this.transformYield (n.left, b, !false);
   
   var id = null;

   if (findYield(n.right)) {
     if (isVal) {
       temp = this.scope.allocateTemp();
       if ( n.left.type !== 'Identifier' || n.left.name !== temp)
         n.left = assig_node(synth_id_node(temp), n.left);

       this.scope.releaseTemp(temp);
     }

     if (n.operator === '||')
       n.left = synth_not_node(n.left);

     var ifBody = [];
     n.right = this.transformYield (n.right, ifBody, isVal);
     if (isVal) {
       temp = this.scope.allocateTemp();
       if ( n.right.type !== 'Identifier' || n.right.name !== temp )
         ifBody.push( assig_node(synth_id_node(temp), n.right));

       this.scope.releaseTemp(temp);
     }
     else if (n.right.type !== 'Identifier' || !n.right.synth )
       ifBody.push(n.right);

     b. push( synth_if_node(n.left, ifBody) );       
     return isVal ? synth_id_node(temp) : NOEXPRESSION ;
   }

   n.right = this.transformYield (n.right, b, isVal);
   return n;
};          
     
transformerList['YieldExpression'] = function(n, b, isVal) {
   b. push(n);
   return synth_id_node('sent');
};
          
        
