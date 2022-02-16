import { BinaryExpression, BlockStatement, FunctionExpression, Identifier, IfExpression, NumericLiteral, Program, ReturnStatement, TakeStatement, TypedArgument, TypeEmpty, TypePrimitive } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('FunctionExpression', () => {
    test(`empty function`, () => expectTree(
        `fn empty() {}`,
        Program(
            FunctionExpression({
                name: 'empty',
                arguments: [],
                returnType: TypeEmpty(),
                body: BlockStatement()
            }))))

    test(`with return type`, () => expectTree(
        `fn empty() i32 {}`,
        Program(
            FunctionExpression({
                name: 'empty',
                arguments: [],
                returnType: TypePrimitive('i32'),
                body: BlockStatement()
            }))))

    test(`with body`, () => expectTree(
        `fn empty() {
            return 1;
        }`,
        Program(
            FunctionExpression({
                name: 'empty',
                arguments: [],
                returnType: TypeEmpty(),
                body: BlockStatement(
                    ReturnStatement(
                        NumericLiteral(1)))
            }))))

    test(`with single param`, () => expectTree(
        `fn greet(name str) {}`,
        Program(
            FunctionExpression({
                name: 'greet',
                arguments: [
                    TypedArgument('name', TypePrimitive('str'))
                ],
                returnType: TypeEmpty(),
                body: BlockStatement()
            }))))

    test(`with multiple params`, () => expectTree(
        `fn greet(name str, age u8) {}`,
        Program(
            FunctionExpression({
                name: 'greet',
                arguments: [
                    TypedArgument('name', TypePrimitive('str')),
                    TypedArgument('age', TypePrimitive('u8'))
                ],
                returnType: TypeEmpty(),
                body: BlockStatement()
            }))))

    test(`complex function`, () => expectTree(
        `fn foo(nr i32, double bool) i32 {
            return if double {
                take nr * 2;
            } else {
                take nr * 10;
            }
        }`,
        Program(
            FunctionExpression({
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
                            BlockStatement(
                                TakeStatement(
                                    BinaryExpression(
                                        Identifier('nr'),
                                        '*',
                                        NumericLiteral(2)))),
                            BlockStatement(
                                TakeStatement(
                                    BinaryExpression(
                                        Identifier('nr'),
                                        '*',
                                        NumericLiteral(10)))))))
            }))))
})