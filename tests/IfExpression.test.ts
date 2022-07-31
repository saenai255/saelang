import { BlockExpression, BlockStatement, ExpressionStatement, Identifier, IfExpression, IfStatement, NumericLiteral, Program, TakeStatement, VariableDeclarationStatement } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('IfExpression', () => {
    test('Only with then', () => expectTree(`
        if 3 {
            take 5;
        }
        `,
        Program(
            IfStatement(
                NumericLiteral(3),
                BlockStatement(
                    TakeStatement(NumericLiteral(5)))))))

    test('With then and else', () => expectTree(`
        if 3 {
            take 5;
        } else {
            take 2;
        }
        `,
        Program(
            IfStatement(
                NumericLiteral(3),
                BlockStatement(
                    TakeStatement(NumericLiteral(5))),
                BlockStatement(
                    TakeStatement(NumericLiteral(2)))))))

    test('With nested if', () => expectTree(`
        if 3 {
            take 5;
        } else {
            take if 5 {
                take 5;
            } else {
                take 6;
            };
        }
        `,
        Program(
            IfStatement(NumericLiteral(3),
                BlockStatement(
                    TakeStatement(NumericLiteral(5))),
                BlockStatement(
                    TakeStatement(
                        IfExpression(NumericLiteral(5),
                            BlockExpression(
                                TakeStatement(NumericLiteral(5))),
                            BlockExpression(
                                TakeStatement(NumericLiteral(6))))))))))

    test('With nested if as expression', () => expectTree(`
        let _ = if 3 {
            take 5;
        } else if 5 {
            take 5;
        } else {
            take 6;
        };
        `,
        Program(
            VariableDeclarationStatement({
                mutable: false,
                left: Identifier('_'),
                public: false,
                right: IfExpression(
                    NumericLiteral(3),
                    BlockExpression(
                        TakeStatement(NumericLiteral(5))),
                    BlockExpression(
                        TakeStatement(
                            IfExpression(NumericLiteral(5),
                                BlockExpression(
                                    TakeStatement(NumericLiteral(5))),
                                BlockExpression(
                                    TakeStatement(NumericLiteral(6))))))),
                ttype: null
            }))))
});
