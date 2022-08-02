import { BlockExpression, BlockStatement, ExpressionStatement, Program, StringLiteral } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('BlockStatement', () => {
    test('with 1 statement', () => expectTree(`
        {
            "helloo";
        }
        `,
        Program(
            BlockStatement(
                ExpressionStatement(
                    StringLiteral('helloo'))))))
})