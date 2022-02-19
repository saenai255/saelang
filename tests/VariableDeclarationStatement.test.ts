import { Identifier, NumericLiteral, Program, TypePrimitive, VariableDeclarationStatement } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('VariableDeclarationStatement', () => {
    test('simple declaration with value', () => expectTree(
        `let x = 42;`,
        Program(
            VariableDeclarationStatement({
                mutable: false,
                left: Identifier('x'),
                right: NumericLiteral(42),
                ttype: null,
                public: false
            }))))

    test('simple declaration with type and value', () => expectTree(
        `let x i32 = 42;`,
        Program(
            VariableDeclarationStatement({
                mutable: false,
                left: Identifier('x'),
                right: NumericLiteral(42),
                ttype: TypePrimitive('i32'),
                public: false
            }))))

    test('simple declaration with type', () => expectTree(
        `let x i32;`,
        Program(
            VariableDeclarationStatement({
                mutable: false,
                left: Identifier('x'),
                right: null,
                ttype: TypePrimitive('i32'),
                public: false
            }))))

    test('simple mutable declaration type', () => expectTree(
        `let mut x i32;`,
        Program(
            VariableDeclarationStatement({
                mutable: true,
                left: Identifier('x'),
                right: null,
                ttype: TypePrimitive('i32'),
                public: false
            }))))
})