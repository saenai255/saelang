import { BinaryExpression, DeferStatement, ExpressionStatement, FunctionCall, Identifier, MemberExpression, NumericLiteral, Program, ReturnStatement } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('DeferStatement', () => {
    test('defer function call', () => expectTree(
        `defer cleanup();`,
        Program(
            DeferStatement(
                ExpressionStatement(
                    FunctionCall(
                        Identifier('cleanup')))))))

    test('defer return expression', () => expectTree(
        `defer return 1+1;`,
        Program(
            DeferStatement(
                ReturnStatement(
                    BinaryExpression(
                        NumericLiteral(1),
                        '+',
                        NumericLiteral(1)))))))

    test('defer complex call', () => expectTree(
        `defer some.resource.free();`,
        Program(
            DeferStatement(
                ExpressionStatement(
                    FunctionCall(
                        MemberExpression(
                            MemberExpression(
                                Identifier('some'),
                                Identifier('resource')),
                            Identifier('free'))))))))
})