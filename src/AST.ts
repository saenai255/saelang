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
    operator: '+' | '-' | '*' | '/'
}

export interface LogicalExpression {
    type: 'LogicalExpression';
    left: Expression;
    right: Expression;
    operator: '<' | '>' | '>=' | '<=' | '==' | '!=' | '||' | '&&' | '~||' | '~&&' | '!||' | '!&&'
}

export interface FunctionExpression {
    type: 'FunctionExpression';
    name: string | null;
    returnType: Type;
    arguments: TypedArgument[];
    body: BlockStatement;
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

export type Type =
    | TypeEmpty
    | Primitive
    | TypeExpression

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

export interface ExpressionStatement {
    type: 'ExpressionStatement',
    expression: Expression;
}

export interface BlockStatement {
    type: 'BlockStatement',
    body: Statement[];
}

export interface IfExpression {
    type: 'IfExpression',
    then: BlockStatement;
    else?: BlockStatement;
    condition: Expression;
}

export interface TakeStatement {
    type: 'TakeStatement';
    value: Expression;
}

export interface EmptyStatement {
    type: 'EmptyStatement'
}

export interface ReturnStatement {
    type: 'ReturnStatement',
    value: Expression;
}

export type Statement =
    | ExpressionStatement
    | BlockStatement
    | EmptyStatement
    | TakeStatement
    | ReturnStatement
    | IfExpression
    | FunctionExpression
    | AssignmentStatement
    | VariableDeclarationStatement