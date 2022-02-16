import { BinaryExpression, ExpressionStatement, NumericLiteral, Program } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('BinaryExpression', () => {
    for (const operator of ['+', '-', '*', '/'])
        test(`Simple ${operator} expression`, () => expectTree(
            `42 ${operator} 1;`,
            Program(
                ExpressionStatement(
                    BinaryExpression(
                        NumericLiteral(42),
                        operator as any,
                        NumericLiteral(1))))))

    for (const operator of ['+', '-', '*', '/'])
        test(`Complex ${operator} expression`, () => expectTree(
            `42 ${operator} 1 ${operator} 2;`,
            Program(
                ExpressionStatement(
                    BinaryExpression(
                        BinaryExpression(
                            NumericLiteral(42),
                            operator as any,
                            NumericLiteral(1)),
                        operator as any,
                        NumericLiteral(2))))))

    for (const operator of ['*', '/'])
        test(`Complex expression with ${operator}`, () => expectTree(
            `42 + 1 ${operator} 2;`,
            Program(
                ExpressionStatement(
                    BinaryExpression(
                        NumericLiteral(42),
                        '+',
                        BinaryExpression(
                            NumericLiteral(1),
                            operator as any,
                            NumericLiteral(2)))))))

    for (const operator of ['*', '/'])
        test(`Complex expression with ${operator} and parantheses`, () => expectTree(
            `(42 + 1) ${operator} 2;`,
            Program(
                ExpressionStatement(
                    BinaryExpression(
                        BinaryExpression(
                            NumericLiteral(42),
                            '+',
                            NumericLiteral(1)),
                        operator as any,
                        NumericLiteral(2))))))

    for (const operator of ['>', '<', '==', '!=', '<=', '>=', '||', '&&', '~||', '~&&', '!||', '!&&'])
        test(`Complex boolean expression with ${operator}`, () => expectTree(
            `1 + 1 ${operator} 2;`,
            Program(
                ExpressionStatement(
                    BinaryExpression(
                        BinaryExpression(
                            NumericLiteral(1),
                            '+',
                            NumericLiteral(1)
                        ),
                        operator as any,
                        NumericLiteral(2))))))
})