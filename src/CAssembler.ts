import AST from './AST';
import * as S from './AST';
import * as C from './CAST';
import assert = require('assert');

type NodeComp<T, S = T> = { node: T, parent: NodeComp<S> }
type CComp = NodeComp<C.Component>;
type SComp = NodeComp<S.Component>

type ExtendedComputedExpression<T> = T & { varName: string }
const deepCopy = <T>(it: T): T => JSON.parse(JSON.stringify(it))

type GenericIdentifier = {
    name: string;
    type: S.Type;
    mutable: boolean
}
class Context {
    private identifiers: GenericIdentifier[] = []
    constructor(ctx?: Context) {
        if (ctx) {
            this.identifiers.push(...ctx.identifiers)
        }
    }

    clone(): Context {
        return new Context(this)
    }

    add(id: GenericIdentifier): Context {
        if (this.identifiers.some(x => x.name === id.name)) {
            throw new Error(`Identifier ${id.name} is already defined.`)
        }

        this.identifiers.push(id)
        return this
    }

    assertExists(name: string): Context {
        if (!this.identifiers.some(x => x.name === name)) {
            throw new Error(`Identifier ${name} is not defined.`)
        }
        return this
    }

    get(name: string): GenericIdentifier {
        this.assertExists(name);
        return this.identifiers.find(x => x.name === name)
    }

    getOrNull(name: string): GenericIdentifier {
        return this.identifiers.find(x => x.name === name) || null
    }
}
export default class CAssembler {
    functions: NodeComp<S.FunctionExpression>[] = [];

    constructor(private ast: AST) {
        this.ast = deepCopy(ast)
        this.functions = this.childrenOfType({ node: ast, parent: null }, 'FunctionExpression')
    }

    assembleCAST(): C.AST {
        const cast: C.AST = {
            type: 'Program',
            body: []
        };

        this.fixupTypes();
        this.fixupReturnStatements();
        this.fixupFunctions();
        for (const func of this.functions) {
            this.fixupDeferStatements(func.node, []);
        }
        this.fixupTakeStatements()
        this.fixupComputedExpressions()
        console.dir(this.ast, { depth: 100 })
        return null

        const stmtList = new C.StatementList(cast);
        for (const stmt of this.ast.body) {
            const cStmt = this.Statement({ node: stmtList, parent: null }, stmt);

            if (cStmt) {
                stmtList.push(cStmt)
            }
        }

        cast.body = stmtList.statements;
        return cast;
    }

    fixupTypes() {
        const globalContext = new Context()
        for (const stmt of this.ast.body) {
            switch (stmt.type) {
                case 'FunctionExpression':
                    globalContext.add({
                        name: stmt.name,
                        mutable: false,
                        type: {
                            type: 'TypeFunction',
                            genericTypes: [],
                            paramTypes: stmt.arguments.map(arg => arg.argType),
                            returnType: stmt.returnType
                        }
                    })
                    break
            }
        }



        for (const func of this.functions) {
            const funcContext = globalContext.clone()
            for (const stmt of func.node.body.body) {
                this.fixStatementType(funcContext, stmt)
            }
        }
    }



    getAndFixExpressionType(ctx: Context, { node: expr, parent }: NodeComp<S.Expression, any>): S.Type {
        const boolType: S.Primitive = {
            type: 'PrimitiveType',
            value: 'bool'
        }

        const makeComp = (expr: S.Expression | S.Statement): NodeComp<any, any> => ({ node: expr, parent: { node: stmt, parent: parent as any } })
        switch (expr.type) {
            case ''
        }
    }

    fixStatementType(ctx: Context, { node: stmt, parent }: NodeComp<S.Statement, any>) {
        const boolType: S.Primitive = {
            type: 'PrimitiveType',
            value: 'bool'
        }

        const makeComp = (expr: S.Expression | S.Statement): NodeComp<any, any> => ({ node: expr, parent: { node: stmt, parent: parent as any } })

        switch (stmt.type) {
            case 'VariableDeclarationStatement': {
                if (!stmt.ttype) {
                    stmt.ttype = this.getAndFixExpressionType(ctx.clone(), makeComp(stmt.right))
                }
                assert.deepStrictEqual(this.getAndFixExpressionType(ctx.clone(), makeComp(stmt.right)), stmt.ttype)
                break
            }
            case 'AssignmentStatement': {
                const t = ctx.get(stmt.left.name)
                assert.deepStrictEqual(this.getAndFixExpressionType(ctx.clone(), makeComp(stmt.right)), t.type)
                break
            }
            case 'ExpressionStatement': {
                this.getAndFixExpressionType(ctx.clone(), makeComp(stmt.expression))
                break
            }
            case 'ReturnStatement': {
                const [func] = this.parentsOfType<S.FunctionExpression>({ node: stmt, parent }, 'FunctionExpression')
                assert.deepStrictEqual(this.getAndFixExpressionType(ctx.clone(), makeComp(stmt.value)), ctx.get(func.node.name).type)
                break
            }
            case 'IfExpression': {
                assert.deepStrictEqual(this.getAndFixExpressionType(ctx.clone(), makeComp(stmt.condition)), boolType)
                break
            }
            case 'LoopExpression': {
                assert.deepStrictEqual(this.getAndFixExpressionType(ctx.clone(), makeComp(stmt.condition)), boolType)
                this.fixStatementType(ctx.clone(), makeComp(stmt.body))
                break
            }
            case 'LoopOverExpression': {
                assert.deepStrictEqual(this.getAndFixExpressionType(ctx.clone(), makeComp(stmt.iterable)).type, 'TypeArray')
                this.fixStatementType(ctx.clone().add({
                    type: (this.getAndFixExpressionType(ctx.clone(), makeComp(stmt.iterable)) as any as S.TypeArray).inner,
                    mutable: false,
                    name: stmt.alias.name
                }), makeComp(stmt.body))
                break
            }
            case 'DeferStatement': {
                this.fixStatementType(ctx.clone(), makeComp(stmt.stmt))
                break
            }
        }
    }

    private counter = 0;
    makeVarName(postfix: string): string {
        return `__${++this.counter}__${postfix}`
    }

    fixupComputedExpressions() {
        const ifExprs = this.childrenOfType<S.IfExpression>({ node: this.ast, parent: null }, 'IfExpression');
        for (const ifExpr of ifExprs) {
            const parent = ifExpr.parent.node
            if (parent.type === 'BlockExpression' as any) {
                continue
            }

            const { block, index } = this.findParentBlock(parent);
            block.body.splice(index, 0, deepCopy(ifExpr.node))
            this.replaceNode(ifExpr.node, {
                type: 'Identifier',
                name: (ifExpr.node as ExtendedComputedExpression<S.IfExpression>).varName
            });
        }
    }

    fixupReturnStatements() {
        const blocks = this.childrenOfType<S.BlockExpression>({ node: this.ast, parent: null }, 'BlockExpression');
        for (const blockExpr of blocks) {
            const newBody: S.Statement[] = []
            for (const stmt of blockExpr.node.body) {
                if (stmt.type === 'ReturnStatement') {
                    const varName = this.makeVarName('computed_return_expr')
                    const varDecl: S.VariableDeclarationStatement = {
                        type: 'VariableDeclarationStatement',
                        left: {
                            type: 'Identifier',
                            name: varName
                        },
                        mutable: true,
                        public: false,
                        right: stmt.value,
                        ttype: null
                    };
                    const retStmt: S.ReturnStatement = {
                        type: 'ReturnStatement',
                        value: {
                            type: 'Identifier',
                            name: varName
                        }
                    }

                    newBody.push(varDecl, retStmt);
                } else {
                    newBody.push(stmt)
                }
            }
            blockExpr.node.body = newBody
        }
    }

    fixupTakeStatements() {
        const takeStatements = this.childrenOfType<S.TakeStatement>({ node: this.ast, parent: null }, 'TakeStatement');
        for (const takeStmt of takeStatements) {
            let varDecl: S.VariableDeclarationStatement = this.findTakeVariableDecl(takeStmt.parent.node)
            if (!varDecl) {
                const varName = this.makeVarName('computed_take_expr')
                varDecl = {
                    type: 'VariableDeclarationStatement',
                    left: {
                        type: 'Identifier',
                        name: varName
                    },
                    mutable: true,
                    public: false,
                    right: null,
                    ttype: null
                }

                this.addBefore(takeStmt.parent.node, varDecl);
                (takeStmt.parent.parent.node as any as ExtendedComputedExpression<S.IfExpression>).varName = varName
            }

            this.replaceNode(takeStmt.node, {
                type: 'AssignmentStatement',
                left: {
                    type: 'Identifier',
                    name: varDecl.left.name,
                },
                operator: '=',
                right: takeStmt.node.value
            })
        }
    }

    replaceNode(node: S.Component, replacement: S.Component) {
        debugger
        for (const key of Object.keys(node)) {
            delete node[key]
        }

        Object.assign(node, replacement);
    }

    findParentBlock(node: S.Component): { block: S.BlockExpression, index: number } {
        const found = this.findSComponent(node);
        debugger

        if (!found) {
            throw new Error(`Component ${JSON.stringify(node)} not found.`)
        }

        let blockChild: NodeComp<S.BlockExpression> = found.result as any
        while (blockChild.parent?.node && blockChild.parent.node.type !== 'BlockExpression') {
            blockChild = blockChild.parent
        }

        if (!blockChild.parent?.node) {
            throw new Error('unreachable')
        }

        return {
            block: blockChild.parent.node,
            index: blockChild.parent.node.body.indexOf(blockChild.node)
        }
    }

    addBefore(node: S.Component, ...extras: S.Component[]) {
        const { block, index } = this.findParentBlock(node);
        block.body.splice(index, 0, ...(extras as any));
    }

    findTakeVariableDecl(node: S.Component): S.VariableDeclarationStatement {
        const { block, index } = this.findParentBlock(node);
        if (index === 0) {
            return null
        }

        const decl = block.body[index - 1];
        const ifExpr = block.body[index];
        if (decl.type === 'VariableDeclarationStatement' && decl.left.name.includes('computed_take_expr')) {
            return decl;
        }
        return null;
    }

    fixupFunctions() {
        const newFuncs: NodeComp<S.FunctionExpression>[] = []
        for (const func of this.functions) {
            newFuncs.push(func)

            if (func.parent === null || func.parent.node.type === 'Program' as any) {
                continue
            }

            func.node.name = this.makeVarName(`${func.node.name}__callback`);
            const identifier: S.Identifier = {
                type: 'Identifier',
                name: '&' + func.node.name
            }

            this.replaceNode(func.node, identifier);

            this.ast.body = [
                func.node,
                ...this.ast.body
            ]
        }
    }

    fixupDeferStatements(node: S.Statement, toDefer: S.Statement[]) {
        const inheritedDefers: S.Statement[] = [...toDefer]
        const localDefers: S.Statement[] = []

        if (node.type === 'BlockExpression') {
            const newBody: S.Statement[] = []
            for (const stmt of node.body) {
                if (stmt.type === 'DeferStatement') {
                    inheritedDefers.push(stmt.stmt)
                    localDefers.push(stmt.stmt)
                } else {
                    if (stmt.type === 'ReturnStatement') {
                        for (const defStmt of inheritedDefers.reverse()) {
                            newBody.push(defStmt)
                        }
                    } else {
                        this.fixupDeferStatements(stmt, inheritedDefers)
                    }
                    newBody.push(stmt);
                }
            }
            node.body = newBody
            if (node.body.every(s => s.type !== 'ReturnStatement')) {
                node.body.push(...localDefers.reverse())
            }
        } else {
            for (const value of Object.values(node || {})) {
                if (typeof value === 'object' && !!value) {
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            this.fixupDeferStatements(item, inheritedDefers)
                        }
                    } else {
                        this.fixupDeferStatements(value, inheritedDefers)
                    }
                }
            }
        }


    }

    Statement(parent: CComp, node: S.Statement): C.Statement {
        switch (node.type) {
            case 'AssignmentStatement': return this.AssignmentStatement(parent, node);
            case 'DeferStatement': return this.DeferStatement(parent, node);
            default:
                throw new Error('No handler found for Statement[' + node.type + ']')
        }
    }

    AssignmentStatement(parent: CComp, node: S.AssignmentStatement): C.AssignmentStatement {
        const stmt: C.AssignmentStatement = {
            type: 'AssignmentStatement',
            left: {
                type: 'Identifier',
                name: `asd`
            },
            right: null,
            operator: node.operator
        }

        stmt.right = node.right ? this.Expression({ node: stmt, parent }, node.right) : null
        return stmt;
    }

    DeferStatement(parent: CComp, node: S.DeferStatement): null {
        (parent.node as C.StatementList).defer(this.Statement(parent, node.stmt));
        return null
    }

    Expression(parent: CComp, node: S.Expression): C.Expression {
        if (['BlockExpression', 'LoopExpression', 'LoopOverExpression', 'IfExpression', 'FunctionExpression'].includes(node.type)) {

        }

        return this[node.type](parent, node);
    }

    Identifier(parent: CComp, node: S.Identifier): C.Identifier {
        return {
            type: 'Identifier',
            name: this.sToCName(node.name, parent)
        }
    }






    private sToCName(name: string, parent: CComp): string {
        let p = parent;
        while (p) {
            if (p.node.type === 'FunctionStatement') {
                return name;
            }

            p = p.parent;
        }

        return `__module_name__${name}`;
    }

    private childrenOfType<T extends S.Component | C.Component>(component: NodeComp<S.Component | C.Component>, type: T['type']): NodeComp<T>[] {
        if (!component.node || (!component.node.type && !Array.isArray(component.node))) {
            return []
        }

        const out: NodeComp<T>[] = [];

        if (component.node.type === type) {
            out.push(component as any);
        }

        for (const value of Object.values(component.node) as any) {
            try {
                out.push(...this.childrenOfType({ node: value, parent: (Array.isArray(component.node) ? component.parent : component) as any }, type))
            } catch { }
        }

        return out;
    }

    private findSComponent<T>(node: S.Component, start: SComp = { node: this.ast, parent: null }, key: string | number = null): { result: NodeComp<T>, key: string | number } {
        if (!start.node || (!start.node.type && !Array.isArray(start.node))) {
            return null
        }

        if (start.node === node) {
            return { result: start as any as NodeComp<T>, key }
        }

        for (const [key, value] of Object.entries(start.node) as any) {
            try {

                const found = this.findSComponent(node, { node: value, parent: (Array.isArray(start.node) ? start.parent : start) as any }, key)
                if (found !== null) {
                    return found as any
                }
            } catch { }
        }

        return null;
    }

    private parentsOfType<T extends S.Component | C.Component>(component: NodeComp<S.Component | C.Component>, type: T['type']): NodeComp<T>[] {
        if (!component.parent || (!component.parent.node?.type && !Array.isArray(component.parent?.node))) {
            return []
        }

        const out: NodeComp<T>[] = [];

        if (component.parent.node.type === type) {
            out.push(component as any);
        }

        for (const value of Object.values(component.parent.node) as any) {
            try {
                out.push(...this.childrenOfType({ node: value, parent: (Array.isArray(component.parent.node) ? component.parent.parent?.node : component.parent?.node) as any }, type))
            } catch { }
        }

        return out;
    }
}