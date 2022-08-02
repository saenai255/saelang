import { BinaryExpression, FunctionDeclarationStatement, Identifier, IfExpression, NumericLiteral, Program, ReturnStatement, TakeStatement, TypedArgument, TypeEmpty, TypePrimitive, BlockStatement, BlockExpression } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('FunctionDeclarationStatement', () => {
    test(`empty function`, () => expectTree(
        `fn empty() {}`,
        Program(
            FunctionDeclarationStatement({
                name: 'empty',
                arguments: [],
                returnType: TypeEmpty(),
                body: BlockStatement(),
                public: false
            }))))

    test(`with return type`, () => expectTree(
        `fn empty() i32 {}`,
        Program(
            FunctionDeclarationStatement({
                name: 'empty',
                arguments: [],
                returnType: TypePrimitive('i32'),
                body: BlockStatement(),
                public: false
            }))))

    test(`with body`, () => expectTree(
        `fn empty() {
            return 1;
        }`,
        Program(
            FunctionDeclarationStatement({
                name: 'empty',
                arguments: [],
                returnType: TypeEmpty(),
                body: BlockStatement(
                    ReturnStatement(
                        NumericLiteral(1))),
                public: false
            }))))

    test(`with single param`, () => expectTree(
        `fn greet(name str) {}`,
        Program(
            FunctionDeclarationStatement({
                name: 'greet',
                arguments: [
                    TypedArgument('name', TypePrimitive('str'))
                ],
                returnType: TypeEmpty(),
                body: BlockStatement(),
                public: false
            }))))

    test(`with multiple params`, () => expectTree(
        `fn greet(name str, age u8) {}`,
        Program(
            FunctionDeclarationStatement({
                name: 'greet',
                arguments: [
                    TypedArgument('name', TypePrimitive('str')),
                    TypedArgument('age', TypePrimitive('u8'))
                ],
                returnType: TypeEmpty(),
                body: BlockStatement(),
                public: false
            }))))

    test(`complex function`, () => expectTree(
        `pub fn foo(nr i32, double bool) i32 {
            return if double do {
                take nr * 2;
            } else do {
                take nr * 10;
            };
        }`,
        Program(
            FunctionDeclarationStatement({
                name: 'foo',
                arguments: [
                    TypedArgument('nr', TypePrimitive('i32')),
                    TypedArgument('double', TypePrimitive('bool'))
                ],
                returnType: TypePrimitive('i32'),
                body: BlockStatement(
                    ReturnStatement(
                        IfExpression(
                            Identifier('double'),
                            BlockExpression(
                                TakeStatement(
                                    BinaryExpression(
                                        Identifier('nr'),
                                        '*',
                                        NumericLiteral(2)))),
                            BlockExpression(
                                TakeStatement(
                                    BinaryExpression(
                                        Identifier('nr'),
                                        '*',
                                        NumericLiteral(10))))))),
                public: true
            }))))
})