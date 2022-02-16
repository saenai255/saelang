import { BlockStatement, ExpressionStatement, FireStatement, FunctionCall, Identifier, Program, StringLiteral } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('FireStatement', () => {
    test('fire function call', () => expectTree(
        `fire cpu_intensive_work();`,
        Program(
            FireStatement(
                FunctionCall(
                    Identifier('cpu_intensive_work'))))))
})