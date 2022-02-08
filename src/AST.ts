export default interface AST {
    type: 'Program';
    body: Statement[];
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

export interface FunctionExpression {
    type: 'FunctionExpression';
    name: string;
    returnType: TypeExpression;
    arguments: TypedArgument[];
    body: BlockStatement;
}

export interface TypeExpression {
    rootModule: string;
    submodules: string[];
    name: string;
    genericTypes: TypeExpression[];
    implements: TypeExpression[];
}

export interface TypedArgument {
    type: 'TypedArgument';
    argType: TypeExpression;
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
    condition: Expression

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