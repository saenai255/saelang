import 'colors';
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

export interface FunctionDeclarationStatement {
    type: 'FunctionDeclarationStatement';
    name: string;
    returnType: Type;
    arguments: TypedArgument[];
    body: BlockStatement;
    parent?: Component;
    public: boolean;
}

export interface FunctionDeclarationExpression {
    type: 'FunctionDeclarationExpression';
    returnType: Type;
    arguments: TypedArgument[];
    body: BlockStatement;
    parent?: Component;
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
    paramTypes: TypedArgument[];
    returnType: Type;
    genericTypes: Type[];
    parent?: Component;
}

export type TypePointer = {
    type: 'TypePointer';
    parent?: Component;
    inner: Type;
}

export type TypeArray = {
    type: 'TypeArray';
    parent?: Component;
    inner: Type
}

export type InterfaceDeclarationStatement = {
    type: 'InterfaceDeclarationStatement'
    parent?: Component;
    identifier: TypeIdentifier;
    implements: TypeIdentifier[];
    attributes: [Identifier, TypeIdentifier | Type][];
}

export type StructDeclarationStatement = {
    type: 'StructDeclarationStatement'
    parent?: Component;
    identifier: TypeIdentifier;
    implements: TypeIdentifier[];
    attributes: [Identifier, TypeIdentifier | Type][];
}

export type TypeInterface = {
    type: 'TypeInterface'
    parent?: Component;
    identifier: TypeIdentifier;
    implements: TypeInterface[];
    attributes: TypedArgument[];
}

export type TypeStruct = {
    type: 'TypeStruct'
    parent?: Component;
    identifier: TypeIdentifier;
    implements: TypeInterface[];
    attributes: TypedArgument[];
}

export type TypeUnion = {
    type: 'TypeUnion'
    parent?: Component;
    union: Type[];
}

export type EnumDeclaration = {
    type: 'EnumDeclaration';
    parent?: Component;
    enum: Enum;
}

export type Enum = {
    type: 'Enum'
    variants: TypedArgument[];
    name: string;
    parent?: Component;
} 

export type Type =
    | TypeEmpty
    | Primitive
    | TypeFunction
    | TypePointer
    | TypeStruct
    | TypeInterface
    | TypeUnion
    | TypeIdentifier

export interface TypeEmpty {
    parent?: Component;
    type: 'TypeEmpty'
}

export type CppNativeCodeStatement = {
    parent?: Component;
    type: 'CppNativeCodeStatement';
    code: string;
    exposing: TypedArgument[];
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

export interface TypeIdentifier {
    type: 'TypeIdentifier';
    parent?: Component;
    name: string;
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

export type StructInstantiationExpression = {
    type: 'StructInstantiationExpression';
    parent?: Component;
    ttype: TypeIdentifier,
    attributes: [Identifier, Expression][];
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
    | FunctionCall
    | MemberExpression
    | IndexExpression
    | BlockExpression
    | StructInstantiationExpression

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
    then: Expression;
    else: Expression;
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
    | FunctionDeclarationStatement
    | AssignmentStatement
    | VariableDeclarationStatement
    | DeferStatement
    | FireStatement
    | LoopOverStatement
    | ContinueStatement
    | BreakStatement
    | CppNativeCodeStatement
    | InterfaceDeclarationStatement
    | StructDeclarationStatement
    | TypeIdentifier

export type Component =
    | Statement
    | Expression
    | AST