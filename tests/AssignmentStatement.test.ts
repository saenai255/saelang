import { AssignmentStatement, BlockStatement, ExpressionStatement, Identifier, NumericLiteral, Program, StringLiteral } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('AssignmentStatement', () => {
    test('simple assignment', () => expectTree(
        `x = 42;`,
        Program(
            AssignmentStatement(
                Identifier('x'),
                '=',
                NumericLiteral(42)))))
})