import { AssignmentStatement, Identifier, NumericLiteral, Program, TypePrimitive, VariableDeclarationStatement } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('AssignmentStatement', () => {
    test('simple assignment', () => expectTree(
        `x = 42;`,
        Program(
            AssignmentStatement(
                Identifier('x'),
                '=',
                NumericLiteral(42)))))

    test('var declaration with assignment', () => expectTree(
        `let x = 42;`,
        Program(
            VariableDeclarationStatement({
                left: Identifier('x'),
                right: NumericLiteral(42),
                mutable: false,
                public: false,
                ttype: null
            }))))

    test('mutable var declaration with assignment', () => expectTree(
        `let mut x = 42;`,
        Program(
            VariableDeclarationStatement({
                left: Identifier('x'),
                right: NumericLiteral(42),
                mutable: true,
                public: false,
                ttype: null
            }))))

    test('public mutable var declaration with assignment', () => expectTree(
        `pub let mut x = 42;`,
        Program(
            VariableDeclarationStatement({
                left: Identifier('x'),
                right: NumericLiteral(42),
                mutable: true,
                public: true,
                ttype: null
            }))))

    test('public mutable var declaration with assignment and type', () => expectTree(
        `pub let mut x i32 = 42;`,
        Program(
            VariableDeclarationStatement({
                left: Identifier('x'),
                right: NumericLiteral(42),
                mutable: true,
                public: true,
                ttype: TypePrimitive('i32')
            }))))

    test('public mutable var declaration with type', () => expectTree(
        `pub let mut x i32;`,
        Program(
            VariableDeclarationStatement({
                left: Identifier('x'),
                right: null,
                mutable: true,
                public: true,
                ttype: TypePrimitive('i32')
            }))))
})