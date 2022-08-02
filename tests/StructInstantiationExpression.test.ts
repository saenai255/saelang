import { ExpressionStatement, Identifier, Program, StructInstantiationExpression, TypeIdentifier } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('StructInstantiationExpression', () => {
    test(`empty struct`, () => expectTree(
        `
        Number {};
        `,
        Program(
            ExpressionStatement(
                StructInstantiationExpression(
                    TypeIdentifier('Number'))))))
})