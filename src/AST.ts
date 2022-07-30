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
    | 'f128'
    | 'c_int'
    | 'c_char'
    | 'c_float'
    | 'c_double'
    | 'c_bool'
    ;
export interface Primitive {
    parent?: Component;
    type: 'PrimitiveType',
    value: Primitives
}

export interface StringLiteral {
    parent?: Component;
    type: 'StringLiteral';
    value: string;
}

export interface NumericLiteral {
    parent?: Component;
    type: 'NumericLiteral';
    value: number;
}

export interface BooleanLiteral {
    parent?: Component;
    type: 'BooleanLiteral';
    value: boolean;
}

export interface BinaryExpression {
    parent?: Component;
    type: 'BinaryExpression';
    left: Expression;
    right: Expression;
    ttype?: Type;
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
    body: BlockStatement;
    parent?: Component;
    public: boolean;
}

export interface MemberExpression {
    type: 'MemberExpression';
    expression: Expression;
    parent?: Component;
    property: Identifier;
}

export interface AssignmentStatement {
    type: 'AssignmentStatement'
    operator: '=' | '+=' | '-=' | '*=' | '/=';
    left: Identifier;
    parent?: Component;
    right: Expression;
}

export interface VariableDeclarationStatement {
    type: 'VariableDeclarationStatement'
    left: Identifier;
    right: Expression | null;
    ttype: Type | null;
    public: boolean;
    parent?: Component;
    mutable: boolean;
}

export interface IndexExpression {
    type: 'IndexExpression';
    expression: Expression;
    parent?: Component;
    index: Expression;
    ttype?: Type;
}
export interface FunctionCall {
    type: 'FunctionCall',
    expression: Expression;
    parent?: Component;
    params: Expression[];
    ttype?: Type;
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
    parent?: Component;
    type: 'TypeEmpty'
}

export interface TypeExpression {
    type: 'TypeExpression';
    rootModule: string;
    submodules: string[];
    name: string;
    genericTypes: Type[];
    parent?: Component;
    implements: Type[];
}

export interface TypedArgument {
    type: 'TypedArgument';
    argType: Type;
    name: string;
    parent?: Component;
    mutable: boolean;
}

export interface Identifier {
    type: 'Identifier';
    parent?: Component;
    name: string;
    ttype?: Type;
}

export interface LoopStatement {
    type: 'LoopStatement';
    condition: Expression;
    parent?: Component;
    body: BlockStatement;
}
export interface LoopOverStatement {
    type: 'LoopOverStatement';
    iterable: Expression;
    alias: Identifier;
    parent?: Component;
    body: BlockStatement;
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
    | BlockExpression

export interface ExpressionStatement {
    type: 'ExpressionStatement',
    expression: Expression;
    parent?: Component;
}

export interface BlockExpression {
    type: 'BlockExpression',
    body: Statement[];
    parent?: Component;
    ttype?: Type;
}

export interface BlockStatement {
    type: 'BlockStatement',
    body: Statement[];
    parent?: Component;
    ttype?: Type;
}

export interface IfExpression {
    type: 'IfExpression',
    then: BlockExpression;
    else?: BlockExpression;
    condition: Expression;
    parent?: Component;
    ttype?: Type;
}

export interface IfStatement {
    type: 'IfStatement',
    then: BlockStatement;
    else?: BlockStatement;
    condition: Expression;
    parent?: Component;
    ttype?: Type;
}

export interface TakeStatement {
    type: 'TakeStatement';
    value: Expression;
    parent?: Component;
}

export interface EmptyStatement {
    type: 'EmptyStatement'
    parent?: Component;
}

export interface ContinueStatement {
    type: 'ContinueStatement'
    parent?: Component;

}

export interface BreakStatement {
    parent?: Component;
    type: 'BreakStatement'
}

export interface ReturnStatement {
    parent?: Component;
    type: 'ReturnStatement',
    value: Expression;
}

export interface DeferStatement {
    parent?: Component;
    type: 'DeferStatement';
    stmt: Statement;
}

export interface FireStatement {
    parent?: Component;
    type: 'FireStatement';
    functionCall: FunctionCall;
}

export type Statement =
    | ExpressionStatement
    | BlockStatement
    | EmptyStatement
    | TakeStatement
    | ReturnStatement
    | IfStatement
    | LoopStatement
    | FunctionExpression
    | AssignmentStatement
    | VariableDeclarationStatement
    | DeferStatement
    | FireStatement
    | LoopOverStatement
    | ContinueStatement
    | BreakStatement

export type Component =
    | Statement
    | Expression
    | AST