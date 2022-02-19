import { BlockExpression, ExpressionStatement, Program, StringLiteral } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('BlockExpression', () => {
    test('Simple value using double quotes', () => expectTree(
        `{
            "helloo";
        }`,
        Program(
            BlockExpression(
                ExpressionStatement(
                    StringLiteral('helloo'))))))
})