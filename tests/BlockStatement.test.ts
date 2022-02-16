import { BlockStatement, ExpressionStatement, Program, StringLiteral } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('BlockStatement', () => {
    test('Simple value using double quotes', () => expectTree(
        `{
            "helloo";
        }`,
        Program(
            BlockStatement(
                ExpressionStatement(
                    StringLiteral('helloo'))))))
})