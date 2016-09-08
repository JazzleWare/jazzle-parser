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

function y(n) {
  switch (n.type) {
    case 'ThisExpression':
    case 'Literal':
    case 'FunctionExpression':
    case 'Identifier':
       return 0;

    default:
       return n.y;
  }  
}

function id_is_synth(n) {
   this.assert(id.type === 'Identifier');
   return n.name.charCodeAt() === CHAR_MODULO;
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

var IS_REF = 1,
    IS_VAL = 2,
    NOT_VAL = 0;

var NOEXPRESSION = { type: 'NoExpression' };

function append_assig(b, left, right) {
  var assig = null;
  if ( right.type !== 'Identifier' || left !== right.name)
    assig = assig_node(synth_id_node(left), right);

  if ( assig ) b.push(assig);
}
   
transformerList['BinaryExpression'] = function(n, b, vMode) {
   var leftTemp = "";

   n.left = this.transformYield(n.left, b, !false);

   if ( y(n.right) ) {
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
 
transformerList['LogicalExpression'] = function(n, b, vMode) {
   var temp = "";
   n.left = this.transformYield (n.left, b, !false);
   
   var id = null;

   if (y(n.right)) {
     if (vMode) {
       temp = this.scope.allocateTemp();
       if ( n.left.type !== 'Identifier' || n.left.name !== temp)
         n.left = assig_node(synth_id_node(temp), n.left);

       this.scope.releaseTemp(temp);
     }

     if (n.operator === '||')
       n.left = synth_not_node(n.left);

     var ifBody = [];
     n.right = this.transformYield (n.right, ifBody, vMode);
     if (vMode) {
       temp = this.scope.allocateTemp();
       if ( n.right.type !== 'Identifier' || n.right.name !== temp )
         ifBody.push( assig_node(synth_id_node(temp), n.right));

       this.scope.releaseTemp(temp);
     }
     else if (n.right.type !== 'Identifier' || !n.right.synth )
       ifBody.push(n.right);

     b. push( synth_if_node(n.left, ifBody) );       
     return vMode ? synth_id_node(temp) : NOEXPRESSION ;
   }

   n.right = this.transformYield (n.right, b, vMode);
   return n;
};          
     
transformerList['YieldExpression'] = function(n, b, vMode) {
   b. push(n);
   return synth_id_node('sent');
};
          
transformerList['UpdateExpression'] = function(n, b, vMode) {        
   n.argument = this.transformYield(n.argument, b, IS_REF);
   return n;
};

transformerList['MemberExpression'] = function(n, b, vMode) {
   n.object = this.transformYield(n.object, b, vMode);
   var objTemp = "";
   if (y(n.property)) {
     objTemp = this.scope.allocateTemp();
     n.object = synth_id_node(objTemp);
     append_assig(b, objTemp, n.object);
     this.scope.releaseTemp(objTemp);
   }
   if (n.computed)
     n. property = this.transformYield(n.property, b, vMode);

   return n;
} 

this.transformCallArgs = function(args, b, yc) {
  var tempList = [], e = 0;
  while (e < args.length) {
     yc -= y(args[e]);
     args[e] = this.transformYield(args[e], b, IS_VAL);
     if (yc > 0) {
       var temp = this.scope.allocateTemp();
       append_assig(b, temp, args[e]);
       args[e] = synth_id_node(temp);
       tempList.push(temp);
     }
     else
       break;

     e++ ;
  }

  e = 0;
  while (e < tempList.length)
    this.scope.releaseTemp(tempList[e++]);

};      

function synth_mem_node(obj, prop, c) {
  return { type: 'MemberExpression',
           computed: c,
           object: obj,
           property: (prop) };

}

function synth_call_node(callee, argList) {
   return { type: 'CallExpression', arguments: argList, callee: callee, synth: !false };

}

var FUNC_PROTO_CALL_VAR_NAME = synth_id_node('_call'), FUNC_PROTO_CALL = synth_id_node('call');

function call_call(thisObj, callee, argList) {
   return synth_call_node(
      synth_mem_node(FUNC_PROTO_CALL_VAR_NAME, FUNC_PROTO_CALL, false),
      [synth_id_node(callee), synth_id_node(thisObj)].concat(argList)
   );
}
   
transformerList['CallExpression'] = function(n, b, vMode) {
   vMode = IS_VAL;
   var yCall = y(n);
   var yArgs = yCall - y(n.callee) ;

   if (!yCall) return n;

   var callee = n.callee;
   if (callee.type !== 'MemberExpression') {
     if (y(callee)) 
       n.callee = this.transformYield(n.callee, b, IS_VAL);

     if (yArgs) {
       var temp = this.scope.allocateTemp();
       append_assig(b, temp, n.callee);
       n.callee = synth_id_node(temp);
       this.transformCallArgs(n.arguments, b, yArgs);
       this.scope.releaseTemp(temp);
     }
     return n;
   }

   var yObj = y(callee.object);
   if (yObj)
     callee.object = this.transformYield(callee.object, b, IS_VAL);
   
   var yProp = y(callee.property);
   var objTemp = "";

   if (yProp || yArgs) {
     objTemp = this.scope.allocateTemp();
     append_assig(b, objTemp, callee.object);
     callee.object = synth_id_node(objTemp);
   }

   callee.property = this.transformYield(callee.property, b, vMode);

   var calleeTemp = "";
   if (yArgs) {
     calleeTemp = this.scope.allocateTemp();
     append_assig(b, calleeTemp, callee);
     this.transformCallArgs(n.arguments, b, yArgs);
     this.scope.releaseTemp(objTemp);
     this.scope.releaseTemp(calleeTemp);

     return call_call(objTemp, calleeTemp, n.arguments);
   }

   return n;
};           

var transformAssig = null;
transformAssig = {};

transformerList['AssignmentExpression'] = function(n, b, vMode) {
   var lefttype = n.left.type;
   this.evaluateAssignee(n.left, b, y(n));

   n.right = this.transformYield(n.right, b, IS_VAL);
   var assigValue = transformAssig[lefttype].call(this, n, b);

   switch (lefttype) {
     case 'Identifier': 
     case 'MemberExpression':
        return assigValue;

     default:
        return vMode ? assigValue : NOEXPRESSION;
   }
};

this.evaluateAssignee = function( assignee, b, yc ) {
    if (assignee.type === 'Property' || assignee.type === 'AssignmentProperty' ) {
      if (assignee.computed && y(assignee.key) ) {
        yc -= y(assignee.key);
        assignee.key = this.transformYield(assignee.key, b, IS_VAL);

        if (yc) {
          var t = this.scope.allocateTemp();
          append_assig(t, assignee.key);
          assignee.key = synth_id_node(t);
        }
      }
    }
            
    if (assignee.type === 'AssignmentPattern' )
      assignee = assignee.left;

    var e = 0;

    switch (assignee.type) {
       case 'Identifier':
          break;

       case 'ArrayPattern':
          while (e < assignee.elements.length) {
             yc = this.evaluateAssignee(assignee.elements[e], b, yc);
             e++ ;
          }
          break;

       case 'ObjectPattern':
          while (e < assignee.properties.length) {
             yc = this.evaluateAssignee(assignee.properties[e], b, yc);
             e++ ;
          }
          break ;

       case 'MemberExpression':
          var objTemp = "";
          var propTemp = "";
          var objY = y(assignee.object);
          var propY = assignee.property.computed ? y(assignee.property) : 0;

          assignee.object = this.transformYield(assignee.object, b, IS_VAL);
          yc -= objY;
          if (yc) {
            objTemp = this.scope.allocateTemp();
            append_assig( b, objTemp, assignee.object);
            assignee.object = synth_id_node(objTemp);
          }
        
          if (assignee.computed) {
            assignee.property = this.transformYield(assignee.property, b, IS_VAL);
            yc -= propY;
            if (yc) {
              propTemp = this.scope.allocateTemp();
              append_assig(b, propTemp, assignee.property );
              assignee.property = synth_id_node(propTemp);
            }   
          }
 
          break ;
    }

    return yc ;
}

var GET = synth_id_node('get');

function synth_literal_node(value) {
   return { type: 'Literal', value: value };
}

this.assigElement = function(left, right, b) {
   var defaultVal = null;

   if (left.type === 'AssignmentPattern' ) {
     var n = left;
     defaultVal = n.right;
     left = n.left;
     var defTemp = this.scope.allocateTemp();
     append_assig(b, defTemp, right);
     this.scope.releaseTemp(defTemp);
     var cond = synth_id_node(defTemp),
         ifBody = [];

     defaultVal = this.transformYield(defaultVal, ifBody, IS_VAL);
     defTemp = this.scope.allocateTemp(); // lolhehe
     append_assig(ifBody, defTemp, defaultVal);
     this.scope.releaseTemp(defTemp);
     right = synth_id_node(defTemp);
     b. push( synth_if_node(cond, ifBody ) ); 
   }
   
   return transformAssig[left.type].call(this, assig_node(left, right), b); // TODO: eliminate need for assig_node
};

transformAssig['Identifier'] = function(n, b) {
  return n;
};

transformAssig['ArrayPattern'] = function(n, b) {

  var right = n.right,
      e = 0,
      list = n.left.elements,
      temp = this.scope.allocateTemp();

  n.right = this.transformYield(n.right, b, IS_VAL);
  append_assig(b, temp, right);
  var next = synth_call_node(
              synth_mem_node(synth_id_node(temp),
              GET), [] );
  while (e < list.length) {
     var assig = this.assigElement(list[e], next, b);
     if (assig.type === 'AssignmentExpression') b. push(assig);
     e++ ;
  }

  this.scope.releaseTemp(temp);

  return synth_id_node(temp);
};

transformAssig['ObjectPattern'] = function(n, b) {
   var temp = this.scope.allocateTemp(), e = 0, list = n.left.properties; 

   append_assig(b, temp, n.right);
   
   while (e < list.length) {
      var prop = list[e];
      var k = prop.key;
      if (k.type === 'Identifier') {
         if (prop.computed) {
           if (k.synth) this.scope.releaseTemp(k.name);
         }
         else
           k = synth_literal_node(k.name);
      }
      var next = synth_call_node(
                   synth_mem_node(synth_id_node(temp), GET),
                   [k]
                 );
      var assig = this.assigElement(list[e].value, next, b);
      if (assig.type === 'AssignmentExpression') b. push(assig);
      e++ ;
   } 

   this.scope.releaseTemp(temp);
   
   return synth_id_node(temp);
};
 
transformAssig['MemberExpression'] = function(n, b) {
   var left = n.left;
   if (left.object.type === 'Identifier' && left.object.synth)
     this.scope.releaseTemp(left.object.name);

   if (left.property.type === 'Identifier' && left. property.synth)
     this.scope.releaseTemp(left.property.name);

   return n;
};

   
