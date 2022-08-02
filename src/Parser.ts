import 'colors';
import AST, { AssignmentStatement, BlockExpression, BooleanLiteral, BreakStatement, ContinueStatement, DeferStatement, Expression, ExpressionStatement, FireStatement, FunctionCall, FunctionDeclarationStatement, Identifier, IfExpression, IndexExpression, Literal, LoopStatement, LoopOverStatement, MemberExpression, NumericLiteral, ReturnStatement, Statement, StringLiteral, TakeStatement, Type, TypedArgument, VariableDeclarationStatement, Component, IfStatement, BlockStatement, CppNativeCodeStatement, TypeFunction, InterfaceDeclarationStatement, StructDeclarationStatement, StructInstantiationExpression, TypeIdentifier, FunctionDeclarationExpression } from './AST';
import { TypeEmpty } from './ASTUtils';
import { SaeError, SaeSyntaxError } from './Error'
import { Token, TokenDetails, Tokenizer } from './Tokenizer'

function optionally<T>(fn: () => T): T | null {
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
    const value = optionally(fn);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

export const componentTokenMap = new Map<Component, TokenDetails>()

export class Parser {
  private lookahead: TokenDetails = null
  private lastToken: TokenDetails = null
  private _string = '';
  private _tokenizer = new Tokenizer();
  public _file: string = null;

  /**
   * Parses a string into an AST.
   */
  parse(str: string): AST {
    this._string = str;
    this._tokenizer.init(str);
    this._tokenizer._file = this._file;

    this.lookahead = this._tokenizer.getNextToken();

    return this.Program();
  }

  private _lookaheadForwards(steps: number = 1): TokenDetails | null {
    let tokenizer = new Tokenizer()
    tokenizer._file = this._file;
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
    while (this.lookahead.token != null && this.lookahead.token.type !== stopLookahead) {
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
    const isPublic = !!optionally(() => this.eat('pub'))

    switch (this.lookahead.token.type) {
      case ';': return this.EmptyStatement(parent)
      case 'cpp_code': return this.CppNativeCodeStatement(parent)
      case '{': return this.BlockStatement(parent)
      case 'take': return this.TakeStatement(parent)
      case 'if': return this.IfStatement(parent)
      case 'fn': return this.FunctionDeclarationStatement(parent, isPublic)
      case 'loop_over': return this.LoopOverStatement(parent)
      case 'loop': return this.LoopStatement(parent)
      case 'return': return this.ReturnStatement(parent)
      case 'fire': return this.FireStatement(parent)
      case 'continue': return this.ContinueStatement(parent)
      case 'break': return this.BreakStatement(parent)
      case 'defer': return this.DeferStatement(parent)
      case 'type_interface': return this.InterfaceDeclarationStatement(parent)
      case 'type_struct': return this.StructDeclarationStatement(parent)
      case 'let_mut': // fallthrough
      case 'let': return this.VariableDeclarationStatement(parent, isPublic)
      case 'identifier':
        if (['simple_assign', 'complex_assign'].includes(this._lookaheadForwards().token?.type)) {
          return this.AssignmentStatement(parent)
        } // fallthrough
      default: return this.ExpressionStatement(parent)
    }
  }

  InterfaceDeclarationStatement(parent: Component): InterfaceDeclarationStatement {
    const self: InterfaceDeclarationStatement = {
      parent,
      type: 'InterfaceDeclarationStatement',
      attributes: [],
      implements: [],
      identifier: null
    }

    const interfaceToken = this.eat('type_interface');
    registerComponentToken(interfaceToken, self);

    const identifier = this.Identifier(self);

    const implIds: TypeIdentifier[] = [];
    if (optionally(() => this.eat('impl'))) {
      do {
        optionally(() => this.eat(','))
        const interfaceId = this.TypeIdentifier(self);
        implIds.push(interfaceId);
      } while (this.lookahead.token?.type === ',');
    }

    const attributes: [Identifier, TypeIdentifier | Type][] = [];
    this.eat('{');
    while (this.lookahead.token && this.lookahead.token.type !== '}') {
      const attr: [Identifier, TypeIdentifier | Type] = [
        this.Identifier(self),
        either(() => this.TypeIdentifier(self), () => this._Type(self, true) as any)
      ];

      this.eat(';')
      attributes.push(attr);
    }
    this.eat('}');

    self.identifier = {
      ...identifier,
      type: 'TypeIdentifier'
    };
    self.attributes = attributes;
    self.implements = implIds;

    return self;
  }

  StructDeclarationStatement(parent: Component): StructDeclarationStatement {
    const self: StructDeclarationStatement = {
      parent,
      type: 'StructDeclarationStatement',
      attributes: [],
      implements: [],
      identifier: null
    }

    const structToken = this.eat('type_struct');
    registerComponentToken(structToken, self);

    const identifier = this.Identifier(self);

    const implIds: TypeIdentifier[] = [];
    if (optionally(() => this.eat('impl'))) {
      do {
        optionally(() => this.eat(','))
        const interfaceId = this.TypeIdentifier(self);
        implIds.push(interfaceId);
      } while (this.lookahead.token?.type === ',');
    }

    const attributes: [Identifier, TypeIdentifier | Type][] = [];
    this.eat('{');
    while (this.lookahead.token && this.lookahead.token.type !== '}') {
      const attr: [Identifier, TypeIdentifier | Type] = [
        this.Identifier(self),
        either(() => this.TypeIdentifier(self), () => this._Type(self, true) as any)
      ];

      this.eat(';')
      attributes.push(attr);
    }
    this.eat('}');

    self.identifier = {
      type: 'TypeIdentifier',
      name: identifier.name,
      parent: identifier.parent
    };

    self.attributes = attributes;
    self.implements = implIds;

    return self;
  }

  TakeStatement(parent: Component): TakeStatement {
    this.eat('take');
    const out: TakeStatement = {
      type: 'TakeStatement',
      value: null,
      parent
    }

    out.value = this.Expression(out)
    this.eat(';')
    return out;
  }

  IndexExpression(parent: Component, expr: Expression): IndexExpression {
    const self: IndexExpression = {
      type: 'IndexExpression',
      expression: expr,
      index: null,
      parent
    }
    this.eat('[');
    self.index = this.Expression(self);
    this.eat(']');

    return self
  }

  StructInstantiationExpression(parent: Component, structExpr: Expression): StructInstantiationExpression {
    const self: StructInstantiationExpression = {
      type: 'StructInstantiationExpression',
      ttype: null,
      attributes: null,
      parent
    }

    const structInstToken = this.lastToken.token
    registerComponentToken(structInstToken, structExpr)
    this.eat('{')

    if (structExpr.type !== 'Identifier') {
      throw new SaeSyntaxError(`Expected a struct identifier but got '${structExpr.type}'.`, structInstToken.up);
    }

    const structId = structExpr as Identifier;

    const args: [Identifier, Expression][] = []

    let firstArg = true;
    if (this.lookahead.token?.type === 'identifier') {
      do {
        if (!firstArg) {
          this.eat(',');
        } {
          firstArg = false;
        }

        args.push([
          this.Identifier(self),
          (this.eat('simple_assign'), this.Expression(self))
        ]);
      } while ((this.lookahead.token?.type as any) !== '}');
    }

    this.eat('}')

    self.attributes = args
    self.ttype = {
      ...structId,
      type: 'TypeIdentifier'
    }

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
    this.eat('(')

    const firstParam = optionally(() => this.Expression(self));
    if (firstParam) {
      params.push(firstParam);
    }

    while (this.lookahead.token.type !== ')') {
      this.eat(',');
      params.push(this.Expression(self))
    }
    this.eat(')')

    self.params = params
    self.expression.parent = self
    return self
  }

  PipedFunctionExpression(parent: Component, paramExpr: Expression): FunctionCall {
    let out: Expression = paramExpr;
    do {
      const pipeFnToken = this.eat('->');
      const funcCall = this.Expression(parent) as FunctionCall;
      funcCall.params = [out, ...funcCall.params];
      out = funcCall;
      registerComponentToken(pipeFnToken, funcCall);
    } while (this.lookahead.token?.type === '->');

    return out;
  }

  FunctionDeclarationExpression(parent: Component): FunctionDeclarationExpression {
    const self: FunctionDeclarationExpression = {
      type: 'FunctionDeclarationExpression',
      arguments: null,
      body: null,
      returnType: null,
      parent
    }

    const fnToken = this.eat('fn');
    registerComponentToken(fnToken, self)
    this.eat('(');
    const params = this.FormalParameterList(self);
    this.eat(')')
    const retType = this._Type(self, false) || null;
    this.eat('->');

    let block: BlockStatement = null;
    if (this.lookahead.token?.type === '{') {
      block = this.BlockStatement(self);
    } else {
      block = {
        type: 'BlockStatement',
        body: [{
          type: 'ReturnStatement',
          value: null
        }],
        parent: self
      }

      block.body[0].parent = self;
      (block.body[0] as ReturnStatement).value = this.Expression(block);
    }

    self.arguments = params
    self.body = block
    self.returnType = retType

    return self
  }

  FunctionDeclarationStatement(parent: Component, isPublic = false): FunctionDeclarationStatement {
    const self: FunctionDeclarationStatement = {
      type: 'FunctionDeclarationStatement',
      arguments: null,
      name: null,
      body: null,
      returnType: null,
      public: isPublic,
      parent
    }

    const fnToken = this.eat('fn');
    registerComponentToken(fnToken, self)
    const identifier = this.Identifier(self);
    this.eat('(');
    const params = this.FormalParameterList(self);
    this.eat(')')
    const retType = this._Type(self, false) || TypeEmpty(self);
    const block = this.BlockStatement(self);

    self.arguments = params
    self.name = identifier ? identifier.name : null
    self.body = block
    self.returnType = retType

    return self
  }

  private _Type(parent: Component, required = true): Type {
    switch (this.lookahead?.token.type) {
      case 'primitive': {
        const t = this.eat('primitive')
        return {
          type: 'PrimitiveType',
          value: t.value,
          parent
        }
      }
      case '(': {
        return this.TypeFunction(parent)
      }
      default: {
        try {
          return this.TypeIdentifier(parent)
        } catch (e) {
          if (required) {
            throw e;
          }
          return null
        }
      }
    }
  }

  TypeFunction(parent: Component): TypeFunction {
    const self: TypeFunction = {
      type: 'TypeFunction',
      genericTypes: [],
      paramTypes: [],
      returnType: null,
      parent,
    };

    this.eat('(')
    self.paramTypes = this.FormalParameterList(self as any);
    this.eat(')')
    self.returnType = this._Type(self as any, false) || {
      type: 'TypeEmpty',
      parent: self
    } as any

    return self;
  }

  /**
   * FormalParameterList
   *   : Identifier
   *   | FormalParameterList ',' Identifier
   *   ;
   */
  FormalParameterList(parent: Component): TypedArgument[] {
    const params: TypedArgument[] = [];

    while (this.lookahead.token.type === 'identifier' || this.lookahead.token.type === 'primitive') {
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
        this.eat(',')
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
    const returnToken = this.eat('return');
    registerComponentToken(returnToken, self)
    const expr = this.Expression(self);

    this.eat(';')

    self.value = expr
    return self
  }

  BreakStatement(parent: Component): BreakStatement {
    this.eat('break');
    this.eat(';');
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
    this.eat('continue');
    this.eat(';');
    return {
      type: 'ContinueStatement',
      parent
    };
  }

  CppNativeCodeStatement(parent: Component): CppNativeCodeStatement {
    const cppToken = this.eat('cpp_code');
    const self: CppNativeCodeStatement = {
      type: 'CppNativeCodeStatement',
      parent,
      code: cppToken.value,
      exposing: []
    };

    registerComponentToken(cppToken, self);
    this.eat('exposing');
    this.eat('(');
    const params = this.FormalParameterList(self);
    this.eat(')')
    self.exposing = params;
    this.eat(';')

    return self;
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
    const ifToken = this.eat('if');
    registerComponentToken(ifToken, self)
    const conditionExpr = this.Expression(self);
    let block = this.Expression(self);

    this.eat('else');

    const otherwise = this.Expression(self);

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
    const ifToken = this.eat('if');
    registerComponentToken(ifToken, self)
    const conditionExpr = this.Expression(self);
    let block = this.BlockStatement(self);

    let otherwise = !!optionally(() => this.eat('else')) ? this.BlockStatement(self) : null;

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
    this.eat('SIMPLE_ASSIGN');
    return this.AssignmentStatement(parent);
  }

  /**
   * EmptyStatement
   *   : ';'
   *   ;
   */
  EmptyStatement(parent: Component): Statement {
    const token = this.eat(';');
    const self: Statement = {
      type: 'EmptyStatement',
      parent
    };
    componentTokenMap.set(self, token.up)
    return self
  }

  FireStatement(parent: Component): FireStatement {
    const fireToken = this.eat('fire')
    const func = this.Expression(null)
    if (func.type !== 'FunctionCall') {
      throw new SaeSyntaxError('Expected FunctionCall but got ' + func.type, this.lookahead)
    }
    this.eat(';')

    const self: FireStatement = {
      type: 'FireStatement',
      functionCall: func,
      parent
    }

    self.functionCall.parent = self;
    registerComponentToken(fireToken, self);

    return self
  }

  DeferStatement(parent: Component): DeferStatement {
    const deferToken = this.eat('defer')

    const self: DeferStatement = {
      type: 'DeferStatement',
      stmt: null,
      parent
    }

    self.stmt = this.Statement(self);
    registerComponentToken(deferToken, self);

    return self
  }

  /**
   * BlockExpression
   *   : '{' OptStatementList '}'
   *   ;
   */
  BlockExpression(parent: Component): BlockExpression {
    const blockToken = this.eat('do')
    this.eat('{');

    const self: BlockExpression = {
      type: 'BlockExpression',
      body: [],
      parent
    }

    self.body = this.lookahead.token.type !== '}' ? this.StatementList(self, '}') : [];
    this.eat('}');
    registerComponentToken(blockToken, self)

    if (!self.body.some(child => child.type === 'TakeStatement')) {
      throw new SaeSyntaxError(`Block expressions must have at least one 'take' statement.`, blockToken.up);
    }

    return self
  }

  BlockStatement(parent: Component): BlockStatement {
    const blockToken = this.eat('{');

    const self: BlockStatement = {
      type: 'BlockStatement',
      body: [],
      parent
    }

    self.body = this.lookahead.token.type !== '}' ? this.StatementList(self, '}') : [];
    try {
      this.eat('}');
    } catch (e) {
      throw new SaeSyntaxError(`Missing extra closing curly ` + '}'.bgBlue.reset + ` token here.`.red, (e as SaeSyntaxError).lookahead)
    }
    registerComponentToken(blockToken, self)

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
    const exprStmtToken = this.eat(';');
    registerComponentToken(exprStmtToken, self)
    return self
  }


  Expression(parent: Component): Expression {
    switch (this.lookahead.token.type) {
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

    const letToken = either(() => this.eat('let_mut'), () => this.eat('let'))
    self.mutable = letToken.type === 'let_mut';
    registerComponentToken(letToken, self)
    self.left = this.Identifier(self)

    self.ttype = this._Type(self, false);

    if (optionally(() => this.eat('simple_assign'))) {
      self.right = this.Expression(self);
    }
    this.eat(';');

    // if (self.right?.type === 'FunctionDeclarationStatement' && self.right.name === null) {
    //   self.right.name = self.left.name;
    // }

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
    const assignToken = either(() => this.eat('simple_assign'), () => this.eat('complex_assign'))
    registerComponentToken(assignToken, self)
    self.operator = assignToken.value
    self.right = this.Expression(self);
    this.eat(';');

    return self
  }

  /**
   * Identifier
   *   : IDENTIFIER
   *   ;
   */
  Identifier(parent: Component): Identifier {
    const token = this.eat('identifier');
    const self: Identifier = {
      type: 'Identifier',
      name: token.value,
      parent
    };

    registerComponentToken(token, self)
    return self;
  }

  /**
   * Identifier
   *   : IDENTIFIER
   *   ;
   */
  TypeIdentifier(parent: Component): TypeIdentifier {
    return {
      ...this.Identifier(parent),
      type: 'TypeIdentifier'
    }
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

    while (this.lookahead.token && this.lookahead.token.type === operatorToken) {
      const operator = this.eat(operatorToken);

      const right = getExpression();

      left = {
        type: 'BinaryExpression',
        operator: operator.value,
        left,
        right,
        parent
      };

      registerComponentToken(operator, left)
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
    const memberToken = this.eat('.')
    const self: MemberExpression = {
      type: 'MemberExpression',
      expression: expr,
      property: null,
      parent
    }
    registerComponentToken(memberToken, self)
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

    const loopToken = this.eat('loop')
    registerComponentToken(loopToken, self)

    let bodyOrCondition = either<BlockStatement | Expression>(() => this.BlockStatement(self), () => this.Expression(self));
    let condition: Expression = null;

    if (bodyOrCondition.type === 'BlockStatement') {
      condition = {
        type: 'BooleanLiteral',
        value: true,
        parent: self
      };
    } else {
      condition = bodyOrCondition;
      bodyOrCondition = this.BlockStatement(self);
    }


    self.body = bodyOrCondition as BlockStatement;
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

    const loopToken = this.eat('loop_over')
    registerComponentToken(loopToken, self)
    const iterable = this.Expression(self)
    const alias = optionally(() => {
      this.eat('as')
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

  PrimaryExpression(parent: Component): Expression {
    let expr: Expression
    switch (this.lookahead.token.type) {
      case '(': expr = this.ParenthesizedExpression(parent); break
      case 'do': expr = this.BlockExpression(parent); break
      case 'if': expr = this.IfExpression(parent); break
      case 'fn': expr = this.FunctionDeclarationExpression(parent); break
      case 'identifier': expr = this.Identifier(parent); break
      default:
        expr = this.Literal(parent);
    }

    checker: while (['.', '(', '{', '->'].includes(this.lookahead?.token?.type)) {
      switch (this.lookahead?.token?.type) {
        case '.':
          expr = this.MemberExpression(parent, expr)
          break
        case '(':
          expr = this.FunctionCall(parent, expr);
          if ((this.lookahead?.token?.type as string) === '->') {
            break checker
          }
          break
        case '->':
          expr = this.PipedFunctionExpression(parent, expr)
          break checker
        case '{':
          if (!['IfExpression', 'IfStatement', 'LoopOverStatement', 'LoopStatement'].includes(expr.parent?.type)) {
            expr = this.StructInstantiationExpression(parent, expr)
          }
          break checker
      }
    }

    return expr;
  }

  /**
   * ParenthesizedExpression
   *   : '(' Expression ')'
   *   ;
   */
  ParenthesizedExpression(parent: Component) {
    this.eat('(');
    const expr = this.Expression(parent);
    this.eat(')');
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
    switch (this.lookahead.token.type) {
      case 'number':
        return this.NumericLiteral(parent);
      case 'string':
        return this.StringLiteral(parent);
      case 'bool':
        return this.BooleanLiteral(parent);
    }
  }

  BooleanLiteral(parent: Component): BooleanLiteral {
    const boolToken = this.eat('bool')
    const value = boolToken.value === 'true'
    const self: BooleanLiteral = {
      type: 'BooleanLiteral',
      value,
      parent
    };

    registerComponentToken(boolToken, self)

    return self
  }

  /**
   * StringLiteral
   *   : STRING
   *   ;
   */
  StringLiteral(parent: Component): StringLiteral {
    const token = this.eat('string');
    const self: StringLiteral = {
      type: 'StringLiteral',
      value: token.value.slice(1, -1),
      parent
    };

    registerComponentToken(token, self);
    return self;
  }

  /**
   * NumericLiteral
   *   : NUMBER
   *   ;
   */
  NumericLiteral(parent: Component): NumericLiteral {
    const token = this.eat('number');
    const self: NumericLiteral = {
      type: 'NumericLiteral',
      value: Number(token.value),
      parent
    };

    registerComponentToken(token, self)
    return self;
  }

  /**
   * Expects a token of a given type.
   */
  eat(tokenType: string): Token {
    const token = this.lookahead?.token;

    if (!token) {
      throw new SaeSyntaxError(`Unexpected end of input, expected: "${tokenType}"`, this.lookahead);
    }

    if (token.type != tokenType) {
      throw new SaeSyntaxError(`Unexpected token "${token.value}", expected "${tokenType}"`, this.lookahead);
    }

    this.lastToken = this.lookahead
    this.lookahead = this._tokenizer.getNextToken();
    return token;
  }
}

const registerComponentToken = (token: Token, component: any): Token => {
  if (token && token.up) {
    componentTokenMap.set(component, token.up)
  }
  return token;
}