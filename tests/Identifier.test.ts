import { ExpressionStatement, Identifier, Program } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('Identifier', () => {
    for (const identifierName of ['abc', 'abc0', '_0', '_', 'a', 'a_', 'Asd', 'sDa', 'SD_2'])
        test(`name '${identifierName}'`, () => expectTree(`${identifierName};`,
            Program(
                ExpressionStatement(
                    Identifier(identifierName)))))
})