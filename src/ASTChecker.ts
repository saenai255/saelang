import * as Sae from './AST';
import { getAllChildrenOfType, getChildren, getChildrenOfType } from './ASTUtils';
import { SaeSyntaxError } from './Error';
import { componentTokenMap } from './Parser';

let id = 0;
const nextFreeId = (prefix) => '__GEN__' + prefix + '__' + (++id) + '__' + (new Array(10).fill(0).map(() => Math.floor(Math.random() * 10)).join(''))

const assert = (component: Sae.Component, condition: boolean, message: string) => {
    if (!condition) {
        const token = componentTokenMap.get(component);
        if (!token) {
            throw new Error(message);
        } else {
            throw new SaeSyntaxError(message, token);
        }
    }
}

const saeToCppIdentifiers = {
    printf: 'printf',
    sprintf: 'sprintf'
};

export default class ASTChecker {
    public check(ast: Sae.Component) {
        this.applyTypes(ast);
        this.checkIdentifiers(ast);
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
                        assert(component, rType.type === lType.type, `Right-side expression type '${rType}' does not match left-side expression type '${lType}'.`)
                        return lType;
                    }

                    if (lType || rType) {
                        return lType || rType
                    }

                    assert(component, false, 'Neither left-side nor right-side expressions have deducable types.')
                }
            }
            case 'VariableDeclarationStatement': {
                if (component.ttype) {
                    return component.ttype
                }

                if (component.right) {
                    return this.resolveType(component.right)
                }

                assert(component, false, 'Uninitialised variable declarations must have a type.')
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
                assert(component, !!component.else, 'If expressions must have both branches.')
                const thenTakeStmts = getChildrenOfType(component.then, 'TakeStatement');
                const elseTakeStmts = getChildrenOfType(component.else, 'TakeStatement');

                if (thenTakeStmts.length + elseTakeStmts.length > 0) {
                    assert(component.then, thenTakeStmts.length > 0, 'if **then** branch must have at least 1 take statement.')
                    assert(component.else, elseTakeStmts.length > 0, 'if **else** branch must have at least 1 take statement.')

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
                    assert(component, !!parent, `Identifier ${component.name} not found in context.`)

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

    private checkIdentifiers(ast: Sae.Component) {
        const ids = getAllChildrenOfType(ast, 'Identifier') as any as Sae.Identifier[];
        const fnCalls = getAllChildrenOfType(ast, 'FunctionCall') as any as Sae.FunctionCall[];

        ([
            ...ids,
            ...fnCalls
                .map(it => it.expression)
                .filter(it => it.type === 'Identifier')
        ] as Sae.Identifier[]).forEach((it: Sae.Identifier) => {
            assert(it, !!this.doesVarDeclOrFuncExistInContext(it.name, it), `Identifier '${it.name}' is undefined.`)
        });
    }

    private doesVarDeclOrFuncExistInContext(name: string, component: Sae.Component & { parent?: Sae.Component }): Sae.FunctionExpression | Sae.VariableDeclarationStatement {
        if (!component.parent) {
            return saeToCppIdentifiers[name] || null;
        }

        const parent = component.parent;
        if (parent.type === 'FunctionExpression' && parent.name === name) {
            return parent
        }

        if (parent.type === 'VariableDeclarationStatement' && parent.left.name === name) {
            return parent;
        }

        const children: Sae.Component[] = getChildren(parent);
        if (children.includes(component as any)) {
            const found = children.slice(0, children.indexOf(component))
                .find(it => {
                    if (it.type === 'FunctionExpression' && it.name === name) {
                        return true
                    }

                    if (it.type === 'VariableDeclarationStatement' && it.left.name === name) {
                        return true;
                    }

                    if (it.type === 'CppNativeCodeStatement' && it.exposing.some(exposed => exposed.name === name)) {
                        return true;
                    }

                    return false
                });

            if (found) {
                return found as any
            }
        }

        return this.doesVarDeclOrFuncExistInContext(name, parent);
    }
}