import * as Sae from './AST';
import assert = require('assert');
import { getAllChildrenOfType, getChildren, getChildrenOfType } from './ASTUtils';

let id = 0;
const nextFreeId = (prefix) => '__GEN__' + prefix + '__' + (++id) + '__' + (new Array(10).fill(0).map(() => Math.floor(Math.random() * 10)).join(''))

export default class ASTExpander {
    public expand(ast: Sae.Component) {
        this.applyTypes(ast);
        return ast
    }

    private applyTypes(ast: Sae.Component) {
        getAllChildrenOfType(ast, 'VariableDeclarationStatement')
            .filter((it: Sae.VariableDeclarationStatement) => !it.ttype)
            .forEach((it: Sae.VariableDeclarationStatement) => {
                it.ttype = this.resolveType(it)
            })

        getAllChildrenOfType(ast, 'BinaryExpression')
            .filter((it: Sae.BinaryExpression) => !it.ttype)
            .forEach((it: Sae.BinaryExpression) => {
                it.ttype = this.resolveType(it)
            })

        getAllChildrenOfType(ast, 'IfExpression')
            .filter((it: Sae.IfExpression) => !it.ttype)
            .forEach((it: Sae.IfExpression) => {
                it.ttype = this.resolveType(it)
            })

        getAllChildrenOfType(ast, 'BlockExpression')
            .filter((it: Sae.BlockExpression) => !it.ttype)
            .forEach((it: Sae.BlockExpression) => {
                it.ttype = this.resolveType(it)
            })
    }

    private resolveType(component: Sae.Component): Sae.Type {
        switch (component.type) {
            case 'BinaryExpression': {
                if (['>', '<', '>=', '<=', '==', '!='].includes(component.operator)) {
                    return {
                        type: 'PrimitiveType',
                        value: 'bool'
                    }
                } else {
                    const lType = this.resolveType(component.left)
                    const rType = this.resolveType(component.right)

                    if (lType && rType) {
                        assert(rType.type === lType.type, 'Type mismatch')
                        return lType;
                    }

                    if (lType || rType) {
                        return lType || rType
                    }

                    assert(false, 'no type found')
                }
            }
            case 'VariableDeclarationStatement': {
                if (component.ttype) {
                    return component.ttype
                }

                if (component.right) {
                    return this.resolveType(component.right)
                }

                assert(false, 'uninitialised variable declarations must have a type')
            }
            case 'BlockExpression': {
                const takeStmts = getChildrenOfType(component, 'TakeStatement');
                if (takeStmts.length === 0) {
                    return {
                        type: 'TypeEmpty'
                    }
                }

                return this.resolveType((takeStmts[0] as Sae.TakeStatement).value)
            }
            case 'IfExpression': {
                assert(!!component.else, 'if **expressions** must have both branches')
                const thenTakeStmts = getChildrenOfType(component.then, 'TakeStatement');
                const elseTakeStmts = getChildrenOfType(component.else, 'TakeStatement');

                if (thenTakeStmts.length + elseTakeStmts.length > 0) {
                    assert(thenTakeStmts.length > 0, 'if **then** branch must have at least 1 take statement')
                    assert(elseTakeStmts.length > 0, 'if **else** branch must have at least 1 take statement')

                    return this.resolveType((thenTakeStmts[0] as Sae.TakeStatement).value)
                } else {
                    return {
                        type: 'TypeEmpty',
                        parent: component
                    }
                }
            }
            case 'Identifier': {
                let child = component as Sae.Component
                let parent: Sae.Component = component.parent as any
                while (true) {
                    assert(!!parent, `identifier ${component.name} not found`)

                    if (parent.type === 'BlockExpression') {
                        const childIdx = parent.body.indexOf(child as any)
                        const found: Sae.VariableDeclarationStatement = parent.body.slice(0, childIdx).find(it => it.type === 'VariableDeclarationStatement' && it.left.name === component.name) as any;
                        if (found) {
                            return found.ttype
                        }
                    }

                    if (parent.type === 'FunctionExpression') {
                        const childIdx = parent.body.body.indexOf(child as any)
                        const found: Sae.VariableDeclarationStatement = parent.body.body.slice(0, childIdx).find(it => it.type === 'VariableDeclarationStatement' && it.left.name === component.name) as any;
                        if (found) {
                            return found.ttype
                        }

                        const foundArg: Sae.TypedArgument = parent.arguments.find(it => it.name === component.name) as any;
                        if (foundArg && foundArg.name === component.name) {
                            return foundArg.argType
                        }
                    }

                    if (parent.type === 'Program') {
                        const childIdx = parent.body.indexOf(child as any)
                        const found: Sae.FunctionExpression = parent.body.slice(0, childIdx).find(it => it.type === 'FunctionExpression' && it.name === component.name) as any;
                        if (found) {
                            return found.returnType
                        }
                    }

                    child = parent
                    parent = (parent as any).parent
                }
            }
            case 'StringLiteral':
                return {
                    type: 'PrimitiveType',
                    value: 'str'
                }
            case 'BooleanLiteral':
                return {
                    type: 'PrimitiveType',
                    value: 'bool'
                }
            case 'NumericLiteral':
                return {
                    type: 'PrimitiveType',
                    value: Math.ceil(component.value) === component.value ? 'i32' : 'f64'
                }
        }
    }
}