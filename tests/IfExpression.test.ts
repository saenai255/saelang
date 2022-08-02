import { BlockExpression, BlockStatement, ExpressionStatement, Identifier, IfExpression, IfStatement, NumericLiteral, Program, TakeStatement, VariableDeclarationStatement } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('IfExpression', () => {
    test('With nested if as expression', () => expectTree(`
        let _ = if 3 do {
            take 5;
        } else if 5 do {
            take 5;
        } else do {
            take 6;
        };
        `,
        Program(
            VariableDeclarationStatement({
                left: Identifier('_'),
                mutable: false,
                public: false,
                ttype: null,
                right: IfExpression(
                    NumericLiteral(3),
                    BlockExpression(
                        TakeStatement(NumericLiteral(5))),
                    IfExpression(NumericLiteral(5),
                        BlockExpression(
                            TakeStatement(NumericLiteral(5))),
                        BlockExpression(
                            TakeStatement(NumericLiteral(6)))))
            }))))
});
