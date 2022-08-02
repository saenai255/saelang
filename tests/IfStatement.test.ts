import { AssignmentStatement, BlockExpression, BlockStatement, ExpressionStatement, Identifier, IfExpression, IfStatement, NumericLiteral, Program, TakeStatement, VariableDeclarationStatement } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('IfStatement', () => {
    test('Only with then', () => expectTree(`
        if 3 {
            5;
        }
        `,
        Program(
            IfStatement(
                NumericLiteral(3),
                BlockStatement(
                    ExpressionStatement(NumericLiteral(5)))))))

    test('With then and else', () => expectTree(`
        if 3 {
            5;
        } else {
            2;
        }
        `,
        Program(
            IfStatement(
                NumericLiteral(3),
                BlockStatement(
                    ExpressionStatement(NumericLiteral(5))),
                BlockStatement(
                    ExpressionStatement(NumericLiteral(2)))))))

    test('With nested if', () => expectTree(`
        if 3 {
            5;
        } else {
            _ = if 5 do {
                take 5;
            } else do {
                take 6;
            };
        }
        `,
        Program(
            IfStatement(
                NumericLiteral(3),
                BlockStatement(
                    ExpressionStatement(NumericLiteral(5))),
                BlockStatement(
                    AssignmentStatement(
                        Identifier('_'),
                        '=',
                        IfExpression(NumericLiteral(5),
                            BlockExpression(
                                TakeStatement(NumericLiteral(5))),
                            BlockExpression(
                                TakeStatement(NumericLiteral(6))))))))))
});
