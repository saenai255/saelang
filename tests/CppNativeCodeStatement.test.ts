import { BlockExpression, BlockStatement, CppNativeCodeStatement, ExpressionStatement, Program, StringLiteral, TypedArgument, TypeFunction, TypePrimitive } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('CppNativeCodeStatement', () => {
    test('Embedded code exposes function correctly', () => expectTree(
        `
$C++(
    int sum(int a, int b) {
        return a + b;
    }
) exposing(sum (a i32, b i32) i32);
        `,
        Program(
            CppNativeCodeStatement(`
    int sum(int a, int b) {
        return a + b;
    }
`, [
                TypedArgument(
                    'sum',
                    TypeFunction({
                        genericTypes: [],
                        paramTypes: [
                            TypedArgument('a', TypePrimitive('i32'), false),
                            TypedArgument('b', TypePrimitive('i32'), false)
                        ],
                        returnType: TypePrimitive('i32')
                    }),
                    false
                )]))))
})