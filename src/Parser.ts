import AST, { BinaryExpression, BlockStatement, BooleanLiteral, Expression, ExpressionStatement, FunctionExpression, Identifier, IfExpression, Literal, NumericLiteral, Statement, StringLiteral, TakeStatement, TypedArgument, TypeExpression } from './AST';
import { SaeError, SaeSyntaxError } from './Error'
import { Token, TokenDetails, Tokenizer } from './Tokenizer'

function optional<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch (e) {
    if (e instanceof SaeError) {
      return null;
    }

    throw e;
  }
}

function either<T>(...fns: Array<() => T>): T | null {
  for (const fn of fns) {
    const value = optional(fn);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

export class Parser {
  private _lookahead: TokenDetails = null
  private _string = '';
  private _tokenizer = new Tokenizer();

  /**
   * Parses a string into an AST.
   */
  parse(str: string): AST {
    this._string = str;
    this._tokenizer.init(str);

    this._lookahead = this._tokenizer.getNextToken();

    return this.Program();
  }

  /**
   * Main entry point.
   *
   * Program
   *   : StatementList
   *   ;
   */
  Program(): AST {
    return {
      type: 'Program',
      body: this.StatementList()
    }
  }

  /**
   * StatementList
   *   : Statement
   *   | StatementList Statement -> Statement Statement Statement Statement
   *   ;
   */
  StatementList(stopLookahead: string = null): Statement[] {
    const statementList = [this.Statement()];
    while (this._lookahead.token != null && this._lookahead.token.type !== stopLookahead) {
      statementList.push(this.Statement());
    }

    return statementList;
  }

  /**
   * Statement
   *   : ExpressionStatement
   *   | BlockStatement
   *   | EmptyStatement
   *   | VariableStatement
   *   | IfStatement
   *   | IterationStatement
   *   | BreakStatement
   *   | ContinueStatement
   *   | FunctionDeclaration
   *   | ReturnStatement
   *   | ClassDeclaration
   *   ;
   */
  Statement(): Statement {
    switch (this._lookahead.token.type) {
      case ';': return this.EmptyStatement()
      case '{': return this.BlockStatement()
      case 'take': return this.TakeStatement()
      case 'if': return this.IfExpression()
      default: return this.ExpressionStatement()
    }
  }

  TakeStatement(): TakeStatement {
    this._eat('take');
    const out: TakeStatement = {
      type: 'TakeStatement',
      value: this.Expression()
    }
    this._eat(';')
    return out;
  }

  /**
   * ClassDeclaration
   *   : 'class' Identifier OptClassExtends BlockStatement
   *   ;
   */
  ClassDeclaration() {
    // Implement here...
  }

  /**
   * ClassExtends
   *   : 'extends' Identifier
   *   ;
   */
  ClassExtends() {
    // Implement here...
  }

  /**
   * FunctionDeclaration
   *   : 'def' Identifier '(' OptFormalParameterList ')' BlockStatement
   *   ;
   */
  FunctionExpression(): FunctionExpression {
    this._eat('fn');
    const { name } = optional(() => this.Identifier());
    this._eat('(');
    const params = this.FormalParameterList();
    this._eat(')')
    const retType = this.TypeExpression(false);
    const block = this.BlockStatement();

    return {
      type: 'FunctionExpression',
      arguments: params,
      name: name,
      body: block,
      returnType: retType
    }
  }

  TypeExpression(required = true): TypeExpression | null {
    try {
      return {
        genericTypes: [],
        implements: [],
        rootModule: 'main',
        name: this.Identifier().name,
        submodules: []
      }
    } catch (e) {
      if (required) {
        throw e;
      }

      return null;
    }
  }

  /**
   * FormalParameterList
   *   : Identifier
   *   | FormalParameterList ',' Identifier
   *   ;
   */
  FormalParameterList(): TypedArgument[] {
    const params: TypedArgument[] = [];

    while (this._lookahead.token.type === 'identifier') {
      params.push({
        type: 'TypedArgument',
        mutable: false,
        name: this.Identifier().name,
        argType: this.TypeExpression()
      });

      try {
        this._eat(',')
      } catch {
        break;
      }
    }

    return params;
  }

  /**
   * ReturnStatement
   *   : 'return' OptExpression ';'
   *   ;
   */
  ReturnStatement() {
    // Implement here...
  }

  /**
   * IterationStatement
   *   : WhileStatement
   *   | DoWhileStatement
   *   | ForStatement
   *   ;
   */
  IterationStatement() {
    switch (this._lookahead.token.type) {
      case 'while':
        return this.WhileStatement();
      case 'do':
        return this.DoWhileStatement();
      case 'for':
        return this.ForStatement();
    }
  }

  /**
   * WhileStatement
   *  : 'while' '(' Expression ')' Statement
   *  ;
   */
  WhileStatement() {
    // Implement here...
  }

  /**
   * DoWhileStatement
   *   : 'do' Statement 'while' '(' Expression ')' ';'
   */
  DoWhileStatement() {
    // Implement here...
  }

  /**
   * ForStatement
   *   : 'for' '(' OptForStatementInit ';' OptExpression ';' OptExpression ')' Statement
   *   ;
   */
  ForStatement() {
    // Implement here...
  }

  /**
   * ForStatementInit
   *   : VariableStatementInit
   *   | Expression
   *   ;
   */
  ForStatementInit() {
    // Implement here...
  }

  /**
   * BreakStatement
   *   : 'break' ';'
   *   ;
   */
  BreakStatement() {
    this._eat('break');
    this._eat(';');
    return {
      type: 'BreakStatement',
    };
  }

  /**
   * ContinueStatement
   *   : 'continue' ';'
   *   ;
   */
  ContinueStatement() {
    this._eat('continue');
    this._eat(';');
    return {
      type: 'ContinueStatement',
    };
  }

  /**
   * IfExpression
   *   : 'if' '(' Expression ')' BlockStatement
   *   | 'if' '(' Expression ')' BlockStatement 'else' BlockStatement
   *   ;
   */
  IfExpression(): IfExpression {
    this._eat('if');
    const conditionExpr = this.Expression();
    const block = this.BlockStatement();
    const otherwise = !!optional(() => this._eat('else')) ? this.BlockStatement() : null;

    return {
      type: 'IfExpression',
      condition: conditionExpr,
      then: block,
      else: otherwise
    }
  }

  /**
   * VariableStatementInit
   *   : 'let' VariableDeclarationList
   *   ;
   */
  VariableStatementInit() {
    // Implement here...
  }

  /**
   * VariableStatement
   *   : VariableStatementInit ';'
   *   ;
   */
  VariableStatement() {
    const variableStatement = this.VariableStatementInit();
    this._eat(';');
    return variableStatement;
  }

  /**
   * VariableDeclarationList
   *   : VariableDeclaration
   *   | VariableDeclarationList ',' VariableDeclaration
   *   ;
   */
  VariableDeclarationList() {
    // Implement here...
  }

  /**
   * VariableDeclaration
   *   : Identifier OptVariableInitializer
   *   ;
   */
  VariableDeclaration() {
    // Implement here...
  }

  /**
   * VariableInitializer
   *   : SIMPLE_ASSIGN AssignmentExpression
   *   ;
   */
  VariableInitializer() {
    this._eat('SIMPLE_ASSIGN');
    return this.AssignmentExpression();
  }

  /**
   * EmptyStatement
   *   : ';'
   *   ;
   */
  EmptyStatement(): Statement {
    this._eat(';');
    return {
      type: 'EmptyStatement',
    };
  }

  /**
   * BlockStatement
   *   : '{' OptStatementList '}'
   *   ;
   */
  BlockStatement(): BlockStatement {
    this._eat('{');
    const body = this._lookahead.token.type !== '}' ? this.StatementList('}') : [];
    this._eat('}');
    return {
      type: 'BlockStatement',
      body
    }
  }

  /**
   * ExpressionStatement
   *   : Expression ';'
   *   ;
   */
  ExpressionStatement(): ExpressionStatement {
    const expr = this.Expression();
    this._eat(';');

    return {
      type: 'ExpressionStatement',
      expression: expr
    }
  }

  /**
   * Expression
   *   : AssignmentExpression
   *   ;
   */
  Expression(): Expression {
    switch (this._lookahead.token.type) {
      case 'if': return this.IfExpression()
      case 'identifier': return this.Identifier()
      default:
        return this.AdditiveExpression();
    }
  }

  /**
   * AssignmentExpression
   *   : LogicalORExpression
   *   | LeftHandSideExpression AssignmentOperator AssignmentExpression
   *   ;
   */
  AssignmentExpression() {
    // Implement here...
  }

  /**
   * Identifier
   *   : IDENTIFIER
   *   ;
   */
  Identifier(): Identifier {
    const name = this._eat('identifier').value;
    return {
      type: 'Identifier',
      name,
    };
  }

  /**
   * Extra check whether it's valid assignment target.
   */
  _checkValidAssignmentTarget(node) {
    if (node.type === 'Identifier' || node.type === 'MemberExpression') {
      return node;
    }
    throw new SyntaxError('Invalid left-hand side in assignment expression');
  }

  /**
   * Whether the token is an assignment operator.
   */
  _isAssignmentOperator(tokenType) {
    return tokenType === 'SIMPLE_ASSIGN' || tokenType === 'COMPLEX_ASSIGN';
  }

  /**
   * AssignmentOperator
   *   : SIMPLE_ASSIGN
   *   | COMPLEX_ASSIGN
   *   ;
   */
  AssignmentOperator() {
    if (this._lookahead.token.type === 'SIMPLE_ASSIGN') {
      return this._eat('SIMPLE_ASSIGN');
    }
    return this._eat('COMPLEX_ASSIGN');
  }

  /**
   * Logical OR expression.
   *
   *   x || y
   *
   * LogicalORExpression
   *   : LogicalORExpression
   *   | LogicalORExpression LOGICAL_OR LogicalANDExpression
   *   ;
   */
  LogicalORExpression() {
    // Implement here...
  }

  /**
   * Logical AND expression.
   *
   *   x && y
   *
   * LogicalANDExpression
   *   : EqualityExpression
   *   | LogicalANDExpression LOGICAL_AND EqualityExpression
   *   ;
   */
  LogicalANDExpression() {
    // Implement here...
  }

  /**
   * EQUALITY_OPERATOR: ==, !=
   *
   *   x == y
   *   x != y
   *
   * EqualityExpression
   *   : RelationalExpression
   *   | EqualityExpression EQUALITY_OPERATOR RelationalExpression
   *   ;
   */
  EqualityExpression() {
    // Implement here...
  }

  /**
   * RELATIONAL_OPERATOR: >, >=, <, <=
   *
   *   x > y
   *   x >= y
   *   x < y
   *   x <= y
   *
   * RelationalExpression
   *   : AdditiveExpression
   *   | RelationalExpression RELATIONAL_OPERATOR AdditiveExpression
   *   ;
   */
  RelationalExpression() {
    // Implement here...
  }

  /**
   * AdditiveExpression
   *   : MultiplicativeExpression
   *   | AdditiveExpression ADDITIVE_OPERATOR MultiplicativeExpression
   *   ;
   */
  AdditiveExpression(): BinaryExpression {
    return this._BinaryExpression(
      'MultiplicativeExpression',
      'additive_operator'
    )
  }

  /**
   * MultiplicativeExpression
   *   : UnaryExpression
   *   | MultiplicativeExpression MULTIPLICATIVE_OPERATOR UnaryExpression
   *   ;
   */
  MultiplicativeExpression(): BinaryExpression {
    return this._BinaryExpression(
      'PrimaryExpression',
      'multiplicative_operator'
    );
  }

  /**
   * Generic helper for LogicalExpression nodes.
   */
  _LogicalExpression(builderName, operatorToken) {
    // Implement here...
  }

  /**
   * Generic binary expression.
   */
  _BinaryExpression(builderName, operatorToken): BinaryExpression {
    let left = this[builderName]();

    while (this._lookahead.token && this._lookahead.token.type === operatorToken) {
      const operator = this._eat(operatorToken).value;

      const right = this[builderName]();

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  /**
   * UnaryExpression
   *   : LeftHandSideExpression
   *   | ADDITIVE_OPERATOR UnaryExpression
   *   | LOGICAL_NOT UnaryExpression
   *   ;
   */
  UnaryExpression() {
    // Implement here...
  }

  /**
   * LeftHandSideExpression
   *   : CallMemberExpression
   *   ;
   */
  LeftHandSideExpression() {
    return this.CallMemberExpression();
  }

  /**
   * CallMemberExpression
   *   : MemberExpression
   *   | CallExpression
   *   ;
   */
  CallMemberExpression() {
    // Implement here...
  }

  /**
   * Generic call expression helper.
   *
   * CallExpression
   *   : Callee Arguments
   *   ;
   *
   * Callee
   *   : MemberExpression
   *   | Super
   *   | CallExpression
   *   ;
   */
  _CallExpression(callee) {
    // Implement here...
  }

  /**
   * Arguments
   *   : '(' OptArgumentList ')'
   *   ;
   */
  Arguments() {
    // Implement here...
  }

  /**
   * ArgumentList
   *   : AssignmentExpression
   *   | ArgumentList ',' AssignmentExpression
   *   ;
   */
  ArgumentList() {
    // Implement here...
  }

  /**
   * MemberExpression
   *   : PrimaryExpression
   *   | MemberExpression '.' Identifier
   *   | MemberExpression '[' Expression ']'
   *   ;
   */
  MemberExpression() {
    // Implement here...
  }

  /**
   * PrimaryExpression
   *   : Literal
   *   | ParenthesizedExpression
   *   | Identifier
   *   | ThisExpression
   *   | NewExpression
   *   ;
   */
  PrimaryExpression(): Expression {
    switch (this._lookahead.token.type) {
      case '(':
        return this.ParenthesizedExpression();
      default:
        return this.Literal();
    }
  }

  /**
   * NewExpression
   *   : 'new' MemberExpression Arguments
   *   ;
   */
  NewExpression() {
    // Implement here...
  }

  /**
   * ThisExpression
   *   : 'this'
   *   ;
   */
  ThisExpression() {
    this._eat('this');
    return {
      type: 'ThisExpression',
    };
  }

  /**
   * Super
   *   : 'super'
   *   ;
   */
  Super() {
    // Implement here...
  }

  /**
   * Whether the token is a literal.
   */
  _isLiteral(tokenType) {
    // Implement here...
  }

  /**
   * ParenthesizedExpression
   *   : '(' Expression ')'
   *   ;
   */
  ParenthesizedExpression() {
    this._eat('(');
    const expr = this.Expression();
    this._eat(')');
    return expr;
  }

  /**
   * Literal
   *   : NumericLiteral
   *   | StringLiteral
   *   | BooleanLiteral
   *   | NullLiteral
   *   ;
   */
  Literal(): Literal {
    switch (this._lookahead.token.type) {
      case 'number':
        return this.NumericLiteral();
      case 'string':
        return this.StringLiteral();
      case 'bool':
        return this.BooleanLiteral(Boolean(this._lookahead.token.value));
    }
  }

  /**
   * BooleanLiteral
   *   : 'true'
   *   | 'false'
   *   ;
   */
  BooleanLiteral(value): BooleanLiteral {
    this._eat(value ? 'true' : 'false');
    return {
      type: 'BooleanLiteral',
      value,
    };
  }

  /**
   * NullLiteral
   *   : 'null'
   *   ;
   */
  NullLiteral() {
    // Implement here...
  }

  /**
   * StringLiteral
   *   : STRING
   *   ;
   */
  StringLiteral(): StringLiteral {
    const token = this._eat('string');
    return {
      type: 'StringLiteral',
      value: token.value.slice(1, -1),
    };
  }

  /**
   * NumericLiteral
   *   : NUMBER
   *   ;
   */
  NumericLiteral(): NumericLiteral {
    const token = this._eat('number');
    return {
      type: 'NumericLiteral',
      value: Number(token.value),
    };
  }

  /**
   * Expects a token of a given type.
   */
  _eat(tokenType: string): Token {
    const token = this._lookahead?.token;

    if (!token) {
      throw new SaeSyntaxError(`Unexpected end of input, expected: "${tokenType}"`, this._lookahead);
    }

    if (token.type != tokenType) {
      throw new SaeSyntaxError(`Unexpected token "${token.value}", expected "${tokenType}"`, this._lookahead);
    }

    this._lookahead = this._tokenizer.getNextToken();
    return token;
  }
}