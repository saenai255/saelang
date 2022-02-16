import { BlockStatement, IfExpression, NumericLiteral, Program, TakeStatement } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('IfExpression', () => {
    test('Only with then', () => expectTree(`
        if 3 {
            take 5;
        }
        `,
        Program(
            IfExpression(
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
            IfExpression(
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
            IfExpression(NumericLiteral(3),
                BlockStatement(
                    TakeStatement(NumericLiteral(5))),
                BlockStatement(
                    TakeStatement(
                        IfExpression(NumericLiteral(5),
                            BlockStatement(
                                TakeStatement(NumericLiteral(5))),
                            BlockStatement(
                                TakeStatement(NumericLiteral(6))))))))))
});
