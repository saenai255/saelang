import * as t from './AST'

export type NT<T> = Omit<T, 'type'>;

export const Program = (...stmts: t.Statement[]): t.default => ({ type: 'Program', body: stmts })
export const NumericLiteral = (value: number): t.NumericLiteral => ({ type: 'NumericLiteral', value })
export const StringLiteral = (value: string): t.StringLiteral => ({ type: 'StringLiteral', value })
export const BooleanLiteral = (value: boolean): t.BooleanLiteral => ({ type: 'BooleanLiteral', value })
export const BlockStatement = (...stmts: t.Statement[]): t.BlockStatement => ({ type: 'BlockStatement', body: stmts })
export const IfExpression = (condition: t.Expression, then: t.BlockStatement, otherwise: t.BlockStatement = null): t.IfExpression => ({ type: 'IfExpression', condition, then, else: otherwise })
export const Identifier = (name: string): t.Identifier => ({ type: 'Identifier', name })
export const ExpressionStatement = (expr: t.Expression): t.ExpressionStatement => ({ type: 'ExpressionStatement', expression: expr })
export const BinaryExpression = (left: t.Expression, operator: t.BinaryExpression['operator'], right: t.Expression): t.BinaryExpression => ({ type: 'BinaryExpression', left, operator, right })
export const TypedArgument = (name: string, type: t.Type, mutable = false): t.TypedArgument => ({ type: 'TypedArgument', name, argType: type, mutable })
export const EmptyStatement = (): t.EmptyStatement => ({ type: 'EmptyStatement' })
export const TakeStatement = (expr: t.Expression): t.TakeStatement => ({ type: 'TakeStatement', value: expr })
export const ReturnStatement = (expr: t.Expression): t.ReturnStatement => ({ type: 'ReturnStatement', value: expr })
export const FunctionExpression = (args: NT<t.FunctionExpression>): t.FunctionExpression => ({ type: 'FunctionExpression', ...args })
export const TypeExpression = (args: NT<t.TypeExpression>): t.TypeExpression => ({ type: 'TypeExpression', ...args })
export const FunctionCall = (func: t.Expression, args: t.Expression[] = []): t.FunctionCall => ({ type: 'FunctionCall', expression: func, params: args })
export const TypeEmpty = (): t.TypeEmpty => ({ type: 'TypeEmpty' })
export const TypePrimitive = (type: t.Primitives): t.Primitive => ({ type: 'PrimitiveType', value: type })
export const AssignmentStatement = (left: t.AssignmentStatement['left'], operator: t.AssignmentStatement['operator'], right: t.AssignmentStatement['right']): t.AssignmentStatement => ({ type: 'AssignmentStatement', left, right, operator })
export const VariableDeclarationStatement = (args: NT<t.VariableDeclarationStatement>): t.VariableDeclarationStatement => ({ type: 'VariableDeclarationStatement', ...args })