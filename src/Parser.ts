import AST, { AssignmentStatement, BinaryExpression, BlockExpression, BooleanLiteral, BreakStatement, ContinueStatement, DeferStatement, Expression, ExpressionStatement, FireStatement, FunctionCall, FunctionExpression, Identifier, IfExpression, IndexExpression, Literal, LoopStatement, LoopOverStatement, MemberExpression, NumericLiteral, ReturnStatement, Statement, StringLiteral, TakeStatement, Type, TypedArgument, TypeExpression, VariableDeclarationStatement, Component, IfStatement, BlockStatement, TypeStruct, StructDeclarationStatement, StructConstructorExpression, StructConstructorNamedFieldAssignment } from './AST';
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
    const self: AST = {
      type: 'Program',
      body: null
    }

    self.body = this.StatementList(self, null)

    return self;
  }

  /**
   * StatementList
   *   : Statement
   *   | StatementList Statement -> Statement Statement Statement Statement
   *   ;
   */
  StatementList(parent: Component, stopLookahead: string = null): Statement[] {
    const statementList = [this.Statement(parent)];
    while (this._lookahead.token != null && this._lookahead.token.type !== stopLookahead) {
      statementList.push(this.Statement(parent));
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
  Statement(parent: Component): Statement {
    const isPublic = !!optional(() => this._eat('pub'))

    switch (this._lookahead.token.type) {
      case ';': return this.EmptyStatement(parent)
      case '{': return this.BlockStatement(parent)
      case 'take': return this.TakeStatement(parent)
      case 'if': return this.IfStatement(parent)
      case 'fn': return this.FunctionExpression(parent, isPublic)
      case 'loop_over': return this.LoopOverStatement(parent)
      case 'loop': return this.LoopStatement(parent)
      case 'return': return this.ReturnStatement(parent)
      case 'fire': return this.FireStatement(parent)
      case 'continue': return this.ContinueStatement(parent)
      case 'break': return this.BreakStatement(parent)
      case 'defer': return this.DeferStatement(parent)
      case 'struct': return this.StructDeclarationStatement(parent)
      case 'let_mut': // fallthrough
      case 'let': return this.VariableDeclarationStatement(parent, isPublic)
      case 'identifier':
        if (['simple_assign', 'complex_assign'].includes(this._lookaheadForwards().token?.type)) {
          return this.AssignmentStatement(parent)
        } // fallthrough
      default: return this.ExpressionStatement(parent)
    }
  }

  TakeStatement(parent: Component): TakeStatement {
    this._eat('take');
    const out: TakeStatement = {
      type: 'TakeStatement',
      value: null,
      parent
    }

    out.value = this.Expression(out)
    this._eat(';')
    return out;
  }

  IndexExpression(parent: Component, expr: Expression): IndexExpression {
    const self: IndexExpression = {
      type: 'IndexExpression',
      expression: expr,
      index: null,
      parent
    }
    this._eat('[');
    self.index = this.Expression(self);
    this._eat(']');

    return self
  }

  FunctionCall(parent: Component, func: Expression): FunctionCall {
    const self: FunctionCall = {
      type: 'FunctionCall',
      expression: func,
      params: null,
      parent
    }

    const params = []
    this._eat('(')

    const firstParam = optional(() => this.Expression(self));
    if (firstParam) {
      params.push(firstParam);
    }

    while (this._lookahead.token.type !== ')') {
      this._eat(',');
      params.push(this.Expression(self))
    }
    this._eat(')')

    self.params = params
    self.expression.parent = self
    return self
  }


  FunctionExpression(parent: Component, isPublic = false): FunctionExpression {
    const self: FunctionExpression = {
      type: 'FunctionExpression',
      arguments: null,
      name: null,
      body: null,
      returnType: null,
      public: isPublic,
      parent
    }

    this._eat('fn');
    const identifier = optional(() => this.Identifier(self));
    this._eat('(');
    const params = this.FormalParameterList(self);
    this._eat(')')
    const retType = this._Type(self, false) || TypeEmpty(self);
    const block = this.BlockStatement(self);

    self.arguments = params
    self.name = identifier ? identifier.name : null
    self.body = block
    self.returnType = retType

    return self
  }

  private _Type(parent: Component, required = true): Type {
    try {
      const t = this._eat('primitive')
      return {
        type: 'PrimitiveType',
        value: t.value,
        parent
      }
    } catch (e) {
      return this.TypeExpression(parent, required)
    }
  }

  TypeExpression(parent: Component, required = true): TypeExpression {
    try {
      const self: TypeExpression = {
        type: 'TypeExpression',
        genericTypes: [],
        implements: [],
        rootModule: 'main',
        name: null,
        submodules: [],
        parent
      }

      self.name = this.Identifier(self as any).name
      return self
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
  FormalParameterList(parent: Component, separatorToken = ','): TypedArgument[] {
    const params: TypedArgument[] = [];

    while (this._lookahead.token.type === 'identifier' || this._lookahead.token.type === 'primitive') {
      const name = this.Identifier(parent).name;
      const argType = this._Type(parent)
      params.push({
        type: 'TypedArgument',
        mutable: false,
        name,
        argType,
        parent
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
  ReturnStatement(parent: Component): ReturnStatement {
    const self: ReturnStatement = {
      type: 'ReturnStatement',
      value: null,
      parent
    }
    this._eat('return');
    const expr = this.Expression(self);

    if (!['IfExpression', 'FunctionExpression'].includes(expr.type)) {
      this._eat(';')
    }

    self.value = expr
    return self
  }

  BreakStatement(parent: Component): BreakStatement {
    this._eat('break');
    this._eat(';');
    return {
      type: 'BreakStatement',
      parent
    };
  }

  /**
   * ContinueStatement
   *   : 'continue' ';'
   *   ;
   */
  ContinueStatement(parent: Component): ContinueStatement {
    this._eat('continue');
    this._eat(';');
    return {
      type: 'ContinueStatement',
      parent
    };
  }

  /**
   * IfExpression
   *   : 'if' '(' Expression ')' BlockExpression
   *   | 'if' '(' Expression ')' BlockExpression 'else' BlockExpression
   *   ;
   */
  IfExpression(parent: Component): IfExpression {
    const self: IfExpression = {
      type: 'IfExpression',
      then: null,
      else: null,
      condition: null,
      parent
    }
    this._eat('if');
    const conditionExpr = this.Expression(self);
    let block = this.Expression(self);
    if (block.type !== 'BlockExpression') {
      block = {
        type: 'BlockExpression',
        body: [{
          type: 'TakeStatement',
          value: block,
          parent: null
        }],
        parent: self
      }

      block.body[0].parent = block
    }

    let otherwise = !!optional(() => this._eat('else')) ? this.Expression(self) : null;
    if (otherwise !== null && otherwise.type !== 'BlockExpression') {
      otherwise = {
        type: 'BlockExpression',
        body: [{
          type: 'TakeStatement',
          value: otherwise,
          parent: null
        }],
        parent: self
      };

      (otherwise as any as BlockExpression).body[0].parent = otherwise
    }

    self.condition = conditionExpr
    self.then = block
    self.else = otherwise as BlockExpression

    return self
  }

  IfStatement(parent: Component): IfStatement {
    const self: IfStatement = {
      type: 'IfStatement',
      then: null,
      else: null,
      condition: null,
      parent
    }
    this._eat('if');
    const conditionExpr = this.Expression(self);
    let block = this.BlockStatement(self);

    let otherwise = !!optional(() => this._eat('else')) ? this.BlockStatement(self) : null;

    self.condition = conditionExpr
    self.then = block
    self.else = otherwise

    return self
  }

  /**
   * VariableInitializer
   *   : SIMPLE_ASSIGN AssignmentExpression
   *   ;
   */
  VariableInitializer(parent: Component) {
    this._eat('SIMPLE_ASSIGN');
    return this.AssignmentStatement(parent);
  }

  /**
   * EmptyStatement
   *   : ';'
   *   ;
   */
  EmptyStatement(parent: Component): Statement {
    this._eat(';');
    return {
      type: 'EmptyStatement',
      parent
    };
  }

  FireStatement(parent: Component): FireStatement {
    this._eat('fire')
    const func = this.Expression(null)
    if (func.type !== 'FunctionCall') {
      throw new SaeSyntaxError('Expected FunctionCall but got ' + func.type, this._lookahead)
    }
    this._eat(';')

    const self: FireStatement = {
      type: 'FireStatement',
      functionCall: func,
      parent
    }

    self.functionCall.parent = self;
    return self
  }

  DeferStatement(parent: Component): DeferStatement {
    this._eat('defer')

    const self: DeferStatement = {
      type: 'DeferStatement',
      stmt: null,
      parent
    }

    self.stmt = this.Statement(self);
    return self
  }

  /**
   * BlockExpression
   *   : '{' OptStatementList '}'
   *   ;
   */
  BlockExpression(parent: Component): BlockExpression {
    this._eat('{');

    const self: BlockExpression = {
      type: 'BlockExpression',
      body: [],
      parent
    }

    self.body = this._lookahead.token.type !== '}' ? this.StatementList(self, '}') : [];
    this._eat('}');

    return self
  }

  BlockStatement(parent: Component): BlockStatement {
    this._eat('{');

    const self: BlockStatement = {
      type: 'BlockStatement',
      body: [],
      parent
    }

    self.body = this._lookahead.token.type !== '}' ? this.StatementList(self, '}') : [];
    this._eat('}');

    return self
  }

  /**
   * ExpressionStatement
   *   : Expression ';'
   *   ;
   */
  ExpressionStatement(parent: Component): ExpressionStatement {
    const self: ExpressionStatement = {
      type: 'ExpressionStatement',
      expression: null,
      parent
    }

    self.expression = this.Expression(self);
    this._eat(';');
    return self
  }


  Expression(parent: Component): Expression {
    switch (this._lookahead.token.type) {
      default:
        return this.LogicalMiscExpression(parent);
    }
  }

  VariableDeclarationStatement(parent: Component, isPublic = false): VariableDeclarationStatement {
    const self: VariableDeclarationStatement = {
      type: 'VariableDeclarationStatement',
      left: null,
      right: null,
      ttype: null,
      mutable: null,
      public: isPublic,
      parent
    }

    self.mutable = either(() => this._eat('let_mut'), () => this._eat('let')).type === 'let_mut';
    self.left = this.Identifier(self)

    self.ttype = this._Type(self, false);

    if (optional(() => this._eat('simple_assign'))) {
      self.right = this.Expression(self);
    }
    this._eat(';');

    if (self.right?.type === 'FunctionExpression' && self.right.name === null) {
      self.right.name = self.left.name;
    }

    return self
  }

  AssignmentStatement(parent: Component): AssignmentStatement {
    const self: AssignmentStatement = {
      left: null,
      operator: null,
      right: null,
      type: 'AssignmentStatement',
      parent
    }

    self.left = this.Identifier(self)
    self.operator = either(() => this._eat('simple_assign'), () => this._eat('complex_assign')).value
    self.right = this.Expression(self);
    this._eat(';');

    return self
  }

  /**
   * Identifier
   *   : IDENTIFIER
   *   ;
   */
  Identifier(parent: Component): Identifier {
    const name = this._eat('identifier').value;
    return {
      type: 'Identifier',
      name,
      parent
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
  LogicalMiscExpression(parent: Component) {
    return this._BinaryExpression(parent,
      () => this.LogicalORExpression(parent),
      'logical_misc_operator'
    )
  }

  LogicalORExpression(parent: Component) {
    return this._BinaryExpression(parent,
      () => this.LogicalANDExpression(parent),
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
  LogicalANDExpression(parent: Component) {
    return this._BinaryExpression(parent,
      () => this.EqualityExpression(parent),
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
  EqualityExpression(parent: Component) {
    return this._BinaryExpression(parent,
      () => this.RelationalExpression(parent),
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
  RelationalExpression(parent: Component) {
    return this._BinaryExpression(parent,
      () => this.AdditiveExpression(parent),
      'relational_operator'
    )
  }

  /**
   * AdditiveExpression
   *   : MultiplicativeExpression
   *   | AdditiveExpression ADDITIVE_OPERATOR MultiplicativeExpression
   *   ;
   */
  AdditiveExpression(parent: Component) {
    return this._BinaryExpression(parent,
      () => this.MultiplicativeExpression(parent),
      'additive_operator'
    )
  }

  /**
   * MultiplicativeExpression
   *   : UnaryExpression
   *   | MultiplicativeExpression MULTIPLICATIVE_OPERATOR UnaryExpression
   *   ;
   */
  MultiplicativeExpression(parent: Component) {
    return this._BinaryExpression(parent,
      () => this.PrimaryExpression(parent),
      'multiplicative_operator'
    );
  }

  /**
   * Generic binary expression.
   */
  _BinaryExpression(parent: Component, getExpression: () => Expression, operatorToken: string): Expression {
    let left = getExpression();

    while (this._lookahead.token && this._lookahead.token.type === operatorToken) {
      const operator = this._eat(operatorToken).value;

      const right = getExpression();

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        parent
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
   * MemberExpression
   *   : PrimaryExpression
   *   | MemberExpression '.' Identifier
   *   | MemberExpression '[' Expression ']'
   *   ;
   */
  MemberExpression(parent: Component, expr: Expression): MemberExpression {
    this._eat('.')
    const self: MemberExpression = {
      type: 'MemberExpression',
      expression: expr,
      property: null,
      parent
    }
    self.property = this.Identifier(self)

    return self;

    // Implement here...
  }

  LoopStatement(parent: Component): LoopStatement {
    const self: LoopStatement = {
      type: 'LoopStatement',
      body: null,
      condition: null,
      parent
    }

    this._eat('loop')
    const saeTrue: BooleanLiteral = {
      type: 'BooleanLiteral',
      value: true,
      parent: self
    };

    let condition: Expression = this.Expression(self);
    let body = this.BlockStatement(self);


    self.body = body
    self.condition = condition

    return self
  }

  LoopOverStatement(parent: Component): LoopOverStatement {
    const self: LoopOverStatement = {
      type: 'LoopOverStatement',
      body: null,
      alias: null,
      iterable: null,
      parent
    }

    this._eat('loop_over')
    const iterable = this.Expression(self)
    const alias = optional(() => {
      this._eat('as')
      return this.Identifier(self,)
    }) || {
      type: 'Identifier',
      name: 'it',
      parent
    }

    const body = this.BlockStatement(self);
    self.body = body
    self.iterable = iterable
    self.alias = alias

    return self
  }

  NativeCodeExpression(parent: Component): Expression {
    const self: Expression = {
      type: 'NativeCodeExpression',
      value: null,
      parent
    }

    this._eat('native_code')
    this._eat('(')
    self.value = this.StringLiteral(parent).value
    this._eat(')')


    return self
  }

  StructDeclarationStatement(parent: Component): StructDeclarationStatement {
    const self: StructDeclarationStatement = {
      type: 'StructDeclarationStatement',
      body: null,
      parent
    }

    this._eat('struct')
    const name = this.Identifier(self).name
    const body = this.TypeStruct(self, name)
    self.body = body

    return self
  }

  TypeStruct(parent: Component, name: string = undefined): TypeStruct {
    const self: TypeStruct = {
      type: 'TypeStruct',
      fields: [],
      name,
      parent
    }

    this._eat('{')
    self.fields = this.FormalParameterList(parent, ';')
    this._eat('}')

    return self;
  }

  PrimaryExpression(parent: Component): Expression {
    const isPublic = !!optional(() => this._eat('pub'))

    let expr: Expression
    switch (this._lookahead.token.type) {
      case '(': expr = this.ParenthesizedExpression(parent); break
      case '{': expr = this.BlockExpression(parent); break
      case 'if': expr = this.IfExpression(parent); break
      case 'identifier': expr = this.Identifier(parent); break
      case 'fn': expr = this.FunctionExpression(parent, isPublic); break
      case 'native_code': expr = this.NativeCodeExpression(parent); break
      default:
        expr = this.Literal(parent);
    }

    while (['.', '(', '{'].includes(this._lookahead?.token?.type)) {
      switch (this._lookahead?.token?.type) {
        case '.':
          expr = this.MemberExpression(parent, expr)
          break
        case '(':
          expr = this.FunctionCall(parent, expr)
          break
        case '{':
          expr = this.StructConstructorExpression(parent, expr)
      }
    }

    return expr;
  }

  StructConstructorExpression(parent: Component, expr: Expression): StructConstructorExpression {
    const self: StructConstructorExpression = {
      type: 'StructConstructorExpression',
      struct: {
        type: 'TypeStruct',
        name: expr.type === 'Identifier' ? expr.name : null,
        parent: null,
        fields: []
      },
      params: [],
      parent
    }

    this._eat('{')
    self.params = this.StructConstructorNamedFieldAssignmentList(parent)
    this._eat('}')

    return self
  }

  StructConstructorNamedFieldAssignment(parent: Component): StructConstructorNamedFieldAssignment {
    const self: StructConstructorNamedFieldAssignment = {
      fieldName: null,
      value: null,
    }

    this._eat('.')
    self.fieldName = this._eat('identifier').value
    this._eat('simple_assign')
    self.value = this.Expression(parent)

    return self
  }

  StructConstructorNamedFieldAssignmentList(parent: Component): StructConstructorNamedFieldAssignment[] {
    const self: StructConstructorNamedFieldAssignment[] = []

    while (this._lookahead.token.type === '.') {
      self.push(this.StructConstructorNamedFieldAssignment(parent))
      this._eat(',')
    }

    return self
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
   * ParenthesizedExpression
   *   : '(' Expression ')'
   *   ;
   */
  ParenthesizedExpression(parent: Component) {
    this._eat('(');
    const expr = this.Expression(parent);
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
  Literal(parent: Component): Literal {
    switch (this._lookahead.token.type) {
      case 'number':
        return this.NumericLiteral(parent);
      case 'string':
        return this.StringLiteral(parent);
      case 'bool':
        return this.BooleanLiteral(parent);
    }
  }

  BooleanLiteral(parent: Component): BooleanLiteral {
    const value = this._eat('bool').value === 'true'
    return {
      type: 'BooleanLiteral',
      value,
      parent
    };
  }

  /**
   * StringLiteral
   *   : STRING
   *   ;
   */
  StringLiteral(parent: Component): StringLiteral {
    const token = this._eat('string');
    return {
      type: 'StringLiteral',
      value: token.value.slice(1, -1),
      parent
    };
  }

  /**
   * NumericLiteral
   *   : NUMBER
   *   ;
   */
  NumericLiteral(parent: Component): NumericLiteral {
    const token = this._eat('number');
    return {
      type: 'NumericLiteral',
      value: Number(token.value),
      parent
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