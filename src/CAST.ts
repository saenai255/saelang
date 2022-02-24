export interface AST {
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
}

export interface FunctionStatement {
    type: 'FunctionStatement';
    name: string | null;
    returnType: Type;
    arguments: TypedArgument[];
    body: BlockStatement;
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
    ttype: Type;
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

export type Type = string

export interface TypedArgument {
    type: 'TypedArgument';
    argType: Type;
    name: string;
}

export interface Identifier {
    type: 'Identifier';
    name: string;
}

export interface ForStatement {
    type: 'ForStatement';
    init: Statement | null;
    condition: Expression | null;
    step: Statement
    body: BlockStatement;
}

export interface WhileStatement {
    type: 'WhileStatement';
    condition: Expression;
    body: BlockStatement;
}

export type Literal =
    | NumericLiteral
    | StringLiteral
    | BooleanLiteral

export type Expression =
    | Literal
    | BinaryExpression
    | IfStatement
    | Identifier
    | FunctionStatement
    | FunctionCall
    | MemberExpression
    | IndexExpression
    | ForStatement
    | WhileStatement
    | BlockStatement

export interface ExpressionStatement {
    type: 'ExpressionStatement',
    expression: Expression;
}

export interface BlockStatement {
    type: 'BlockStatement',
    body: Statement[];
}

export interface IfStatement {
    type: 'IfStatement',
    then: BlockStatement;
    else?: BlockStatement;
    condition: Expression;
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

export class StatementList {
    type: 'StatementList' = 'StatementList'
    private stmts: Statement[] = []
    private deferred: Statement[] = []

    constructor(public node: Component) { }

    push(stmt: Statement) {
        this.stmts.push(stmt)
    }

    defer(stmt: Statement) {
        this.deferred.push(stmt)
    }

    get statements(): Statement[] {
        return [...this.stmts, ...this.deferred.reverse()]
    }
}

export type Statement =
    | ExpressionStatement
    | BlockStatement
    | EmptyStatement
    | ReturnStatement
    | IfStatement
    | FunctionStatement
    | AssignmentStatement
    | VariableDeclarationStatement
    | ContinueStatement
    | BreakStatement

export type Component =
    | Statement
    | Expression
    | AST
    | StatementList