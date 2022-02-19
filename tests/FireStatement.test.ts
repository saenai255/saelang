import { FireStatement, FunctionCall, Identifier, Program } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('FireStatement', () => {
    test('fire function call', () => expectTree(
        `fire cpu_intensive_work();`,
        Program(
            FireStatement(
                FunctionCall(
                    Identifier('cpu_intensive_work'))))))
})