import AST from './AST';
import * as S from './AST';
import * as C from './CAST';

type Parent = { node: C.Node; parent: Parent };

export default class CAssembler {
    private ast: AST = null;

    assembleCAST(ast: AST): C.AST {
        this.ast = ast;

        const cast: C.AST = {
            type: 'Program',
            body: []
        };

        const stmtList = new C.StatementList(cast);
        for (const stmt of ast.body) {
            const cStmt = this.Statement({ node: stmtList, parent: null }, stmt);

            if (cStmt) {
                stmtList.push(cStmt)
            }
        }

        cast.body = stmtList.statements;
        return cast;
    }

    Statement(parent: Parent, node: S.Statement): C.Statement {
        switch (node.type) {
            case 'AssignmentStatement': return this.AssignmentStatement(parent, node);
            case 'DeferStatement': return this.DeferStatement(parent, node);
            default:
                throw new Error('No handler found for Statement[' + node.type + ']')
        }
    }

    AssignmentStatement(parent: Parent, node: S.AssignmentStatement): C.AssignmentStatement {
        const stmt: C.AssignmentStatement = {
            type: 'AssignmentStatement',
            left: {
                type: 'Identifier',
                name: `__module_name__${}`
            },
            right: null,
            operator: node.operator
        }

        stmt.right = node.right ? this.Expression({ node: stmt, parent }, node.right) : null
        return stmt;
    }

    DeferStatement(parent: Parent, node: S.DeferStatement): null {
        (parent.node as C.StatementList).defer(this.Statement(parent, node.stmt));
        return null
    }

    Expression(parent: Parent, node: S.Expression): C.Expression {
        if (['BlockExpression', 'LoopExpression', 'LoopOverExpression', 'IfExpression', 'FunctionExpression'].includes(node.type)) {

        }

        return this[node.type](parent, node);
    }

    Identifier(parent: Parent, node: S.Identifier): C.Identifier {
        return {
            type: 'Identifier',
            name: this.sToCName(node.name, parent)
        }
    }






    private sToCName(name: string, parent: Parent): string {
        let p = parent;
        while (p) {
            if (p.node.type === 'FunctionStatement') {
                return name;
            }

            p = p.parent;
        }

        return `__module_name__${name}`;
    }
}