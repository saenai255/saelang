export default interface AST {
    type: 'Program';
    body: Statement[];
}

export type Primitives =
    | 'i8'
    | 'i16'
    | 'i32'
    | 'i64'
    | 'i128'
    | 'u8'
    | 'u16'
    | 'u32'
    | 'u64'
    | 'u128'
    | 'str'
    | 'bool'
    | 'f32'
    | 'f64'
    ;
export interface Primitive {
    type: 'PrimitiveType',
    value: Primitives
}

export interface StringLiteral {
    type: 'StringLiteral';
    value: string;
}

export interface NumericLiteral {
    type: 'NumericLiteral';
    value: number;
}

export interface BooleanLiteral {
    type: 'BooleanLiteral';
    value: boolean;
}

export interface BinaryExpression {
    type: 'BinaryExpression';
    left: Expression;
    right: Expression;
    operator:
    | '+'
    | '-'
    | '*'
    | '/'
    | '<'
    | '>'
    | '>='
    | '<='
    | '=='
    | '!='
    | '||'
    | '&&'
    | '~||'
    | '~&&'
    | '!||'
    | '!&&'
}

export interface FunctionExpression {
    type: 'FunctionExpression';
    name: string | null;
    returnType: Type;
    arguments: TypedArgument[];
    body: BlockExpression;
    public: boolean;
}

export interface MemberExpression {
    type: 'MemberExpression';
    expression: Expression;
    property: Identifier;
}

export interface AssignmentStatement {
    type: 'AssignmentStatement'
    operator: '=' | '+=' | '-=' | '*=' | '/=';
    left: Identifier;
    right: Expression;
}

export interface VariableDeclarationStatement {
    type: 'VariableDeclarationStatement'
    left: Identifier;
    right: Expression | null;
    ttype: Type | null;
    public: boolean;
    mutable: boolean;
}

export interface IndexExpression {
    type: 'IndexExpression';
    expression: Expression;
    index: Expression;
}
export interface FunctionCall {
    type: 'FunctionCall',
    expression: Expression;
    params: Expression[];
}

export type TypeFunction = {
    type: 'TypeFunction';
    paramTypes: Type[];
    returnType: Type;
    genericTypes: Type[];
}

export type TypePointer = {
    type: 'TypePointer';
    inner: Type;
}

export type TypeArray = {
    type: 'TypeArray';
    inner: Type
}

export type Type =
    | TypeEmpty
    | Primitive
    | TypeExpression
    | TypeFunction
    | TypePointer

export interface TypeEmpty {
    type: 'TypeEmpty'
}

export interface TypeExpression {
    type: 'TypeExpression';
    rootModule: string;
    submodules: string[];
    name: string;
    genericTypes: Type[];
    implements: Type[];
}

export interface TypedArgument {
    type: 'TypedArgument';
    argType: Type;
    name: string;
    mutable: boolean;
}

export interface Identifier {
    type: 'Identifier';
    name: string;
}

export interface LoopExpression {
    type: 'LoopExpression';
    condition: Expression;
    body: BlockExpression;
}
export interface LoopOverExpression {
    type: 'LoopOverExpression';
    iterable: Expression;
    alias: Identifier;
    body: BlockExpression;
}

export type Literal =
    | NumericLiteral
    | StringLiteral
    | BooleanLiteral

export type Expression =
    | Literal
    | BinaryExpression
    | IfExpression
    | Identifier
    | FunctionExpression
    | FunctionCall
    | MemberExpression
    | IndexExpression
    | LoopExpression
    | LoopOverExpression
    | BlockExpression

export interface ExpressionStatement {
    type: 'ExpressionStatement',
    expression: Expression;
}

export interface BlockExpression {
    type: 'BlockExpression',
    body: Statement[];
}

export interface IfExpression {
    type: 'IfExpression',
    then: BlockExpression;
    else?: BlockExpression;
    condition: Expression;
}

export interface TakeStatement {
    type: 'TakeStatement';
    value: Expression;
}

export interface EmptyStatement {
    type: 'EmptyStatement'
}

export interface ContinueStatement {
    type: 'ContinueStatement'
}

export interface BreakStatement {
    type: 'BreakStatement'
}

export interface ReturnStatement {
    type: 'ReturnStatement',
    value: Expression;
}

export interface DeferStatement {
    type: 'DeferStatement';
    stmt: Statement;
}

export interface FireStatement {
    type: 'FireStatement';
    functionCall: FunctionCall;
}

export type Statement =
    | ExpressionStatement
    | BlockExpression
    | EmptyStatement
    | TakeStatement
    | ReturnStatement
    | IfExpression
    | LoopExpression
    | FunctionExpression
    | AssignmentStatement
    | VariableDeclarationStatement
    | DeferStatement
    | FireStatement
    | LoopOverExpression
    | ContinueStatement
    | BreakStatement

export type Component =
    | Statement
    | Expression
    | AST