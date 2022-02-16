import { ExpressionStatement, NumericLiteral, Program } from "../src/ASTUtils"
import { SaeSyntaxError } from "../src/Error"
import { expectError, expectTree } from "./util"

describe('NumericLiteral', () => {
    test('Simple value', () => expectTree(
        `42;`,
        Program(
            ExpressionStatement(
                NumericLiteral(42)))))

    test('Missing ;', () => expectError(`42`, SaeSyntaxError))

    test('Multiple values', () => expectTree(
        `
        42;
        41;
        `,
        Program(
            ExpressionStatement(
                NumericLiteral(42)),
            ExpressionStatement(
                NumericLiteral(41)))))
})