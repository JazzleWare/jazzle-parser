#Early Errors

Below are the list of early error in the ECMAScript specification;

Checked ones are those that are caught by the parser:

#11.6.1.1
*IdentifierStart :: \ UnicodeEscapeSequence
**It is a Syntax Error if SV(UnicodeEscapeSequence) is none of "$", or "_", or the UTF16Encoding (10.1.1) of a code point matched by the UnicodeIDStart lexical grammar production.

*IdentifierPart :: \ UnicodeEscapeSequence
**It is a Syntax Error if SV(UnicodeEscapeSequence) is none of "$", or "_", or the UTF16Encoding (10.1.1) of either <ZWNJ> or <ZWJ>, or the UTF16Encoding of a Unicode code point that would be matched by the UnicodeIDContinue lexical grammar production.

#11.8.4.1
*UnicodeEscapeSequence :: u{ HexDigits }
**It is a Syntax Error if the MV of HexDigits > 1114111.

#11.8.5.1
*RegularExpressionFlags :: RegularExpressionFlags IdentifierPart
**It is a Syntax Error if IdentifierPart contains a Unicode escape sequence.

#12.1.1 Static Semantics: Early Errors
*BindingIdentifier : Identifier
**It is a Syntax Error if the code matched by this production is contained in strict mode code and the StringValue of Identifier is "arguments" or "eval".

* IdentifierReference : yield
*BindingIdentifier : yield
*LabelIdentifier : yield
**It is a Syntax Error if the code matched by this production is contained in strict mode code.

* IdentifierReference [Yield] : Identifier
*BindingIdentifier [Yield] : Identifier
*LabelIdentifier [Yield] : Identifier
**It is a Syntax Error if this production has a [Yield] parameter and StringValue of Identifier is "yield".

* Identifier : IdentifierName but not ReservedWord
**It is a Syntax Error if this phrase is contained in strict mode code and the StringValue of IdentifierName is: "implements", "interface", "let", "package", "private", "protected", "public", "static", or "yield".
**It is a Syntax Error if StringValue of IdentifierName is the same String value as the StringValue of any
ReservedWord except for yield.
**NOTE StringValue of IdentifierName normalizes any Unicode escape sequences in IdentifierName hence such escapes cannot be used to write an Identifier whose code point sequence is the same as a ReservedWord.

#12.2.6.1
*PropertyDefinition : MethodDefinition
**It is a Syntax Error if HasDirectSuper of MethodDefinition is true.

(_In addition to describing an actual object initializer the ObjectLiteral productions are also used as a cover grammar for ObjectAssignmentPattern (12.14.5). and may be recognized as part of a CoverParenthesizedExpressionAndArrowParameterList. When ObjectLiteral appears in a context where ObjectAssignmentPattern is required the following Early Error rules are not applied. In addition, they are not applied when initially parsing a CoverParenthesizedExpressionAndArrowParameterList._)
*PropertyDefinition : CoverInitializedName
**Always throw a Syntax Error if code matches this production.
**NOTE This production exists so that ObjectLiteral can serve as a cover grammar for ObjectAssignmentPattern (12.14.5). It cannot occur in an actual object initializer.

#12.2.8.1
*PrimaryExpression : RegularExpressionLiteral
** It is a Syntax Error if BodyText of RegularExpressionLiteral cannot be recognized using the goal symbol Pattern of the ECMAScript RegExp grammar specified in 21.2.1.
** It is a Syntax Error if FlagText of RegularExpressionLiteral contains any code points other than "g", "i", "m", "u", or "y", or if it contains the same code point more than once.

#12.2.10.1
*PrimaryExpression : CoverParenthesizedExpressionAndArrowParameterList
** It is a Syntax Error if the lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList cannot be parsed with no tokens left over using ParenthesizedExpression as the goal symbol.
** All Early Errors rules for ParenthesizedExpression and its derived productions also apply to CoveredParenthesizedExpression of CoverParenthesizedExpressionAndArrowParameterList.

#12.4.1
* PostfixExpression :
  LeftHandSideExpression++
  LeftHandSideExpression--
** It is an early Reference Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.

#12.5.1 Static Semantics: Early Errors
*UnaryExpression :
  -- UnaryExpression
  ++ UnaryExpression
** It is an early Reference Error if IsValidSimpleAssignmentTarget of UnaryExpression is false.

#12.5.4.1
* UnaryExpression : delete UnaryExpression
** It is a Syntax Error if the UnaryExpression is contained in strict mode code and the derived UnaryExpression is PrimaryExpression : IdentifierReference.
** It is a Syntax Error if the derived UnaryExpression is PrimaryExpression : CoverParenthesizedExpressionAndArrowParameterList and CoverParenthesizedExpressionAndArrowParameterList ultimately derives a phrase that, if used in place of UnaryExpression, would produce a Syntax Error according to these rules. This rule is recursively applied.
** NOTE
The last rule means that expressions such as `delete (((foo)))` produce early errors because of recursive application of the first rule.

#12.14.1 
* AssignmentExpression : LeftHandSideExpression = AssignmentExpression
** It is a Syntax Error if LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and the lexical token sequence matched by LeftHandSideExpression cannot be parsed with no tokens left over using AssignmentPattern as the goal symbol.
** It is an early Reference Error if LeftHandSideExpression is neither an ObjectLiteral nor an ArrayLiteral and IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.

*AssignmentExpression : LeftHandSideExpression AssignmentOperator AssignmentExpression
** It is an early Reference Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.

#12.14.5.1
* AssignmentProperty : IdentifierReference Initializer opt
** It is a Syntax Error if IsValidSimpleAssignmentTarget of IdentifierReference is false.

* DestructuringAssignmentTarget : LeftHandSideExpression
** It is a Syntax Error if LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and if the lexical token sequence matched by LeftHandSideExpression cannot be parsed with no tokens left over using AssignmentPattern as the goal symbol.
** It is a Syntax Error if LeftHandSideExpression is neither an ObjectLiteral nor an ArrayLiteral and IsValidSimpleAssignmentTarget(LeftHandSideExpression) is false.

#13.2.1 Static Semantics: Early Errors
* Block : { StatementList }
** It is a Syntax Error if the LexicallyDeclaredNames of StatementList contains any duplicate entries.
** It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList also occurs in the VarDeclaredNames of StatementList.

#13.3.1.1
* LexicalDeclaration : LetOrConst BindingList ;
** It is a Syntax Error if the BoundNames of BindingList contains " let " .
** It is a Syntax Error if the BoundNames of BindingList contains any duplicate entries.

* LexicalBinding : BindingIdentifier Initializer opt
** It is a Syntax Error if Initializer is not present and IsConstantDeclaration of the LexicalDeclaration containing this production is true.

#13.6.1 Static Semantics: Early Errors
* IfStatement :
  if ( Expression) Statement else Statement
  if ( Expression ) Statement
**It is a Syntax Error if IsLabelledFunction(Statement) is true.
** NOTE
It is only necessary to apply this rule if the extension specified in B.3.2 is implemented.

#13.7.1.1
*IterationStatement :
 do Statement while ( Expression ) ;
 while ( Expression ) Statement
 for ( Expression opt ; Expression opt ; Expression opt ) Statement
 for ( var VariableDeclarationList; Expression opt ; Expression opt ) Statement
 for ( LexicalDeclaration Expression opt ; Expression opt ) Statement
 for ( LeftHandSideExpression in Expression) Statement
 for ( var ForBinding in Expression ) Statement
 for ( ForDeclaration in Expression) Statement
 for ( LeftHandSideExpression of AssignmentExpression ) Statement
 for ( var ForBinding of AssignmentExpression ) Statement
 for ( ForDeclaration of AssignmentExpression ) Statement
**It is a Syntax Error if IsLabelledFunction(Statement) is true.
**NOTE
It is only necessary to apply this rule if the extension specified in B.3.2 is implemented.

#13.7.4.1
*IterationStatement : for ( LexicalDeclaration Expression opt ; Expression opt ) Statement
**It is a Syntax Error if any element of the BoundNames of LexicalDeclaration also occurs in the VarDeclaredNames of Statement.

#13.7.5.1
*IterationStatement :
 for ( LeftHandSideExpression in Expression ) Statement
 for ( LeftHandSideExpression of AssignmentExpression ) Statement
** It is a Syntax Error if LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and if the lexical token sequence matched by LeftHandSideExpression cannot be parsed with no tokens left over using AssignmentPattern as the goal symbol.

(_If LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and if the lexical token sequence matched by LeftHandSideExpression can be parsed with no tokens left over using AssignmentPattern as the goal symbol then the following rules are not applied. Instead, the Early Error rules for AssignmentPattern are used._)
** It is a Syntax Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
** It is a Syntax Error if the LeftHandSideExpression is CoverParenthesizedExpressionAndArrowParameterList : ( Expression ) and Expression derives a production that would produce a Syntax Error according to these rules if that production is substituted for LeftHandSideExpression. This rule is recursively applied.
** NOTE
The last rule means that the other rules are applied even if parentheses surround Expression.


*IterationStatement :
 for ( ForDeclaration in Expression ) Statement
 for ( ForDeclaration of AssignmentExpression ) Statement
** It is a Syntax Error if the BoundNames of ForDeclaration contains " let " .
** It is a Syntax Error if any element of the BoundNames of ForDeclaration also occurs in the VarDeclaredNames of Statement.
** It is a Syntax Error if the BoundNames of ForDeclaration contains any duplicate entries.

#13.8.1
*ContinueStatement : continue ;
*ContinueStatement : continue LabelIdentifier ;
** It is a Syntax Error if this production is not nested, directly or indirectly (but not crossing function boundaries), within an IterationStatement.

#13.9.1
*BreakStatement : break ;
** It is a Syntax Error if this production is not nested, directly or indirectly (but not crossing function boundaries), within an IterationStatement or a SwitchStatement.

#13.11.1
* WithStatement : with ( Expression ) Statement
** It is a Syntax Error if the code that matches this production is contained in strict code.
** It is a Syntax Error if IsLabelledFunction(Statement) is true.
** NOTE
** It is only necessary to apply the second rule if the extension specified in B.3.2 is implemented.

#13.12.1
*CaseBlock : { CaseClauses }
**It is a Syntax Error if the LexicallyDeclaredNames of CaseClauses contains any duplicate entries.
It is a Syntax Error if any element of the LexicallyDeclaredNames of CaseClauses also occurs in the
VarDeclaredNames of CaseClauses.

#13.13.1
* LabelledItem : FunctionDeclaration
** It is a Syntax Error if any source text matches this rule.
** NOTE
An alternative definition for this rule is provided in B.3.2.

#13.15.1
* Catch : catch ( CatchParameter ) Block
** It is a Syntax Error if BoundNames of CatchParameter contains any duplicate elements.
** It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the LexicallyDeclaredNames of Block.
** It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the VarDeclaredNames of Block.

** NOTE
An alternative static semantics for this production is given in B.3.5.

#14.1.2
*FunctionDeclaration : function BindingIdentifier ( FormalParameters ) { FunctionBody }
*FunctionDeclaration : function ( FormalParameters ) { FunctionBody }
*FunctionExpression : function BindingIdentifier opt ( FormalParameters ) { FunctionBody }
** If the source code matching this production is strict code, the Early Error rules for StrictFormalParameters : FormalParameters are applied.
** If the source code matching this production is strict code, it is a Syntax Error if BindingIdentifier is the IdentifierName eval or the IdentifierName arguments.
** It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs in the LexicallyDeclaredNames of FunctionBody.
** It is a Syntax Error if FormalParameters Contains SuperProperty is true.
** It is a Syntax Error if FunctionBody Contains SuperProperty is true.
** It is a Syntax Error if FormalParameters Contains SuperCall is true.
** It is a Syntax Error if FunctionBody Contains SuperCall is true.
** NOTE 1
The LexicallyDeclaredNames of a FunctionBody does not include identifiers bound using var or function declarations.

* StrictFormalParameters : FormalParameters
** It is a Syntax Error if BoundNames of FormalParameters contains any duplicate elements.
* FormalParameters : FormalParameterList
** It is a Syntax Error if IsSimpleParameterList of FormalParameterList is false and BoundNames of FormalParameterList contains any duplicate elements.
** NOTE 2
Multiple occurrences of the same BindingIdentifier in a FormalParameterList is only allowed for functions and generator functions which have simple parameter lists and which are not defined in strict mode code.
*FunctionBody : FunctionStatementList
** It is a Syntax Error if the LexicallyDeclaredNames of FunctionStatementList contains any duplicate entries.
** It is a Syntax Error if any element of the LexicallyDeclaredNames of FunctionStatementList also occurs in the VarDeclaredNames of FunctionStatementList.
** It is a Syntax Error if ContainsDuplicateLabels of FunctionStatementList with argument « » is true.
** It is a Syntax Error if ContainsUndefinedBreakTarget of FunctionStatementList with argument « » is true.
** It is a Syntax Error if ContainsUndefinedContinueTarget of FunctionStatementList with arguments « » and « » is true.

#14.2.1
*ArrowFunction : ArrowParameters => ConciseBody
** It is a Syntax Error if ArrowParameters Contains YieldExpression is true.
** It is a Syntax Error if ConciseBody Contains YieldExpression is true.
** It is a Syntax Error if any element of the BoundNames of ArrowParameters also occurs in the LexicallyDeclaredNames of ConciseBody.
** ArrowParameters [Yield] : CoverParenthesizedExpressionAndArrowParameterList [?Yield]
** If the [Yield] grammar parameter is present on ArrowParameters, it is a Syntax Error if the lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList [?Yield] cannot be parsed with no tokens left over using ArrowFormalParameters [Yield] as the goal symbol.
** If the [Yield] grammar parameter is not present on ArrowParameters, it is a Syntax Error if the lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList [?Yield] cannot be parsed with no tokens left over using ArrowFormalParameters as the goal symbol.
** All early errors rules for ArrowFormalParameters and its derived productions also apply to CoveredFormalsList of CoverParenthesizedExpressionAndArrowParameterList [?Yield] .

#14.3.1
* MethodDefinition : PropertyName ( StrictFormalParameters ) { FunctionBody }
** It is a Syntax Error if any element of the BoundNames of StrictFormalParameters also occurs in the LexicallyDeclaredNames of FunctionBody.
* MethodDefinition : set PropertyName ( PropertySetParameterList ){ FunctionBody }
** It is a Syntax Error if BoundNames of PropertySetParameterList contains any duplicate elements.
** It is a Syntax Error if any element of the BoundNames of PropertySetParameterList also occurs in the LexicallyDeclaredNames of FunctionBody.

#14.4.1 Static Semantics: Early Errors
*GeneratorMethod : * PropertyName ( StrictFormalParameters ) { GeneratorBody }
** It is a Syntax Error if HasDirectSuper of GeneratorMethod is true.
** It is a Syntax Error if StrictFormalParameters Contains YieldExpression is true.
** It is a Syntax Error if any element of the BoundNames of StrictFormalParameters also occurs in the LexicallyDeclaredNames of GeneratorBody.
* GeneratorDeclaration : function * BindingIdentifier ( FormalParameters ) { GeneratorBody }
** It is a Syntax Error if HasDirectSuper of GeneratorDeclaration is true.
* GeneratorExpression : function * BindingIdentifier opt ( FormalParameters ) { GeneratorBody }
** It is a Syntax Error if HasDirectSuper of GeneratorExpression is true.
* GeneratorDeclaration : function * BindingIdentifier ( FormalParameters ) { GeneratorBody }
* GeneratorExpression : function * BindingIdentifier opt ( FormalParameters ) { GeneratorBody }
** If the source code matching this production is strict code, the Early Error rules for StrictFormalParameters : FormalParameters are applied.
** If the source code matching this production is strict code, it is a Syntax Error if BindingIdentifier is the IdentifierName eval or the IdentifierName arguments.
** It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs in the LexicallyDeclaredNames of GeneratorBody.
** It is a Syntax Error if FormalParameters Contains YieldExpression is true.
** It is a Syntax Error if FormalParameters Contains SuperProperty is true.
** It is a Syntax Error if GeneratorBody Contains SuperProperty is true.

#14.5.1 Static Semantics: Early Errors
*ClassTail : ClassHeritage opt { ClassBody }
** It is a Syntax Error if ClassHeritage is not present and the following algorithm evaluates to true:
   1.Let constructor be ConstructorMethod of ClassBody.
   2.If constructor is empty, return false.
   3.Return HasDirectSuper of constructor.

*ClassBody : ClassElementList
** It is a Syntax Error if PrototypePropertyNameList of ClassElementList contains more than one occurrence of " constructor " .
* ClassElement : MethodDefinition
** It is a Syntax Error if PropName of MethodDefinition is not " constructor " and HasDirectSuper of MethodDefinition is true.
** It is a Syntax Error if PropName of MethodDefinition is " constructor " and SpecialMethod of MethodDefinition is true.
*ClassElement : static MethodDefinition
** It is a Syntax Error if HasDirectSuper of MethodDefinition is true.
** It is a Syntax Error if PropName of MethodDefinition is " prototype " .

#15.1.1 Static Semantics: Early Errors
* Script : ScriptBody
** It is a Syntax Error if the LexicallyDeclaredNames of ScriptBody contains any duplicate entries.
** It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList also occurs in the VarDeclaredNames of ScriptBody.
* ScriptBody : StatementList
** It is a Syntax Error if StatementList Contains super unless the source code containing super is eval code that is being processed by a direct eval that is contained in function code that is not the function code of an ArrowFunction.
** It is a Syntax Error if StatementList Contains NewTarget unless the source code containing NewTarget is eval code that is being processed by a direct eval that is contained in function code that is not the function code of an ArrowFunction.
** It is a Syntax Error if ContainsDuplicateLabels of StatementList with argument « » is true.
** It is a Syntax Error if ContainsUndefinedBreakTarget of StatementList with argument « » is true.
** It is a Syntax Error if ContainsUndefinedContinueTarget of StatementList with arguments « » and « » is true.

#15.2.1.1
* ModuleBody : ModuleItemList
** It is a Syntax Error if the LexicallyDeclaredNames of ModuleItemList contains any duplicate entries.
** It is a Syntax Error if any element of the LexicallyDeclaredNames of ModuleItemList also occurs in the VarDeclaredNames of ModuleItemList.
** It is a Syntax Error if the ExportedNames of ModuleItemList contains any duplicate entries.
** It is a Syntax Error if any element of the ExportedBindings of ModuleItemList does not also occur in either the VarDeclaredNames of ModuleItemList, or the LexicallyDeclaredNames of ModuleItemList.
** It is a Syntax Error if ModuleItemList Contains super.
** It is a Syntax Error if ModuleItemList Contains NewTarget
** It is a Syntax Error if ContainsDuplicateLabels of ModuleItemList with argument « » is true.
** It is a Syntax Error if ContainsUndefinedBreakTarget of ModuleItemList with argument « » is true.
** It is a Syntax Error if ContainsUndefinedContinueTarget of ModuleItemList with arguments « » and « » is true.
** NOTE
The duplicate ExportedNames rule implies that multiple export default ExportDeclaration items within a ModuleBody is a Syntax Error. Additional error conditions relating to conflicting or duplicate declarations are checked during module linking prior to evaluation of a Module. If any such errors are detected the Module is not
evaluated.

#15.2.2.1
*ModuleItem : ImportDeclaration
**It is a Syntax Error if the BoundNames of ImportDeclaration contains any duplicate entries.

#15.2.3.1
*ExportDeclaration : export ExportClause ;
** For each IdentifierName n in ReferencedBindings of ExportClause: It is a Syntax Error if StringValue of n is a ReservedWord or if the StringValue of n is one of: "implements", "interface", "let", "package", "private", "protected", "public", "static", or "yield".
** NOTE
The above rule means that each ReferencedBindings of ExportClause is treated as an IdentifierReference.

#21.2.1.1
*RegExpUnicodeEscapeSequence :: u{ HexDigits }
** It is a Syntax Error if the MV of HexDigits > 1114111.

#B.3.1
(_ __proto__ Property Names in Object Initializers_)
*The following Early Error rule is added to those in 12.2.6.1:
 ObjectLiteral : { PropertyDefinitionList }
 ObjectLiteral : { PropertyDefinitionList , }
** It is a Syntax Error if PropertyNameList of PropertyDefinitionList contains any duplicate entries for "__proto__" and at least two of those entries were obtained from productions of the form PropertyDefinition : PropertyName : AssignmentExpression.
**NOTE The List returned by PropertyNameList does not include string literal property names defined as using a
ComputedPropertyName.

#B.3.2
(_ Labelled Function Declarations_)

*Prior to ECMAScript 2015, the specification of LabelledStatement did not allow for the association of a statement label with a FunctionDeclaration. However, a labelled FunctionDeclaration was an allowable extension for non- strict code and most browser-hosted ECMAScript implementations supported that extension. In ECMAScript 2015, the grammar productions for LabelledStatement permits use of FunctionDeclaration as a LabelledItem but 13.13.1 includes an Early Error rule that produces a Syntax Error if that occurs. For web browser compatibility, that rule is modified with the addition of the underlined text:
** It is a Syntax Error if any strict mode source code matches this rule.

11.6: In ECMAScript 2015, the valid code points for an IdentifierName are specified in terms of the Unicode properties “ID_Start” and “ID_Continue”. In previous editions, the valid IdentifierName or Identifier code points were specified by enumerating various Unicode code point categories.

11.9.1: In ECMAScript 2015, Automatic Semicolon Insertion adds a semicolon at the end of a do-while statement if the semicolon is missing. This change aligns the specification with the actual behaviour of most existing implementations.

12.2.6.1: In ECMAScript 2015, it is no longer an early error to have duplicate property names in Object Initializers.

12.14.1: In ECMAScript 2015, strict mode code containing an assignment to an immutable binding such as the function name of a FunctionExpression does not produce an early error. Instead it produces a runtime error.

13.5: In ECMAScript 2015, a StatementListItem beginning with the token let followed by the token [ is the start of a LexicalDeclaration. In previous editions such a sequence would be the start of an ExpressionStatement.

13.7: In ECMAScript 2015, if the ( token of a for statement is immediately followed by the token sequence let [ then the let is treated as the start of a LexicalDeclaration. In previous editions such a token sequence would be the start of an Expression.

13.7: In ECMAScript 2015, if the ( token of a for-in statement is immediately followed by the token sequence let [ then the let is treated as the start of a ForDeclaration. In previous editions such a token sequence would be the start of an LeftHandSideExpression.

13.7: Prior to ECMAScript 2015, an initialization expression could appear as part of the VariableDeclaration that precedes the in keyword. The value of that expression was always discarded. In ECMAScript 2015, the ForBind in that same position does not allow the occurrence of such an initializer.

13.15: In ECMAScript 2015, it is an early error for a Catch clause to contained a var declaration for the same Identifier that appears as the Catch clause parameter. In previous editions, such a variable declaration would be instantiated in the enclosing variable environment but the declaration’s Initializer value would be assigned to the Catch parameter.

13.15, 18.2.1.2: In ECMAScript 2015, a runtime SyntaxError is thrown if a Catch clause evaluates a non-strict direct eval whose eval code includes a var or FunctionDeclaration declaration that binds the same Identifier that appears as the Catch clause parameter.
