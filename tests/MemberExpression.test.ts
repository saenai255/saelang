import { BinaryExpression, ExpressionStatement, FunctionCall, Identifier, MemberExpression, NumericLiteral, Program } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('MemberExpression', () => {
    test('simple', () => expectTree(
        `a.b;`,
        Program(
            ExpressionStatement(
                MemberExpression(
                    Identifier('a'),
                    Identifier('b'))))))

    test('chained', () => expectTree(
        `a.b.c;`,
        Program(
            ExpressionStatement(
                MemberExpression(
                    MemberExpression(
                        Identifier('a'),
                        Identifier('b')),
                    Identifier('c'))))))

    test('computed', () => expectTree(
        `a.b().c;`,
        Program(
            ExpressionStatement(
                MemberExpression(
                    FunctionCall(
                        MemberExpression(
                            Identifier('a'),
                            Identifier('b'))),
                    Identifier('c'))))))
})