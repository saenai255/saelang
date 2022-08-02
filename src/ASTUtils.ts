import 'colors';
import * as t from './AST'

export type NT<T> = Omit<T, 'type'>;

export const Program = (...stmts: t.Statement[]): t.default => ({ type: 'Program', body: stmts })
export const NumericLiteral = (value: number): t.NumericLiteral => ({ type: 'NumericLiteral', value })
export const CppNativeCodeStatement = (code: string, exposing: t.TypedArgument[]): t.CppNativeCodeStatement => ({ type: 'CppNativeCodeStatement', code, exposing })
export const StringLiteral = (value: string): t.StringLiteral => ({ type: 'StringLiteral', value })
export const BooleanLiteral = (value: boolean): t.BooleanLiteral => ({ type: 'BooleanLiteral', value })
export const BlockExpression = (...stmts: t.Statement[]): t.BlockExpression => ({ type: 'BlockExpression', body: stmts })
export const BlockStatement = (...stmts: t.Statement[]): t.BlockStatement => ({ type: 'BlockStatement', body: stmts })
export const IfExpression = (condition: t.Expression, then: t.BlockExpression, otherwise: t.BlockExpression = null): t.IfExpression => ({ type: 'IfExpression', condition, then, else: otherwise })
export const IfStatement = (condition: t.Expression, then: t.BlockStatement, otherwise: t.BlockStatement = null): t.IfStatement => ({ type: 'IfStatement', condition, then, else: otherwise })
export const Identifier = (name: string): t.Identifier => ({ type: 'Identifier', name })
export const TypeIdentifier = (name: string): t.TypeIdentifier => ({ type: 'TypeIdentifier', name })
export const ExpressionStatement = (expr: t.Expression): t.ExpressionStatement => ({ type: 'ExpressionStatement', expression: expr })
export const StructInstantiationExpression = (ttype: t.TypeIdentifier, args: [t.Identifier, t.Expression][] = []): t.StructInstantiationExpression => ({ type: 'StructInstantiationExpression', ttype, attributes: args })
export const BinaryExpression = (left: t.Expression, operator: t.BinaryExpression['operator'], right: t.Expression): t.BinaryExpression => ({ type: 'BinaryExpression', left, operator, right })
export const TypedArgument = (name: string, type: t.Type, mutable = false): t.TypedArgument => ({ type: 'TypedArgument', name, argType: type, mutable })
export const TypeFunction = (args: NT<t.TypeFunction>): t.TypeFunction => ({ type: 'TypeFunction', ...args });
export const EmptyStatement = (): t.EmptyStatement => ({ type: 'EmptyStatement' })
export const TakeStatement = (expr: t.Expression): t.TakeStatement => ({ type: 'TakeStatement', value: expr })
export const ReturnStatement = (expr: t.Expression): t.ReturnStatement => ({ type: 'ReturnStatement', value: expr })
export const FunctionDeclarationStatement = (args: NT<t.FunctionDeclarationStatement>): t.FunctionDeclarationStatement => ({ type: 'FunctionDeclarationStatement', ...args })
export const FunctionCall = (func: t.Expression, args: t.Expression[] = []): t.FunctionCall => ({ type: 'FunctionCall', expression: func, params: args })
export const TypeEmpty = (parent?: t.Component): t.TypeEmpty => ({ type: 'TypeEmpty', ...(parent ? { parent } : {}) })
export const TypePrimitive = (type: t.Primitives): t.Primitive => ({ type: 'PrimitiveType', value: type })
export const AssignmentStatement = (left: t.AssignmentStatement['left'], operator: t.AssignmentStatement['operator'], right: t.AssignmentStatement['right']): t.AssignmentStatement => ({ type: 'AssignmentStatement', left, right, operator })
export const VariableDeclarationStatement = (args: NT<t.VariableDeclarationStatement>): t.VariableDeclarationStatement => ({ type: 'VariableDeclarationStatement', ...args })
export const InterfaceDeclarationStatement = (args: NT<t.InterfaceDeclarationStatement>): t.InterfaceDeclarationStatement => ({ type: 'InterfaceDeclarationStatement', ...args })
export const StructDeclarationStatement = (args: NT<t.StructDeclarationStatement>): t.StructDeclarationStatement => ({ type: 'StructDeclarationStatement', ...args })
export const MemberExpression = (expr: t.Expression, property: t.Identifier): t.MemberExpression => ({ type: 'MemberExpression', expression: expr, property })
export const IndexExpression = (expr: t.Expression, index: t.Expression): t.IndexExpression => ({ type: 'IndexExpression', expression: expr, index })
export const FireStatement = (functionCall: t.FunctionCall): t.FireStatement => ({ type: 'FireStatement', functionCall })
export const DeferStatement = (stmt: t.Statement): t.DeferStatement => ({ type: 'DeferStatement', stmt })
export const LoopStatement = (body: t.BlockStatement, condition: t.Expression = { type: 'BooleanLiteral', value: true }): t.LoopStatement => ({ type: 'LoopStatement', body, condition })
export const LoopOverStatement = (iterable: t.Expression, body: t.BlockStatement, alias: t.Identifier = { type: 'Identifier', name: 'it' }): t.LoopOverStatement => ({ type: 'LoopOverStatement', body, alias, iterable })
export const ContinueStatement = (): t.ContinueStatement => ({ type: 'ContinueStatement' })
export const BreakStatement = (): t.BreakStatement => ({ type: 'BreakStatement' })

export const getChildren = (component: t.Component): t.Component[] => {
    switch (component.type) {
        case 'Program':
            return component.body
        case 'AssignmentStatement':
            return [component.left, component.right]
        case 'BinaryExpression':
            return [component.left, component.right]
        case 'BlockExpression':
            return component.body
        case 'BlockStatement':
            return component.body
        case 'DeferStatement':
            return [component.stmt]
        case 'FireStatement':
            return [component.functionCall]
        case 'ExpressionStatement':
            return [component.expression]
        case 'FunctionDeclarationStatement':
            return getChildren(component.body)
        case 'LoopStatement':
        case 'LoopOverStatement':
            return getChildren(component.body)
        case 'TakeStatement':
            return getChildren(component.value)
        case 'IfExpression':
            return [component.then, ...(component.else ? [component.else] : [])]
        case 'IfStatement':
            return [component.then, ...(component.else ? [component.else] : [])]
        case 'VariableDeclarationStatement':
            return component.right ? [component.right] : []
    }

    return []
}

export const getChildrenOfType = (component: t.Component, type: t.Component['type']) => {
    return getChildren(component).filter(it => it.type === type)
}

export const getAllChildrenOfType = (component: t.Component, type: t.Component['type']) => {
    let out = []
    if (component.type === type) {
        out.push(component)
    }

    const children = getChildren(component);
    for (const child of children) {
        out = [...out, ...getAllChildrenOfType(child, type)]
    }

    return out
}