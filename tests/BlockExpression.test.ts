import { BlockExpression, BlockStatement, ExpressionStatement, NumericLiteral, Program, StringLiteral, TakeStatement } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('BlockExpression', () => {
    test('with a take statement', () => expectTree(
        `
        do {
            take 5;
        };
        `,
        Program(
            ExpressionStatement(
                BlockExpression(
                    TakeStatement(
                        NumericLiteral(5)))))))
})