import { ExpressionStatement, Program, StringLiteral } from "../src/ASTUtils"
import { SaeSyntaxError } from "../src/Error"
import { expectError, expectTree } from "./util"

describe('StringLiteral', () => {
    test('Simple value using double quotes', () => expectTree(
        `"helloo";`,
        Program(
            ExpressionStatement(
                StringLiteral('helloo')))))

    test('Simple value using single quotes', () => expectTree(
        `'helloo';`,
        Program(
            ExpressionStatement(
                StringLiteral('helloo')))))

    test('Missing ;', () => expectError(`'heyoo'`, SaeSyntaxError))
    test('Multiple values', () => expectTree(
        `
        'hello';
        'world';
        `,
        Program(
            ExpressionStatement(
                StringLiteral('hello')),
            ExpressionStatement(
                StringLiteral('world')))))
})