import AST, { AssignmentStatement, BinaryExpression, BlockExpression, BooleanLiteral, BreakStatement, ContinueStatement, DeferStatement, Expression, ExpressionStatement, FireStatement, FunctionCall, FunctionExpression, Identifier, IfExpression, IndexExpression, Literal, LoopExpression, LoopOverExpression, MemberExpression, NumericLiteral, ReturnStatement, Statement, StringLiteral, TakeStatement, Type, TypedArgument, TypeExpression, VariableDeclarationStatement } from './AST';
import { TypeEmpty } from './ASTUtils';
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

  private _lookaheadForwards(steps: number = 1): TokenDetails | null {
    let tokenizer = new Tokenizer()
    tokenizer._cursor = this._tokenizer._cursor
    tokenizer._string = this._tokenizer._string


    for (let i = 0; i < steps - 1; i++) {
      tokenizer.getNextToken();
    }

    return tokenizer.getNextToken()
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
   *   | BlockExpression
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
    const isPublic = !!optional(() => this._eat('pub'))

    switch (this._lookahead.token.type) {
      case ';': return this.EmptyStatement()
      case '{': return this.BlockExpression()
      case 'take': return this.TakeStatement()
      case 'if': return this.IfExpression()
      case 'fn': return this.FunctionExpression(isPublic)
      case 'loop_over': return this.LoopOverExpression()
      case 'loop': return this.LoopExpression()
      case 'return': return this.ReturnStatement()
      case 'fire': return this.FireStatement()
      case 'continue': return this.ContinueStatement()
      case 'break': return this.BreakStatement()
      case 'defer': return this.DeferStatement()
      case 'let_mut': // fallthrough
      case 'let': return this.VariableDeclarationStatement(isPublic)
      case 'identifier':
        if (['simple_assign', 'complex_assign'].includes(this._lookaheadForwards().token?.type)) {
          return this.AssignmentStatement()
        } // fallthrough
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

  IndexExpression(expr: Expression): IndexExpression {
    this._eat('[');
    const index = this.Expression();
    this._eat(']');

    return {
      type: 'IndexExpression',
      expression: expr,
      index
    }
  }

  FunctionCall(func: Expression): FunctionCall {
    const params = []
    this._eat('(')

    const firstParam = optional(() => this.Expression());
    if (firstParam) {
      params.push(firstParam);
    }

    while (this._lookahead.token.type !== ')') {
      this._eat(',');
      params.push(this.Expression())
    }
    this._eat(')')

    return {
      type: 'FunctionCall',
      expression: func,
      params
    }
  }


  FunctionExpression(isPublic = false): FunctionExpression {
    this._eat('fn');
    const identifier = optional(() => this.Identifier());
    this._eat('(');
    const params = this.FormalParameterList();
    this._eat(')')
    const retType = this._Type(false) || TypeEmpty();
    const block = this.BlockExpression();

    return {
      type: 'FunctionExpression',
      arguments: params,
      name: identifier ? identifier.name : null,
      body: block,
      returnType: retType,
      public: isPublic
    }
  }

  private _Type(required = true): Type {
    try {
      const t = this._eat('primitive')
      return {
        type: 'PrimitiveType',
        value: t.value,
      }
    } catch (e) {
      return this.TypeExpression(required)
    }
  }

  TypeExpression(required = true): TypeExpression {
    try {
      return {
        type: 'TypeExpression',
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

    while (this._lookahead.token.type === 'identifier' || this._lookahead.token.type === 'primitive') {
      const name = this.Identifier().name;
      const argType = this._Type()
      params.push({
        type: 'TypedArgument',
        mutable: false,
        name,
        argType,
      })

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
  ReturnStatement(): ReturnStatement {
    this._eat('return');
    const expr = this.Expression();

    if (!['IfExpression', 'FunctionExpression'].includes(expr.type)) {
      this._eat(';')
    }

    return {
      type: 'ReturnStatement',
      value: expr
    }
  }

  BreakStatement(): BreakStatement {
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
  ContinueStatement(): ContinueStatement {
    this._eat('continue');
    this._eat(';');
    return {
      type: 'ContinueStatement',
    };
  }

  /**
   * IfExpression
   *   : 'if' '(' Expression ')' BlockExpression
   *   | 'if' '(' Expression ')' BlockExpression 'else' BlockExpression
   *   ;
   */
  IfExpression(): IfExpression {
    this._eat('if');
    const conditionExpr = this.Expression();
    let block = this.Expression();
    if (block.type !== 'BlockExpression') {
      block = {
        type: 'BlockExpression',
        body: [{
          type: 'TakeStatement',
          value: block
        }]
      }
    }

    let otherwise = !!optional(() => this._eat('else')) ? this.Expression() : null;
    if (otherwise !== null && otherwise.type !== 'BlockExpression') {
      otherwise = {
        type: 'BlockExpression',
        body: [{
          type: 'TakeStatement',
          value: otherwise
        }]
      }
    }

    return {
      type: 'IfExpression',
      condition: conditionExpr,
      then: block,
      else: otherwise as BlockExpression | null
    }
  }

  /**
   * VariableInitializer
   *   : SIMPLE_ASSIGN AssignmentExpression
   *   ;
   */
  VariableInitializer() {
    this._eat('SIMPLE_ASSIGN');
    return this.AssignmentStatement();
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

  FireStatement(): FireStatement {
    this._eat('fire')
    const func = this.Expression()
    if (func.type !== 'FunctionCall') {
      throw new SaeSyntaxError('Expected FunctionCall but got ' + func.type, this._lookahead)
    }
    this._eat(';')

    return {
      type: 'FireStatement',
      functionCall: func
    }
  }

  DeferStatement(): DeferStatement {
    this._eat('defer')
    const stmt = this.Statement();

    return {
      type: 'DeferStatement',
      stmt
    }
  }

  /**
   * BlockExpression
   *   : '{' OptStatementList '}'
   *   ;
   */
  BlockExpression(): BlockExpression {
    this._eat('{');
    const body = this._lookahead.token.type !== '}' ? this.StatementList('}') : [];
    this._eat('}');
    return {
      type: 'BlockExpression',
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


  Expression(): Expression {
    switch (this._lookahead.token.type) {
      default:
        return this.LogicalMiscExpression();
    }
  }

  VariableDeclarationStatement(isPublic = false): VariableDeclarationStatement {
    const mutable = either(() => this._eat('let_mut'), () => this._eat('let')).type === 'let_mut';
    const identifier = this.Identifier()

    const type: Type | null = this._Type(false);

    let initializer: Expression | null = null;
    if (optional(() => this._eat('simple_assign'))) {
      initializer = this.Expression();
    }
    this._eat(';');

    if (initializer?.type === 'FunctionExpression' && initializer.name === null) {
      initializer.name = identifier.name;
    }

    return {
      type: 'VariableDeclarationStatement',
      left: identifier,
      right: initializer,
      ttype: type,
      mutable,
      public: isPublic
    }
  }

  AssignmentStatement(): AssignmentStatement {
    const identifier = this.Identifier()
    const assignmentOperator = either(() => this._eat('simple_assign'), () => this._eat('complex_assign'))
    const expression = this.Expression();
    this._eat(';');

    return {
      left: identifier,
      operator: assignmentOperator.value,
      right: expression,
      type: 'AssignmentStatement',
    }
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
   * Logical OR expression.
   *
   *   x || y
   *
   * LogicalORExpression
   *   : LogicalORExpression
   *   | LogicalORExpression LOGICAL_OR LogicalANDExpression
   *   ;
   */
  LogicalMiscExpression() {
    return this._BinaryExpression(
      () => this.LogicalORExpression(),
      'logical_misc_operator'
    )
  }

  LogicalORExpression() {
    return this._BinaryExpression(
      () => this.LogicalANDExpression(),
      'logical_or_operator'
    )
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
    return this._BinaryExpression(
      () => this.EqualityExpression(),
      'logical_and_operator'
    )
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
    return this._BinaryExpression(
      () => this.RelationalExpression(),
      'equality_operator'
    )
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
  RelationalExpression(): Expression {
    return this._BinaryExpression(
      () => this.AdditiveExpression(),
      'relational_operator'
    )
  }

  /**
   * AdditiveExpression
   *   : MultiplicativeExpression
   *   | AdditiveExpression ADDITIVE_OPERATOR MultiplicativeExpression
   *   ;
   */
  AdditiveExpression(): Expression {
    return this._BinaryExpression(
      () => this.MultiplicativeExpression(),
      'additive_operator'
    )
  }

  /**
   * MultiplicativeExpression
   *   : UnaryExpression
   *   | MultiplicativeExpression MULTIPLICATIVE_OPERATOR UnaryExpression
   *   ;
   */
  MultiplicativeExpression(): Expression {
    return this._BinaryExpression(
      () => this.PrimaryExpression(),
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
  _BinaryExpression(getExpression: () => Expression, operatorToken: string): Expression {
    let left = getExpression();

    while (this._lookahead.token && this._lookahead.token.type === operatorToken) {
      const operator = this._eat(operatorToken).value;

      const right = getExpression();

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
  MemberExpression(expr: Expression): MemberExpression {
    this._eat('.')
    const identifier = this.Identifier()
    return {
      type: 'MemberExpression',
      expression: expr,
      property: identifier
    }
    // Implement here...
  }

  LoopExpression(): LoopExpression {
    this._eat('loop')
    const saeTrue: BooleanLiteral = {
      type: 'BooleanLiteral',
      value: true
    };

    let condition: Expression = this.Expression();
    let body: BlockExpression;

    // loop {} should be interpreted as loop true {}
    if (condition.type === 'BlockExpression' && this._lookahead?.token?.type !== '{') {
      body = condition;
      condition = saeTrue;
    } else {
      body = this.BlockExpression();
    }


    return {
      type: 'LoopExpression',
      body,
      condition
    }
  }

  LoopOverExpression(): LoopOverExpression {
    this._eat('loop_over')
    const iterable = this.Expression()
    const alias = optional(() => {
      this._eat('as')
      return this.Identifier()
    }) || {
      type: 'Identifier',
      name: 'it'
    }

    const body = this.BlockExpression();
    return {
      type: 'LoopOverExpression',
      body,
      alias,
      iterable
    }
  }

  PrimaryExpression(): Expression {
    const isPublic = !!optional(() => this._eat('pub'))

    let expr: Expression
    switch (this._lookahead.token.type) {
      case '(': expr = this.ParenthesizedExpression(); break
      case '{': expr = this.BlockExpression(); break
      case 'if': expr = this.IfExpression(); break
      case 'identifier': expr = this.Identifier(); break
      case 'fn': expr = this.FunctionExpression(isPublic); break
      case 'loop_over': expr = this.LoopOverExpression(); break
      case 'loop': expr = this.LoopExpression(); break
      default:
        expr = this.Literal();
    }

    while (['.', '('].includes(this._lookahead?.token?.type)) {
      switch (this._lookahead?.token?.type) {
        case '.':
          expr = this.MemberExpression(expr)
          break
        case '(':
          expr = this.FunctionCall(expr)
          break
      }
    }

    return expr;
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
        return this.BooleanLiteral();
    }
  }

  BooleanLiteral(): BooleanLiteral {
    const value = this._eat('bool').value === 'true'
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