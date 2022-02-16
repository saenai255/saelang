import { BinaryExpression, ExpressionStatement, FunctionCall, Identifier, NumericLiteral, Program } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('FunctionCall', () => {
    test('simple call, no params', () => expectTree(
        `greet();`,
        Program(
            ExpressionStatement(
                FunctionCall(
                    Identifier('greet'))))))

    test('simple call', () => expectTree(
        `greet(1 + 1);`,
        Program(
            ExpressionStatement(
                FunctionCall(
                    Identifier('greet'),
                    [
                        BinaryExpression(
                            NumericLiteral(1),
                            '+',
                            NumericLiteral(1))
                    ])))))

    test('computed function', () => expectTree(
        `greet(1 + 1)();`,
        Program(
            ExpressionStatement(
                FunctionCall(
                    FunctionCall(
                        Identifier('greet'),
                        [
                            BinaryExpression(
                                NumericLiteral(1),
                                '+',
                                NumericLiteral(1))
                        ]))))))
})